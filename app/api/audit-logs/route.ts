import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const [auditLogs, totalCount] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      auditLogs,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
