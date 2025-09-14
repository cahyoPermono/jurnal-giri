import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { daysAhead = 7 } = body; // Default 7 days ahead

    // Calculate the date range for reminders
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + daysAhead);

    // Find liabilities that are due within the specified days and still pending
    const upcomingLiabilities = await prisma.liability.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lte: reminderDate,
          gte: today,
        },
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
      orderBy: { dueDate: "asc" },
    });

    // Find overdue liabilities
    const overdueLiabilities = await prisma.liability.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: today,
        },
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
      orderBy: { dueDate: "asc" },
    });

    // Update overdue liabilities status
    if (overdueLiabilities.length > 0) {
      await prisma.liability.updateMany({
        where: {
          id: { in: overdueLiabilities.map(l => l.id) },
          status: "PENDING",
        },
        data: { status: "OVERDUE" },
      });

      // Create audit logs for status updates
      for (const liability of overdueLiabilities) {
        await prisma.auditLog.create({
          data: {
            action: "UPDATE_LIABILITY_STATUS",
            details: {
              liabilityId: liability.id,
              oldStatus: "PENDING",
              newStatus: "OVERDUE",
              dueDate: liability.dueDate,
            },
            userId: session.user.id,
          },
        });
      }
    }

    // Prepare reminder data
    const reminders = {
      upcoming: upcomingLiabilities.map(liability => ({
        id: liability.id,
        vendorName: liability.vendorName,
        amount: liability.amount,
        dueDate: liability.dueDate,
        daysUntilDue: Math.ceil((liability.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        description: liability.description || liability.transaction?.description,
        transactionId: liability.transaction?.id,
      })),
      overdue: overdueLiabilities.map(liability => ({
        id: liability.id,
        vendorName: liability.vendorName,
        amount: liability.amount,
        dueDate: liability.dueDate,
        daysOverdue: Math.ceil((today.getTime() - liability.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        description: liability.description || liability.transaction?.description,
        transactionId: liability.transaction?.id,
      })),
    };

    // Create audit log for reminder generation
    await prisma.auditLog.create({
      data: {
        action: "GENERATE_LIABILITY_REMINDERS",
        details: {
          daysAhead,
          upcomingCount: reminders.upcoming.length,
          overdueCount: reminders.overdue.length,
          totalAmount: {
            upcoming: reminders.upcoming.reduce((sum, l) => sum + l.amount.toNumber(), 0),
            overdue: reminders.overdue.reduce((sum, l) => sum + l.amount.toNumber(), 0),
          },
        },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ditemukan ${reminders.upcoming.length} hutang yang akan jatuh tempo dan ${reminders.overdue.length} hutang yang sudah overdue`,
      data: reminders,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating liability reminders:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get("daysAhead") || "7");

    // Get summary of upcoming liabilities
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + daysAhead);

    const [upcomingCount, overdueCount, totalPendingAmount, totalOverdueAmount] = await Promise.all([
      prisma.liability.count({
        where: {
          status: "PENDING",
          dueDate: {
            lte: reminderDate,
            gte: today,
          },
        },
      }),
      prisma.liability.count({
        where: {
          status: "OVERDUE",
        },
      }),
      prisma.liability.aggregate({
        where: {
          status: "PENDING",
          dueDate: {
            lte: reminderDate,
            gte: today,
          },
        },
        _sum: { amount: true },
      }),
      prisma.liability.aggregate({
        where: { status: "OVERDUE" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      upcomingCount,
      overdueCount,
      totalPendingAmount: totalPendingAmount._sum.amount || 0,
      totalOverdueAmount: totalOverdueAmount._sum.amount || 0,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching liability reminder summary:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
