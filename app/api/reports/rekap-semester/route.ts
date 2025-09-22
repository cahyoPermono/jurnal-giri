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
    const semester = searchParams.get("semester");
    const academicYear = searchParams.get("academicYear");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!semester || !academicYear) {
      return new NextResponse("Missing required parameters: semester, academicYear", { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ message: "Invalid pagination parameters" }, { status: 400 });
    }

    const sem = parseInt(semester);
    if (sem !== 1 && sem !== 2) {
      return new NextResponse("Invalid semester", { status: 400 });
    }

    const [startYear, endYear] = academicYear.split("/").map(Number);
    if (!startYear || !endYear) {
      return new NextResponse("Invalid academic year format", { status: 400 });
    }

    let startMonth, endMonth, year;
    if (sem === 1) {
      startMonth = 7; // July
      endMonth = 12; // December
      year = startYear;
    } else {
      startMonth = 1; // January
      endMonth = 6; // June
      year = endYear;
    }

    const startDate = new Date(year, startMonth - 1, 1); // Month is 0-indexed
    const endDate = new Date(year, endMonth, 0, 23, 59, 59); // Last day of endMonth

    // Fetch transactions in the range
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        amount: true,
        type: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month
    const monthlyData: { [key: string]: { debit: number; credit: number } } = {};

    transactions.forEach((tx) => {
      const month = tx.date.getMonth() + 1; // 1-12
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { debit: 0, credit: 0 };
      }
      if (tx.type === TransactionType.DEBIT) {
        monthlyData[key].debit += tx.amount.toNumber();
      } else if (tx.type === TransactionType.CREDIT) {
        monthlyData[key].credit += tx.amount.toNumber();
      }
    });

    // Generate months list
    const months = [];
    for (let m = startMonth; m <= endMonth; m++) {
      months.push(m);
    }

    // Calculate balances
    let runningBalance = 0; // Starting balance
    const report = months.map((month) => {
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const data = monthlyData[key] || { debit: 0, credit: 0 };
      const saldoAwal = runningBalance;
      const penerimaan = data.debit;
      const pengeluaran = data.credit;
      const saldoAkhir = saldoAwal + penerimaan - pengeluaran;
      runningBalance = saldoAkhir;

      return {
        bulan: month,
        saldoAwal,
        penerimaan,
        pengeluaran,
        saldoAkhir,
      };
    });

    // Apply pagination to the report
    const totalReportRows = report.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReport = report.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalReportRows / limit);

    return NextResponse.json({
      semester: sem,
      academicYear,
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
    console.error("Error fetching rekap semester report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
