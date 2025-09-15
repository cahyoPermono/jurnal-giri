import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { liabilityId, description, amount, isFullPayment: markAsFullPayment = false } = body;

    if (!liabilityId || !description || !amount) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    // Start a Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find the liability
      const liability = await tx.liability.findUnique({
        where: { id: liabilityId },
        include: { transaction: true },
      });

      if (!liability) {
        throw new Error("Liability not found");
      }

      if (liability.status === "PAID") {
        throw new Error("Liability is already fully paid");
      }

      // Calculate remaining amount
      const paidAmount = (liability as any).paidAmount || 0;
      const remainingAmount = liability.amount.sub(paidAmount);

      // Validate payment amount doesn't exceed remaining
      if (parsedAmount > remainingAmount.toNumber()) {
        throw new Error(`Payment amount (${parsedAmount}) exceeds remaining amount (${remainingAmount.toNumber()})`);
      }

      // Get the account from the original transaction if it exists, otherwise from liability
      let currentAccount;
      if (liability.transaction) {
        // Use the same account as the original transaction
        currentAccount = await tx.financialAccount.findUnique({
          where: { id: liability.transaction.accountId },
        });
      } else if (liability.accountId) {
        // Use the account stored in liability (for CREDIT liabilities)
        currentAccount = await tx.financialAccount.findUnique({
          where: { id: liability.accountId },
        });
      } else {
        // Fallback: use default account
        currentAccount = await tx.financialAccount.findFirst();
      }

      if (!currentAccount) {
        throw new Error("No financial account found");
      }

      // Get the current balance from database to ensure accuracy
      const accountWithBalance = await tx.financialAccount.findUnique({
        where: { id: currentAccount.id },
        select: { balance: true }
      });

      if (!accountWithBalance) {
        throw new Error("Could not retrieve account balance");
      }

      const balanceBefore = accountWithBalance.balance;

      // Determine transaction type based on liability type
      let transactionType: TransactionType;
      let balanceAfter;

      if (liability.type === TransactionType.DEBIT) {
        // For DEBIT liability payment: borrower pays back (money comes in) → DEBIT transaction
        transactionType = TransactionType.DEBIT;
        balanceAfter = balanceBefore.add(parsedAmount);
      } else {
        // For CREDIT liability payment: we pay back what we borrowed (money goes out) → CREDIT transaction
        transactionType = TransactionType.CREDIT;
        balanceAfter = balanceBefore.sub(parsedAmount);
      }

      // Ensure balanceAfter is a valid Decimal
      if (typeof balanceAfter !== 'object' || !balanceAfter) {
        throw new Error("Invalid balance calculation result");
      }

      // Create payment transaction
      const paymentTransaction = await tx.transaction.create({
        data: {
          date: new Date(),
          description,
          amount: parsedAmount,
          type: transactionType,
          accountId: currentAccount.id,
          userId: session.user.id,
          // Denormalized fields for data integrity
          accountName: currentAccount.name,
          userName: session.user.name || session.user.email || "Unknown User",
          // Balance tracking
          balanceBefore,
          balanceAfter,
        },
      });

      // Create liability payment record
      const liabilityPayment = await (tx as any).liabilityPayment.create({
        data: {
          amount: parsedAmount,
          description,
          liabilityId: liability.id,
          transactionId: paymentTransaction.id,
          userId: session.user.id,
        },
      });

      // Calculate new paid amount and determine status
      const newPaidAmount = (liability as any).paidAmount.add(parsedAmount);
      const newRemainingAmount = liability.amount.sub(newPaidAmount);
      const newStatus = newRemainingAmount.isZero() ? "PAID" : liability.status;

      // Update liability
      const updatedLiability = await tx.liability.update({
        where: { id: liabilityId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          // Only set transactionId for full payment
          ...(newStatus === "PAID" && !liability.transactionId ? { transactionId: paymentTransaction.id } : {}),
        },
      });

      // Update financial account balance
      await tx.financialAccount.update({
        where: { id: currentAccount.id },
        data: { balance: balanceAfter },
      });

      // Create audit logs
      await tx.auditLog.create({
        data: {
          action: markAsFullPayment ? "PAY_LIABILITY_FULL" : "PAY_LIABILITY_PARTIAL",
          details: {
            liabilityId: liability.id,
            liabilityPaymentId: liabilityPayment.id,
            paymentTransactionId: paymentTransaction.id,
            vendorName: liability.vendorName,
            paymentAmount: parsedAmount,
            totalAmount: liability.amount,
            remainingAmount: newRemainingAmount,
            isFullPayment: markAsFullPayment,
          },
          userId: session.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `CREATE_TRANSACTION_${paymentTransaction.type}`,
          details: {
            transactionId: paymentTransaction.id,
            description: paymentTransaction.description,
            amount: paymentTransaction.amount,
            accountId: paymentTransaction.accountId,
            liabilityId: liability.id,
            liabilityPaymentId: liabilityPayment.id,
          },
          userId: session.user.id,
        },
      });

      return {
        paymentTransaction,
        liabilityPayment,
        updatedLiability,
        isFullPayment: newStatus === "PAID",
      };
    });

    const isFullPayment = result.updatedLiability.status === "PAID";
    return NextResponse.json({
      success: true,
      message: isFullPayment ? "Hutang berhasil dilunasi" : "Pembayaran cicil berhasil",
      data: result,
    }, { status: 200 });
  } catch (error) {
    console.error("Error paying liability:", error);
    return new NextResponse(
      JSON.stringify({
        message: error instanceof Error ? error.message : "Internal Server Error"
      }),
      { status: 500 }
    );
  }
}
