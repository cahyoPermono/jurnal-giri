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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const students = await prisma.student.findMany({
      include: {
        transactions: {
          where: {
            ...where,
            // Only consider DEBIT and CREDIT for liabilities calculation
            type: { in: [TransactionType.DEBIT, TransactionType.CREDIT] },
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const reportData = students.map(student => {
      let totalDebit = 0;
      let totalCredit = 0;

      student.transactions.forEach(transaction => {
        if (transaction.type === TransactionType.DEBIT) {
          totalDebit += transaction.amount.toNumber();
        } else if (transaction.type === TransactionType.CREDIT) {
          totalCredit += transaction.amount.toNumber();
        }
      });

      // Liability = Total Credit (payments due from student) - Total Debit (payments received from student)
      const liability = totalCredit - totalDebit;

      return {
        id: student.id,
        name: student.name,
        nis: student.nis,
        liability: liability,
        transactions: student.transactions.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount.toNumber(),
          type: t.type,
        })),
      };
    });

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error fetching student liabilities report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
