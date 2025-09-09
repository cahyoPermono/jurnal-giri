import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  const hashedPasswordAdmin = await bcrypt.hash("password", 10);
  await prisma.user.create({
    data: {
      email: "admin@girifinancials.com",
      name: "Admin",
      password: hashedPasswordAdmin,
      role: UserRole.ADMIN,
    },
  });

  const hashedPasswordOperator = await bcrypt.hash("password", 10);
  await prisma.user.create({
    data: {
      email: "operator@girifinancials.com",
      name: "Operator",
      password: hashedPasswordOperator,
      role: UserRole.OPERATOR,
    },
  });

  const accounts = [
    { name: "Pendaftaran" },
    { name: "SPP" },
    { name: "Kegiatan" },
    { name: "Lain-lain" },
    { name: "Bank" },
  ];

  for (const account of accounts) {
    await prisma.financialAccount.create({
      data: account,
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
