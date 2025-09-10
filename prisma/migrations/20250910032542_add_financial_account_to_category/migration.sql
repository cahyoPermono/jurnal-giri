-- AlterTable
ALTER TABLE "public"."Category" ADD COLUMN     "financial_account_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "public"."FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
