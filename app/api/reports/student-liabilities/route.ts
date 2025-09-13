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
    // Fetch parameters from database
    const sppParam = await prisma.parameter.findUnique({ where: { key: "spp_amount" } });
    const registrationParam = await prisma.parameter.findUnique({ where: { key: "registration_fee" } });

    const MONTHLY_SPP_FEE = sppParam ? parseInt(sppParam.value) : 50000; // Default to 50000 if not found
    const REGISTRATION_FEE = registrationParam ? parseInt(registrationParam.value) : 100000; // Default to 100000 if not found

    const students = await prisma.student.findMany({
      where: {
        active: true,
        enrollmentDate: { not: null },
      },
      include: {
        transactions: {
          where: {
            type: TransactionType.DEBIT,
          },
          include: {
            account: true,
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const reportData = students.map(student => {
      const enrollmentDate = student.enrollmentDate!;
      const now = new Date();
      const enrollmentYear = enrollmentDate.getFullYear();
      const enrollmentMonth = enrollmentDate.getMonth();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Calculate months since enrollment
      const monthsSinceEnrollment = (currentYear - enrollmentYear) * 12 + (currentMonth - enrollmentMonth) + 1;

      const unpaidItems: { type: string; month?: string; amount: number }[] = [];

      // Check registration payment
      const registrationPaid = student.transactions.some(tx => tx.account.name === 'Pendaftaran');
      if (!registrationPaid) {
        unpaidItems.push({ type: 'Registration', amount: REGISTRATION_FEE });
      }

      // Check monthly SPP payments
      for (let i = 0; i < monthsSinceEnrollment; i++) {
        const paymentDate = new Date(enrollmentYear, enrollmentMonth + i, 1);
        const monthName = paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const sppPaid = student.transactions.some(tx =>
          tx.account.name === 'SPP' &&
          tx.date.getMonth() === paymentDate.getMonth() &&
          tx.date.getFullYear() === paymentDate.getFullYear()
        );
        if (!sppPaid) {
          unpaidItems.push({ type: 'SPP', month: monthName, amount: MONTHLY_SPP_FEE });
        }
      }

      return {
        id: student.id,
        name: student.name,
        nis: student.nis,
        unpaidItems: unpaidItems,
        transactions: student.transactions.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount.toNumber(),
          type: t.type,
        })),
      };
    }).filter(student => student.unpaidItems.length > 0);

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error fetching student liabilities report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
