/*
  Warnings:

  - You are about to drop the `AffordanceAuthorization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThingAuthorization` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ThingPermissionScope" AS ENUM ('read');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('group', 'user', 'service');

-- CreateEnum
CREATE TYPE "AffordancePermissionScope" AS ENUM ('execute');

-- DropForeignKey
ALTER TABLE "AffordanceAuthorization" DROP CONSTRAINT "AffordanceAuthorization_affordanceId_fkey";

-- DropForeignKey
ALTER TABLE "ThingAuthorization" DROP CONSTRAINT "ThingAuthorization_thingId_fkey";

-- DropTable
DROP TABLE "AffordanceAuthorization";

-- DropTable
DROP TABLE "ThingAuthorization";

-- DropEnum
DROP TYPE "AffordanceAuthorizationScope";

-- DropEnum
DROP TYPE "ThingAuthorizationScope";

-- CreateTable
CREATE TABLE "ThingPermission" (
    "id" SERIAL NOT NULL,
    "thingId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "scope" "ThingPermissionScope" NOT NULL DEFAULT 'read',

    CONSTRAINT "ThingPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffordancePermission" (
    "id" SERIAL NOT NULL,
    "affordanceId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scope" "AffordancePermissionScope" NOT NULL DEFAULT 'execute',

    CONSTRAINT "AffordancePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThingPermission_thingId_entityId_key" ON "ThingPermission"("thingId", "entityId");

-- AddForeignKey
ALTER TABLE "ThingPermission" ADD CONSTRAINT "ThingPermission_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffordancePermission" ADD CONSTRAINT "AffordancePermission_affordanceId_fkey" FOREIGN KEY ("affordanceId") REFERENCES "Affordance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
