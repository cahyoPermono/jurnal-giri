import { getServerSession } from "next-auth/next";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ message: "Invalid pagination parameters" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.student.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      students,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, nis, parentName, contactNumber, group, enrollmentDate, graduationDate } = body;

    if (!name) {
      return NextResponse.json({ message: "Missing student name" }, { status: 400 });
    }

    let finalNis = nis;
    if (!finalNis) {
      // Auto-generate NIS: YYYYMM + sequential number
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}${month}`;

      const lastStudent = await prisma.student.findFirst({
        where: { nis: { startsWith: prefix } },
        orderBy: { nis: 'desc' }
      });

      let sequence = 1;
      if (lastStudent) {
        const lastSeq = parseInt(lastStudent.nis.slice(-2));
        sequence = lastSeq + 1;
      }

      finalNis = `${prefix}${String(sequence).padStart(2, '0')}`;
    }

    const newStudent = await prisma.student.create({
      data: {
        name,
        nis: finalNis,
        parentName: parentName || undefined,
        contactNumber: contactNumber || undefined,
        group: group || undefined,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
        graduationDate: graduationDate ? new Date(graduationDate) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_STUDENT",
        details: { studentId: newStudent.id, name: newStudent.name, nis: newStudent.nis, parentName: newStudent.parentName, contactNumber: newStudent.contactNumber, enrollmentDate: newStudent.enrollmentDate, graduationDate: newStudent.graduationDate },
        userId: session.user.id,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    console.error("Error creating student:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Student with this NIS already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, nis, parentName, contactNumber, group, active, enrollmentDate, graduationDate } = body;

    if (!id || !name) {
      return NextResponse.json({ message: "Missing student ID or name" }, { status: 400 });
    }

    const oldStudent = await prisma.student.findUnique({ where: { id } });

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        name,
        nis: nis || undefined,
        parentName: parentName || undefined,
        contactNumber: contactNumber || undefined,
        group: group || undefined,
        active: active !== undefined ? active : undefined,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
        graduationDate: graduationDate ? new Date(graduationDate) : undefined,
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
  } catch (error: any) {
    console.error("Error updating student:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Student with this NIS already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Missing student ID" }, { status: 400 });
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
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
