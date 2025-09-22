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

    // Get detailed breakdown by categories
    const debitByCategoryRaw = await prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: {
        amount: true,
      },
      where: {
        ...where,
        type: TransactionType.DEBIT,
      },
    });

    const creditByCategoryRaw = await prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: {
        amount: true,
      },
      where: {
        ...where,
        type: TransactionType.CREDIT,
      },
    });

    // Get category names
    const categoryIds = [...new Set([
      ...debitByCategoryRaw.map(d => d.categoryId).filter(Boolean),
      ...creditByCategoryRaw.map(c => c.categoryId).filter(Boolean)
    ])] as string[];

    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds }
      },
      select: {
        id: true,
        name: true,
      }
    });

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const totalDebit = debitTransactions._sum.amount?.toNumber() || 0;
    const totalCredit = creditTransactions._sum.amount?.toNumber() || 0;
    const netProfitLoss = totalDebit - totalCredit;

    // Format category breakdowns
    const incomeBreakdown = debitByCategoryRaw.map(item => ({
      category: item.categoryId ? categoryMap.get(item.categoryId) || 'Uncategorized' : 'Uncategorized',
      amount: item._sum.amount?.toNumber() || 0,
    }));

    const expenseBreakdown = creditByCategoryRaw.map(item => ({
      category: item.categoryId ? categoryMap.get(item.categoryId) || 'Uncategorized' : 'Uncategorized',
      amount: item._sum.amount?.toNumber() || 0,
    }));

    return NextResponse.json({
      totalDebit,
      totalCredit,
      netProfitLoss,
      incomeBreakdown,
      expenseBreakdown,
    });
  } catch (error) {
    console.error("Error fetching profit/loss report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
