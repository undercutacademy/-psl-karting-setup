-- Backfill migration for schema fields that were added directly to schema.prisma
-- in commit c99e732 (March 23, 2026) without a corresponding migration. The
-- columns and enum already exist in the live DB (synced via `prisma db push`),
-- so every statement here is guarded with IF NOT EXISTS / DO-block to be a
-- no-op when re-applied. Fresh databases bootstrapped from migrations alone
-- will pick these up.

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "FrontWheelType" AS ENUM ('Hub', 'NoHub');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "sparkplugType" TEXT;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "sparkplugGap" DOUBLE PRECISION;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "frontWheelType" "FrontWheelType";
