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

    // Calculate saldo awal (balance at beginning of month)
    const debitResult = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        date: {
          lt: startDate,
        },
        type: TransactionType.DEBIT,
      },
    });
    const creditResult = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        date: {
          lt: startDate,
        },
        type: TransactionType.CREDIT,
      },
    });
    const saldoAwal = (debitResult._sum.amount?.toNumber() || 0) - (creditResult._sum.amount?.toNumber() || 0);

    // Fetch debit transactions grouped by category
    const debitTransactions = await prisma.transaction.groupBy({
      by: ['categoryName'],
      _sum: {
        amount: true,
      },
      where: {
        type: TransactionType.DEBIT,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        categoryName: 'asc',
      },
    });

    // Fetch credit transactions grouped by category
    const creditTransactions = await prisma.transaction.groupBy({
      by: ['categoryName'],
      _sum: {
        amount: true,
      },
      where: {
        type: TransactionType.CREDIT,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        categoryName: 'asc',
      },
    });

    // Calculate totals
    const totalPenerimaan = debitTransactions.reduce((sum, item) => sum + (item._sum.amount?.toNumber() || 0), 0);
    const totalPengeluaran = creditTransactions.reduce((sum, item) => sum + (item._sum.amount?.toNumber() || 0), 0);
    const saldoAkhir = saldoAwal + totalPenerimaan - totalPengeluaran;

    // Build report data dynamically
    const report: any[] = [
      {
        no1: "",
        penerimaan: "Saldo awal",
        totalPenerimaan: saldoAwal,
        no2: "",
        pengeluaran: "",
        totalPengeluaran: "",
      },
    ];

    const maxRows = Math.max(debitTransactions.length, creditTransactions.length);

    for (let i = 0; i < maxRows; i++) {
      const debit = debitTransactions[i];
      const credit = creditTransactions[i];

      const debitCategory = debit ? (debit.categoryName || "Tanpa Kategori") : "";
      const debitAmount = debit ? (debit._sum.amount?.toNumber() || 0) : "";
      const creditCategory = credit ? (credit.categoryName || "Tanpa Kategori") : "";
      const creditAmount = credit ? (credit._sum.amount?.toNumber() || 0) : "";

      report.push({
        no1: debit ? i + 1 : "",
        penerimaan: debitCategory,
        totalPenerimaan: debitAmount,
        no2: credit ? i + 1 : "",
        pengeluaran: creditCategory,
        totalPengeluaran: creditAmount,
      });
    }

    // Add empty row
    report.push({
      no1: "",
      penerimaan: "",
      totalPenerimaan: "",
      no2: "",
      pengeluaran: "",
      totalPengeluaran: "",
    });

    // Add totals
    report.push({
      no1: "",
      penerimaan: "Total penerimaan",
      totalPenerimaan: totalPenerimaan,
      no2: "",
      pengeluaran: "Total Pengeluaran",
      totalPengeluaran: totalPengeluaran,
    });

    // Signature date
    const signatureDate = endDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return NextResponse.json({
      month: m,
      year: y,
      report,
      saldoAkhir,
      signatureDate,
    });
  } catch (error) {
    console.error("Error fetching laporan keuangan bulanan report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
