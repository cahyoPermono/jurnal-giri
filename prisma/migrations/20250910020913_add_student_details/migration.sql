-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "enrollmentDate" TIMESTAMP(3),
ADD COLUMN     "graduationDate" TIMESTAMP(3),
ADD COLUMN     "parentName" TEXT;
