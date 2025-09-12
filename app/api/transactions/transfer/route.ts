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
    const { date, description, amount, sourceAccountId, destinationAccountId } = body;

    if (!date || !description || !amount || !sourceAccountId || !destinationAccountId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (sourceAccountId === destinationAccountId) {
      return new NextResponse("Source and destination accounts cannot be the same", { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    // Start a Prisma transaction to ensure atomicity for both debit and credit parts of the transfer
    const transferRecords = await prisma.$transaction(async (tx) => {
      // Fetch user for denormalization
      const user = await tx.user.findUnique({ where: { id: session.user.id } });
      if (!user) {
        throw new Error("User not found");
      }

      // Fetch both accounts first
      const sourceAccount = await tx.financialAccount.findUnique({
        where: { id: sourceAccountId },
      });

      if (!sourceAccount) {
        throw new Error("Source financial account not found");
      }

      const destinationAccount = await tx.financialAccount.findUnique({
        where: { id: destinationAccountId },
      });

      if (!destinationAccount) {
        throw new Error("Destination financial account not found");
      }

      // 1. Debit from source account
      const newSourceBalance = sourceAccount.balance.minus(parsedAmount);
      if (newSourceBalance.lessThan(0)) {
        throw new Error("Insufficient funds in source account");
      }

      await tx.financialAccount.update({
        where: { id: sourceAccountId },
        data: { balance: newSourceBalance },
      });

      const debitTransaction = await tx.transaction.create({
        data: {
          date: new Date(date),
          description: `Transfer to ${destinationAccount.name}: ${description}`,
          amount: parsedAmount,
          type: TransactionType.DEBIT,
          accountId: sourceAccountId,
          userId: session.user.id,
          // Denormalized fields for data integrity
          accountName: sourceAccount.name,
          userName: user.name || user.email || "Unknown User",
        },
      });

      // 2. Credit to destination account

      const newDestinationBalance = destinationAccount.balance.plus(parsedAmount);

      await tx.financialAccount.update({
        where: { id: destinationAccountId },
        data: { balance: newDestinationBalance },
      });

      const creditTransaction = await tx.transaction.create({
        data: {
          date: new Date(date),
          description: `Transfer from ${sourceAccount.name}: ${description}`,
          amount: parsedAmount,
          type: TransactionType.CREDIT,
          accountId: destinationAccountId,
          userId: session.user.id,
          // Denormalized fields for data integrity
          accountName: destinationAccount.name,
          userName: user.name || user.email || "Unknown User",
        },
      });

      // Link the two transactions for audit/tracking
      await tx.transaction.update({
        where: { id: debitTransaction.id },
        data: { relatedTransactionId: creditTransaction.id },
      });
      await tx.transaction.update({
        where: { id: creditTransaction.id },
        data: { relatedTransactionId: debitTransaction.id },
      });

      // Create audit log for transfer
      await tx.auditLog.create({
        data: {
          action: "CREATE_TRANSFER",
          details: {
            debitTransactionId: debitTransaction.id,
            creditTransactionId: creditTransaction.id,
            amount: parsedAmount,
            sourceAccountId: sourceAccountId,
            destinationAccountId: destinationAccountId,
          },
          userId: session.user.id,
        },
      });

      return { debitTransaction, creditTransaction };
    });

    return NextResponse.json(transferRecords, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transfer:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
