import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  try {
    if (key) {
      // Jika ada parameter key, ambil parameter spesifik (untuk operator)
      const parameter = await prisma.parameter.findUnique({
        where: { key },
      });

      if (!parameter) {
        // Jika parameter student_groups tidak ada, buat default
        if (key === "student_groups") {
          const defaultGroups = await prisma.parameter.upsert({
            where: { key: "student_groups" },
            update: {},
            create: {
              key: "student_groups",
              value: '["Kupu-kupu", "Kumbang", "Lebah", "Semut", "Capung", "Kupu-kupu 2", "Kumbang 2"]',
            },
          });
          return NextResponse.json(defaultGroups);
        }
        return new NextResponse("Parameter not found", { status: 404 });
      }

      return NextResponse.json(parameter);
    } else {
      // Jika tidak ada key, ambil semua parameter (hanya untuk admin)
      if (session.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const parameters = await prisma.parameter.findMany({
        orderBy: { key: "asc" },
      });
      return NextResponse.json(parameters);
    }
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const existingParameter = await prisma.parameter.findUnique({ where: { key } });
    if (existingParameter) {
      return new NextResponse("Parameter with this key already exists", { status: 409 });
    }

    const newParameter = await prisma.parameter.create({
      data: {
        key,
        value,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_PARAMETER",
        details: { parameterId: newParameter.id, key: newParameter.key, value: newParameter.value },
        userId: session.user.id,
      },
    });

    return NextResponse.json(newParameter, { status: 201 });
  } catch (error) {
    console.error("Error creating parameter:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const updatedParameter = await prisma.parameter.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_PARAMETER",
        details: { parameterId: updatedParameter.id, key: updatedParameter.key, value: updatedParameter.value },
        userId: session.user.id,
      },
    });

    return NextResponse.json(updatedParameter);
  } catch (error) {
    console.error("Error updating parameter:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return new NextResponse("Missing parameter key", { status: 400 });
    }

    const deletedParameter = await prisma.parameter.delete({
      where: { key },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_PARAMETER",
        details: { parameterId: deletedParameter.id, key: deletedParameter.key, value: deletedParameter.value },
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting parameter:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
