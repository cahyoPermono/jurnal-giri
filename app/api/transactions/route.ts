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
    const { date, description, amount, type, accountId, categoryId, studentId } = body;

    if (!date || !description || !amount || !type || !accountId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!Object.values(TransactionType).includes(type)) {
      return new NextResponse("Invalid transaction type", { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    // Start a Prisma transaction to ensure atomicity
    const transactionRecord = await prisma.$transaction(async (tx) => {
      // Fetch related data for denormalization
      const [account, category, student, user] = await Promise.all([
        tx.financialAccount.findUnique({ where: { id: accountId } }),
        categoryId ? tx.category.findUnique({ where: { id: categoryId } }) : null,
        studentId ? tx.student.findUnique({ where: { id: studentId } }) : null,
        tx.user.findUnique({ where: { id: session.user.id } })
      ]);

      if (!account) {
        throw new Error("Financial account not found");
      }

      if (!user) {
        throw new Error("User not found");
      }

      // Get current balance before transaction
      const currentAccount = await tx.financialAccount.findUnique({
        where: { id: accountId },
      });

      if (!currentAccount) {
        throw new Error("Financial account not found");
      }

      const balanceBefore = currentAccount.balance;
      let balanceAfter = currentAccount.balance;

      if (type === TransactionType.DEBIT) {
        balanceAfter = balanceAfter.plus(parsedAmount);
      } else if (type === TransactionType.CREDIT) {
        balanceAfter = balanceAfter.minus(parsedAmount);
      }

      const newTransaction = await tx.transaction.create({
        data: {
          date: new Date(date),
          description,
          amount: parsedAmount,
          type,
          accountId,
          categoryId: categoryId || null,
          studentId: studentId || null,
          userId: session.user.id, // Associate transaction with the logged-in user
          // Denormalized fields for data integrity
          accountName: account.name,
          categoryName: category?.name || null,
          studentName: student?.name || null,
          userName: user.name || user.email || "Unknown User",
          // Balance tracking
          balanceBefore,
          balanceAfter,
        },
      });

      // Create audit log for transaction creation
      await tx.auditLog.create({
        data: {
          action: `CREATE_TRANSACTION_${newTransaction.type}`,
          details: {
            transactionId: newTransaction.id,
            description: newTransaction.description,
            amount: newTransaction.amount,
            accountId: newTransaction.accountId,
            categoryId: newTransaction.categoryId,
            studentId: newTransaction.studentId,
          },
          userId: session.user.id,
        },
      });

      // Update financial account balance
      await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: balanceAfter },
      });

      return newTransaction;
    });

    return NextResponse.json(transactionRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const studentId = searchParams.get("studentId");

    const where: any = {};

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }
    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      where.type = type;
    }
    if (accountId) {
      where.accountId = accountId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
