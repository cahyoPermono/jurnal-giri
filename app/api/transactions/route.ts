import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

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
      const financialAccount = await tx.financialAccount.findUnique({
        where: { id: accountId },
      });

      if (!financialAccount) {
        throw new Error("Financial account not found");
      }

      let newBalance = financialAccount.balance;
      if (type === TransactionType.DEBIT) {
        newBalance = newBalance.plus(parsedAmount);
      } else if (type === TransactionType.CREDIT) {
        newBalance = newBalance.minus(parsedAmount);
      }

      await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
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
  const session = await getServerSession(authOptions);

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
      include: { account: true, category: true, student: true, user: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
