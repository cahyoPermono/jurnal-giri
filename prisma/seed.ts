import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  const hashedPasswordAdmin = await bcrypt.hash("passwordgiri", 10);
  await prisma.user.upsert({
    where: { email: "admin@jurnalgiri.com" },
    update: {},
    create: {
      email: "admin@jurnalgiri.com",
      name: "Admin JurnalGiri",
      password: hashedPasswordAdmin,
      role: UserRole.ADMIN,
    },
  });

  const hashedPasswordOperator = await bcrypt.hash("password", 10);
  await prisma.user.upsert({
    where: { email: "operator@girifinancials.com" },
    update: {},
    create: {
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
    await prisma.financialAccount.upsert({
      where: { name: account.name },
      update: {},
      create: account,
    });
  }

  // Create categories
  const sppAccount = await prisma.financialAccount.findUnique({ where: { name: "SPP" } });
  const kegiatanAccount = await prisma.financialAccount.findUnique({ where: { name: "Kegiatan" } });
  const bankAccount = await prisma.financialAccount.findUnique({ where: { name: "Bank" } });

  const categories = [
    { name: "Rutin", type: "CREDIT" as const, financialAccountId: sppAccount?.id },
    { name: "Kegiatan", type: "CREDIT" as const, financialAccountId: kegiatanAccount?.id },
    { name: "Setor bank", type: "CREDIT" as const, financialAccountId: bankAccount?.id },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Create default parameters
  const parameters = [
    { key: "spp_amount", value: "500000" },
    { key: "registration_fee", value: "100000" },
  ];

  for (const param of parameters) {
    await prisma.parameter.upsert({
      where: { key: param.key },
      update: {},
      create: param,
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
