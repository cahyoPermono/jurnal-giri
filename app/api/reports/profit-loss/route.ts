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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const debitTransactions = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...where,
        type: TransactionType.DEBIT,
      },
    });

    const creditTransactions = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...where,
        type: TransactionType.CREDIT,
      },
    });

    const totalDebit = debitTransactions._sum.amount?.toNumber() || 0;
    const totalCredit = creditTransactions._sum.amount?.toNumber() || 0;
    const netProfitLoss = totalDebit - totalCredit;

    return NextResponse.json({
      totalDebit,
      totalCredit,
      netProfitLoss,
    });
  } catch (error) {
    console.error("Error fetching profit/loss report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
