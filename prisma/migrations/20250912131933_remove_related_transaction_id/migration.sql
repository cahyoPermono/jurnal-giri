/*
  Warnings:

  - You are about to drop the column `relatedTransactionId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_relatedTransactionId_fkey";

-- DropIndex
DROP INDEX "public"."Transaction_relatedTransactionId_key";

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "relatedTransactionId";
