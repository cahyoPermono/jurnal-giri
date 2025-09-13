import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface BukuKasEntry {
  tanggal: string;
  no: number;
  uraian: string;
  debet: number;
  credit: number;
  saldo: number;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const minggu = searchParams.get("minggu");
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");

    if (!minggu || !bulan || !tahun) {
      return new NextResponse("Missing required parameters: minggu, bulan, tahun", { status: 400 });
    }

    const bulanNum = parseInt(bulan);
    const tahunNum = parseInt(tahun);

    // Hitung tanggal mulai dan akhir berdasarkan minggu
    let startDay: number, endDay: number;
    if (minggu === "1-2") {
      startDay = 1;
      endDay = 14;
    } else if (minggu === "3-4") {
      startDay = 15;
      endDay = new Date(tahunNum, bulanNum, 0).getDate(); // Hari terakhir bulan
    } else {
      return new NextResponse("Invalid minggu parameter", { status: 400 });
    }

    const startDate = new Date(tahunNum, bulanNum - 1, startDay);
    const endDate = new Date(tahunNum, bulanNum - 1, endDay, 23, 59, 59);

    // Ambil transaksi dalam rentang waktu
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        account: true,
      },
    });

    // Hitung saldo awal
    let saldoAwal = 0;
    if (transactions.length > 0) {
      // Ambil balanceBefore dari transaksi pertama
      saldoAwal = transactions[0].balanceBefore?.toNumber() || 0;
    } else {
      // Jika tidak ada transaksi, ambil saldo dari akun pada tanggal sebelum startDate
      const accountBalances = await prisma.financialAccount.findMany({
        select: {
          balance: true,
        },
      });
      saldoAwal = accountBalances.reduce((sum, acc) => sum + acc.balance.toNumber(), 0);
    }

    // Buat entries untuk tabel
    const entries: BukuKasEntry[] = [];

    // Baris pertama: Saldo awal
    entries.push({
      tanggal: "",
      no: 1,
      uraian: "Saldo yll",
      debet: saldoAwal,
      credit: 0,
      saldo: saldoAwal,
    });

    let currentSaldo = saldoAwal;
    let no = 2;
    let totalDebet = saldoAwal; // Mulai dengan saldo awal
    let totalCredit = 0;

    // Tambahkan transaksi
    for (const transaction of transactions) {
      const amount = transaction.amount.toNumber();
      let debet = 0;
      let credit = 0;

      if (transaction.type === "DEBIT") {
        debet = amount;
        currentSaldo += amount;
        totalDebet += amount;
      } else if (transaction.type === "CREDIT") {
        credit = amount;
        currentSaldo -= amount;
        totalCredit += amount;
      } else {
        // TRANSFER - skip atau handle differently
        continue;
      }

      entries.push({
        tanggal: transaction.date.toISOString().split('T')[0],
        no: no++,
        uraian: transaction.description,
        debet: debet,
        credit: credit,
        saldo: currentSaldo,
      });
    }

    // Tambahkan baris kosong
    entries.push({
      tanggal: "",
      no: 0,
      uraian: "",
      debet: 0,
      credit: 0,
      saldo: 0,
    });

    // Tambahkan baris total
    entries.push({
      tanggal: "",
      no: 0,
      uraian: "TOTAL",
      debet: totalDebet,
      credit: totalCredit,
      saldo: currentSaldo,
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching buku kas bulanan report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
