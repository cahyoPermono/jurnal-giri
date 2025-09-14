import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Total balance and individual account balances
    const financialAccounts = await prisma.financialAccount.findMany({
      select: { id: true, name: true, balance: true, isBank: true },
      orderBy: { name: "asc" },
    });

    // Calculate total balance excluding bank accounts
    const totalBalance = financialAccounts
      .filter(account => !account.isBank)
      .reduce((sum, account) => sum + account.balance.toNumber(), 0);

    // Monthly Debit vs. Credit for graph
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyDebit = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: TransactionType.DEBIT,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const monthlyCredit = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: TransactionType.CREDIT,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalMonthlyDebit = monthlyDebit._sum.amount || 0;
    const totalMonthlyCredit = monthlyCredit._sum.amount || 0;

    // Notifications (e.g., students with overdue payments - placeholder for now)
    // This would require more complex logic based on payment schedules and student transactions
    const notifications: any[] = [
      // { type: "warning", message: "Student A has overdue SPP payment." },
      // { type: "info", message: "Upcoming event payment due." },
    ];

    return NextResponse.json({
      totalBalance,
      financialAccounts,
      monthlySummary: {
        totalDebit: totalMonthlyDebit,
        totalCredit: totalMonthlyCredit,
      },
      notifications,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
