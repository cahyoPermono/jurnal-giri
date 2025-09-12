import { getServerSession } from "next-auth/next";
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
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return new NextResponse("Month and year are required", { status: 400 });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    if (m < 1 || m > 12) {
      return new NextResponse("Invalid month", { status: 400 });
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59); // Last day of month

    // Fetch debit transactions in the range
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: TransactionType.DEBIT,
      },
      select: {
        date: true,
        description: true,
        amount: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Build report with running balance
    let runningBalance = 0;
    const report = transactions.map((tx, index) => {
      runningBalance += tx.amount.toNumber();
      return {
        no: index + 1,
        tanggal: tx.date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        uraian: tx.description,
        debet: tx.amount.toNumber(),
        saldo: runningBalance,
      };
    });

    return NextResponse.json({
      month: m,
      year: y,
      report,
    });
  } catch (error) {
    console.error("Error fetching rekap penerimaan bulan report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
