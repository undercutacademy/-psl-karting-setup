-- CreateEnum
CREATE TYPE "BackHeight" AS ENUM ('Low', 'Medium', 'High', 'Standard');

-- CreateEnum
CREATE TYPE "ClassCode" AS ENUM ('Micro', 'Mini', 'Sr', 'Kz', 'Ka', 'Jr');

-- CreateEnum
CREATE TYPE "FrontBar" AS ENUM ('Nylon', 'Standard', 'Black', 'None');

-- CreateEnum
CREATE TYPE "FrontHeight" AS ENUM ('Low', 'Medium', 'High', 'Standard');

-- CreateEnum
CREATE TYPE "FrontHubsMaterial" AS ENUM ('Aluminium', 'Magnesium');

-- CreateEnum
CREATE TYPE "RearHubsMaterial" AS ENUM ('Aluminium', 'Magnesium');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('Practice1', 'Practice2', 'Practice3', 'Practice4', 'Practice5', 'Practice6', 'HappyHour', 'WarmUp', 'Qualifying', 'Race1', 'Race2', 'PreFinal', 'Final', 'Heat1', 'Heat2', 'Heat3', 'Heat4', 'Heat5', 'Heat6', 'Heat7', 'SuperHeat1', 'SuperHeat2');

-- CreateEnum
CREATE TYPE "Spindle" AS ENUM ('Blue', 'Standard', 'Red', 'Green', 'Gold');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "classCode" "ClassCode" NOT NULL DEFAULT 'Sr',
    "track" TEXT NOT NULL,
    "championship" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "engineNumber" TEXT,
    "gearRatio" TEXT,
    "driveSprocket" TEXT,
    "drivenSprocket" TEXT,
    "carburatorNumber" TEXT,
    "tyreModel" TEXT,
    "tyreAge" TEXT,
    "tyreColdPressure" TEXT NOT NULL,
    "chassis" TEXT,
    "axle" TEXT,
    "rearHubsMaterial" "RearHubsMaterial",
    "rearHubsLength" TEXT,
    "frontHeight" "FrontHeight",
    "backHeight" "BackHeight",
    "frontHubsMaterial" "FrontHubsMaterial",
    "frontBar" "FrontBar",
    "spindle" "Spindle",
    "caster" TEXT,
    "seatPosition" TEXT,
    "lapTime" TEXT,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "customData" JSONB,
    "seatInclination" TEXT,
    "axleSize" TEXT,
    "camber" TEXT,
    "frontHubsLength" TEXT,
    "rearTrackWidth" TEXT,
    "sessionLaps" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dropdownOptions" JSONB,
    "emailFromName" TEXT,
    "formConfig" JSONB,
    "logoUrl" TEXT,
    "managerEmails" TEXT[],
    "primaryColor" TEXT NOT NULL DEFAULT '#dc2626',
    "customLabels" JSONB,
    "region" TEXT NOT NULL DEFAULT 'NorthAmerica',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "teamId" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Submission_teamId_idx" ON "Submission"("teamId" ASC);

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
