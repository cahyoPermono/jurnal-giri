import { getServerSession } from "next-auth";
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
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        financialAccount: true, // Include the related financial account
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, financialAccountId } = body;

    if (!name || !type) {
      return new NextResponse("Missing category name or type", { status: 400 });
    }

    if (!Object.values(TransactionType).includes(type)) {
      return new NextResponse("Invalid transaction type", { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        type,
        financialAccountId: financialAccountId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_CATEGORY",
        details: { categoryId: newCategory.id, name: newCategory.name, type: newCategory.type },
        userId: session.user.id,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, type, financialAccountId } = body;

    if (!id || !name || !type) {
      return new NextResponse("Missing category ID, name, or type", { status: 400 });
    }

    if (!Object.values(TransactionType).includes(type)) {
      return new NextResponse("Invalid transaction type", { status: 400 });
    }

    const oldCategory = await prisma.category.findUnique({ where: { id } });

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        type,
        financialAccountId: financialAccountId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_CATEGORY",
        details: { categoryId: updatedCategory.id, oldData: oldCategory, newData: updatedCategory },
        userId: session.user.id,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing category ID", { status: 400 });
    }

    const deletedCategory = await prisma.category.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_CATEGORY",
        details: { categoryId: deletedCategory.id, name: deletedCategory.name, type: deletedCategory.type },
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
