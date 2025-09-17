import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "OPERATOR")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const amount = formData.get("amount") as string;
    const type = formData.get("type") as TransactionType;
    const accountId = formData.get("accountId") as string;
    const categoryId = formData.get("categoryId") as string;
    const studentId = formData.get("studentId") as string;
    const proofFile = formData.get("proofFile") as File | null;

    // Liability related fields
    const isLiability = formData.get("isLiability") === "true";
    const vendorName = formData.get("vendorName") as string;
    const dueDate = formData.get("dueDate") as string;
    const liabilityDescription = formData.get("liabilityDescription") as string;
    const liabilityNotes = formData.get("liabilityNotes") as string;

    if (!date || !description || !amount || !type || !accountId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!Object.values(TransactionType).includes(type)) {
      return new NextResponse("Invalid transaction type", { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    let proofFilePath: string | null = null;

    // Handle file upload if provided
    if (proofFile) {
      // Check file size (1MB limit)
      if (proofFile.size > 1024 * 1024) {
        return new NextResponse("File size must be less than 1MB", { status: 400 });
      }

      // Check file type (allow common image and document types)
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(proofFile.type)) {
        return new NextResponse("Invalid file type. Only images, PDF, and Word documents are allowed", { status: 400 });
      }

      // Generate unique filename
      const fileExtension = proofFile.name.split('.').pop();
      const uniqueFilename = `${randomUUID()}.${fileExtension}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');

      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });

      // Save file
      const filePath = join(uploadDir, uniqueFilename);
      const bytes = await proofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      proofFilePath = `/uploads/${uniqueFilename}`;
    }

    // Start a Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Fetch related data for denormalization
      const [account, category, student, user] = await Promise.all([
        tx.financialAccount.findUnique({ where: { id: accountId } }),
        categoryId && categoryId !== "none" ? tx.category.findUnique({ where: { id: categoryId } }) : null,
        studentId && studentId !== "none" ? tx.student.findUnique({ where: { id: studentId } }) : null,
        tx.user.findUnique({ where: { id: session.user.id } })
      ]);

      if (!account) {
        throw new Error("Financial account not found");
      }

      if (!user) {
        throw new Error("User not found");
      }

      let transactionRecord = null;

      // Handle liability transactions differently
      if (isLiability) {
        // For liability: create both liability record AND transaction record
        if (!vendorName || !dueDate) {
          throw new Error("Vendor name and due date are required for liability transactions");
        }

        // Handle DEBIT and CREDIT liabilities differently
        if (type === TransactionType.DEBIT) {
          // For DEBIT liability: we lend money, so money goes out (CREDIT transaction)
          const actualTransactionType = TransactionType.CREDIT;

          // Get current balance for transaction
          const currentAccount = await tx.financialAccount.findUnique({
            where: { id: accountId },
          });

          if (!currentAccount) {
            throw new Error("Financial account not found");
          }

          const balanceBefore = currentAccount.balance;
          const balanceAfter = currentAccount.balance.minus(parsedAmount); // Money goes out

          // Create the transaction record
          transactionRecord = await tx.transaction.create({
            data: {
              date: new Date(date),
              description,
              amount: parsedAmount,
              type: actualTransactionType,
              accountId,
              categoryId: categoryId && categoryId !== "none" ? categoryId : null,
              studentId: studentId && studentId !== "none" ? studentId : null,
              userId: session.user.id,
              // Denormalized fields for data integrity
              accountName: account.name,
              categoryName: category?.name || null,
              studentName: student?.name || null,
              userName: user.name || user.email || "Unknown User",
              // Balance tracking
              balanceBefore,
              balanceAfter,
              // Optional proof file
              proofFile: proofFilePath,
            },
          });

          // Update financial account balance
          await tx.financialAccount.update({
            where: { id: accountId },
            data: { balance: balanceAfter },
          });

          // Create the liability record
          const liabilityRecord = await tx.liability.create({
            data: {
              vendorName,
              amount: parsedAmount,
              dueDate: new Date(dueDate),
              type: type, // Store the liability type (CREDIT)
              description: liabilityDescription || description,
              notes: liabilityNotes,
              userId: session.user.id,
              accountId: accountId, // Store the account for future payments
              // No transactionId for CREDIT liabilities (no transaction created)
            },
          });

          // Create audit logs
          await tx.auditLog.create({
            data: {
              action: "CREATE_LIABILITY",
              details: {
                liabilityId: liabilityRecord.id,
                transactionId: transactionRecord.id,
                vendorName: liabilityRecord.vendorName,
                amount: liabilityRecord.amount,
                dueDate: liabilityRecord.dueDate,
                liabilityType: liabilityRecord.type,
                description: liabilityRecord.description,
              },
              userId: session.user.id,
            },
          });

          await tx.auditLog.create({
            data: {
              action: `CREATE_TRANSACTION_${transactionRecord.type}`,
              details: {
                transactionId: transactionRecord.id,
                liabilityId: liabilityRecord.id,
                description: transactionRecord.description,
                amount: transactionRecord.amount,
                accountId: transactionRecord.accountId,
                categoryId: transactionRecord.categoryId,
                studentId: transactionRecord.studentId,
                proofFile: proofFilePath,
              },
              userId: session.user.id,
            },
          });

          return { liabilityRecord, transactionRecord };
        } else {
          // For CREDIT liability: we borrow money, but no money movement yet (no transaction)
          // Create the liability record without transaction
          const liabilityRecord = await tx.liability.create({
            data: {
              vendorName,
              amount: parsedAmount,
              dueDate: new Date(dueDate),
              type: type, // Store the liability type (CREDIT)
              description: liabilityDescription || description,
              notes: liabilityNotes,
              userId: session.user.id,
              accountId: accountId, // Store the account for future payments
              // No transactionId for CREDIT liabilities (no transaction created)
            },
          });

          // Create audit log for liability creation
          await tx.auditLog.create({
            data: {
              action: "CREATE_LIABILITY",
              details: {
                liabilityId: liabilityRecord.id,
                vendorName: liabilityRecord.vendorName,
                amount: liabilityRecord.amount,
                dueDate: liabilityRecord.dueDate,
                liabilityType: liabilityRecord.type,
                description: liabilityRecord.description,
              },
              userId: session.user.id,
            },
          });

          return liabilityRecord;
        }
      } else {
        // Normal transaction: create transaction record
        // Get current balance before transaction
        const currentAccount = await tx.financialAccount.findUnique({
          where: { id: accountId },
        });

        if (!currentAccount) {
          throw new Error("Financial account not found");
        }

        const balanceBefore = currentAccount.balance;
        let balanceAfter = currentAccount.balance;

        // Normal transaction logic
        if (type === TransactionType.DEBIT) {
          balanceAfter = balanceAfter.plus(parsedAmount);
        } else if (type === TransactionType.CREDIT) {
          balanceAfter = balanceAfter.minus(parsedAmount);
        }

        transactionRecord = await tx.transaction.create({
          data: {
            date: new Date(date),
            description,
            amount: parsedAmount,
            type,
            accountId,
            categoryId: categoryId && categoryId !== "none" ? categoryId : null,
            studentId: studentId && studentId !== "none" ? studentId : null,
            userId: session.user.id, // Associate transaction with the logged-in user
            // Denormalized fields for data integrity
            accountName: account.name,
            categoryName: category?.name || null,
            studentName: student?.name || null,
            userName: user.name || user.email || "Unknown User",
            // Balance tracking
            balanceBefore,
            balanceAfter,
            // Optional proof file
            proofFile: proofFilePath,
          },
        });

        // Create audit log for transaction creation
        await tx.auditLog.create({
          data: {
            action: `CREATE_TRANSACTION_${transactionRecord.type}`,
            details: {
              transactionId: transactionRecord.id,
              description: transactionRecord.description,
              amount: transactionRecord.amount,
              accountId: transactionRecord.accountId,
              categoryId: transactionRecord.categoryId,
              studentId: transactionRecord.studentId,
              proofFile: proofFilePath,
            },
            userId: session.user.id,
          },
        });

        // Update financial account balance
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { balance: balanceAfter },
        });

        return transactionRecord;
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const studentId = searchParams.get("studentId");

    const where: any = {};

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }
    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      where.type = type;
    }
    if (accountId) {
      where.accountId = accountId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (studentId) {
      where.studentId = studentId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            nis: true,
            group: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Transform the data to include student details in the transaction object
    const transformedTransactions = transactions.map((transaction) => ({
      ...transaction,
      studentName: transaction.student?.name || null,
      studentNis: transaction.student?.nis || null,
      studentGroup: transaction.student?.group || null,
    }));

    return NextResponse.json(transformedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
