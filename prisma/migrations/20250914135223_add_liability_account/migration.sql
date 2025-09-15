-- AlterTable
ALTER TABLE "public"."Liability" ADD COLUMN     "accountId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Liability" ADD CONSTRAINT "Liability_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
