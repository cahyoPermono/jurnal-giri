import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const students = await prisma.student.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
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
    const { name, nis } = body;

    if (!name) {
      return new NextResponse("Missing student name", { status: 400 });
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        nis: nis || undefined, // Optional NIS, Prisma will generate if not provided
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_STUDENT",
        details: { studentId: newStudent.id, name: newStudent.name, nis: newStudent.nis },
        userId: session.user.id,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
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
    const { id, name, nis, active } = body;

    if (!id || !name) {
      return new NextResponse("Missing student ID or name", { status: 400 });
    }

    const oldStudent = await prisma.student.findUnique({ where: { id } });

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        name,
        nis: nis || undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_STUDENT",
        details: { studentId: updatedStudent.id, oldData: oldStudent, newData: updatedStudent },
        userId: session.user.id,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
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
      return new NextResponse("Missing student ID", { status: 400 });
    }

    const deletedStudent = await prisma.student.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_STUDENT",
        details: { studentId: deletedStudent.id, name: deletedStudent.name, nis: deletedStudent.nis },
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting student:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
