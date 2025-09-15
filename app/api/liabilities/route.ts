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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const vendor = searchParams.get("vendor");

    const where: any = {};

    if (startDate) {
      where.dueDate = { ...where.dueDate, gte: new Date(startDate) };
    }
    if (endDate) {
      where.dueDate = { ...where.dueDate, lte: new Date(endDate) };
    }
    if (status && ["PENDING", "PAID", "OVERDUE"].includes(status)) {
      where.status = status;
    }
    if (vendor) {
      where.vendorName = { contains: vendor, mode: "insensitive" };
    }

    const liabilities = await prisma.liability.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            date: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Update status for liabilities that are overdue
    const now = new Date();
    const updatedLiabilities = await Promise.all(
      liabilities.map(async (liability) => {
        if (liability.status === "PENDING" && new Date(liability.dueDate) < now) {
          await prisma.liability.update({
            where: { id: liability.id },
            data: { status: "OVERDUE" },
          });
          return { ...liability, status: "OVERDUE" };
        }
        return liability;
      })
    );

    // Convert Decimal amounts to numbers for frontend
    const formattedLiabilities = updatedLiabilities.map(liability => {
      const paidAmount = (liability as any).paidAmount || 0;
      return {
        ...liability,
        amount: Number(liability.amount),
        paidAmount: Number(paidAmount),
        remainingAmount: Number(liability.amount.sub(paidAmount)),
      };
    });

    return NextResponse.json(formattedLiabilities);
  } catch (error) {
    console.error("Error fetching liabilities:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { vendorName, amount, dueDate, description, notes, transactionId } = body;

    if (!vendorName || !amount || !dueDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const liability = await prisma.liability.create({
      data: {
        vendorName,
        amount: parsedAmount,
        dueDate: new Date(dueDate),
        description,
        notes,
        transactionId,
        userId: session.user.id,
      },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            date: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE_LIABILITY",
        details: {
          liabilityId: liability.id,
          vendorName: liability.vendorName,
          amount: liability.amount,
          dueDate: liability.dueDate,
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json(liability, { status: 201 });
  } catch (error) {
    console.error("Error creating liability:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
