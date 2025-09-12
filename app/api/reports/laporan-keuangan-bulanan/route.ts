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

    // Helper function to sum transactions
    const sumTransactions = async (where: any) => {
      const result = await prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          ...where,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      return result._sum.amount?.toNumber() || 0;
    };

    // Penerimaan
    const kasSPP = await sumTransactions({
      account: { name: "SPP" },
      type: TransactionType.DEBIT,
    });

    const pendaftaran = await sumTransactions({
      account: { name: "Pendaftaran" },
      type: TransactionType.DEBIT,
    });

    const uangKegiatan = await sumTransactions({
      account: { name: "Kegiatan" },
      type: TransactionType.DEBIT,
    });

    const lainLain = await sumTransactions({
      account: { name: "Lain-lain" },
      type: TransactionType.DEBIT,
    });

    const pinjamSementara = 0; // Empty

    // Pengeluaran
    const rutin = await sumTransactions({
      category: { name: "Rutin" },
      type: TransactionType.CREDIT,
    });

    const kegiatanPengeluaran = await sumTransactions({
      category: { name: "Kegiatan" },
      type: TransactionType.CREDIT,
    });

    const bayarPinjaman = 0; // Empty

    const setorBank = await sumTransactions({
      category: { name: "Setor bank" },
      type: TransactionType.CREDIT,
    });

    // Totals
    const totalPenerimaan = kasSPP + pendaftaran + uangKegiatan + lainLain + pinjamSementara;
    const totalPengeluaran = rutin + kegiatanPengeluaran + bayarPinjaman + setorBank;
    const saldoAkhir = saldoAwal + totalPenerimaan - totalPengeluaran;

    // Report data
    const report = [
      {
        no1: "",
        penerimaan: "Saldo awal",
        totalPenerimaan: saldoAwal,
        no2: "",
        pengeluaran: "",
        totalPengeluaran: "",
      },
      {
        no1: 1,
        penerimaan: "Kas SPP",
        totalPenerimaan: kasSPP,
        no2: 1,
        pengeluaran: "Rutin",
        totalPengeluaran: rutin,
      },
      {
        no1: 2,
        penerimaan: "Pendaftaran",
        totalPenerimaan: pendaftaran,
        no2: 2,
        pengeluaran: "Kegiatan",
        totalPengeluaran: kegiatanPengeluaran,
      },
      {
        no1: 3,
        penerimaan: "Uang Kegiatan",
        totalPenerimaan: uangKegiatan,
        no2: 3,
        pengeluaran: "Bayar pinjaman",
        totalPengeluaran: "",
      },
      {
        no1: 4,
        penerimaan: "lain-lain",
        totalPenerimaan: lainLain,
        no2: 4,
        pengeluaran: "Setor bank",
        totalPengeluaran: setorBank,
      },
      {
        no1: 5,
        penerimaan: "Pinjam sementara",
        totalPenerimaan: "",
        no2: "",
        pengeluaran: "",
        totalPengeluaran: "",
      },
      {
        no1: "",
        penerimaan: "",
        totalPenerimaan: "",
        no2: "",
        pengeluaran: "",
        totalPengeluaran: "",
      },
      {
        no1: "",
        penerimaan: "Total penerimaan",
        totalPenerimaan: totalPenerimaan,
        no2: "",
        pengeluaran: "Total Pengeluaran",
        totalPengeluaran: totalPengeluaran,
      },
    ];

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
