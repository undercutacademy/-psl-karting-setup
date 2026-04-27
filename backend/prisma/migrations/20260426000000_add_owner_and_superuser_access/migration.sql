-- AlterTable
ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "superuserAccessExpiresAt" TIMESTAMP(3);

-- Backfill: promote the earliest-created manager of each team to owner.
UPDATE "User" u
SET "isOwner" = true
FROM (
  SELECT DISTINCT ON ("teamId") "id"
  FROM "User"
  WHERE "isManager" = true AND "teamId" IS NOT NULL
  ORDER BY "teamId", "createdAt" ASC
) first_manager
WHERE u."id" = first_manager."id";
