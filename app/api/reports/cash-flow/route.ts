import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

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

    const cashInTransactions = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...where,
        type: TransactionType.DEBIT,
      },
    });

    const cashOutTransactions = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...where,
        type: TransactionType.CREDIT,
      },
    });

    const totalCashIn = cashInTransactions._sum.amount || 0;
    const totalCashOut = cashOutTransactions._sum.amount || 0;
    const netCashFlow = totalCashIn - totalCashOut;

    return NextResponse.json({
      totalCashIn,
      totalCashOut,
      netCashFlow,
    });
  } catch (error) {
    console.error("Error fetching cash flow report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
