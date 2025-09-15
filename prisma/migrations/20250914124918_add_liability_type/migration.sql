-- AlterTable
ALTER TABLE "public"."Liability" ADD COLUMN     "type" "public"."TransactionType" NOT NULL DEFAULT 'CREDIT';
