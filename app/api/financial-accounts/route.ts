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
    const financialAccounts = await prisma.financialAccount.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(financialAccounts);
  } catch (error) {
    console.error("Error fetching financial accounts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
