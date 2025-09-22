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
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!month || !year || !type) {
      return new NextResponse("Missing required parameters: month, year, type", { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ message: "Invalid pagination parameters" }, { status: 400 });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    if (m < 1 || m > 12) {
      return new NextResponse("Invalid month", { status: 400 });
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59); // Last day of month

    // Determine transaction type based on user selection
    const transactionType = type === "pengeluaran" ? TransactionType.CREDIT : TransactionType.DEBIT;

    // Fetch transactions in the range
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: transactionType,
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
        amount: tx.amount.toNumber(),
        saldo: runningBalance,
      };
    });

    // Apply pagination to the report
    const totalReportRows = report.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReport = report.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalReportRows / limit);

    return NextResponse.json({
      month: m,
      year: y,
      type,
      report: paginatedReport,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalReportRows,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching rekap penerimaan bulan report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
