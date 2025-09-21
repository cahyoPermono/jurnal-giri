import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const liabilityId = searchParams.get("liabilityId");

    if (!liabilityId) {
      return new NextResponse("liabilityId is required", { status: 400 });
    }

    const payments = await (prisma as any).liabilityPayment.findMany({
      where: { liabilityId },
      include: {
        transaction: {
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            type: true,
            accountName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Convert Decimal amounts to numbers for frontend
    const formattedPayments = payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment.amount),
      transaction: payment.transaction ? {
        ...payment.transaction,
        amount: Number(payment.transaction.amount),
      } : null,
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error fetching liability payments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
