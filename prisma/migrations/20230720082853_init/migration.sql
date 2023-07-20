/*
  Warnings:

  - You are about to drop the `AffordancePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThingPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('read', 'execute');

-- DropForeignKey
ALTER TABLE "AffordancePermission" DROP CONSTRAINT "AffordancePermission_affordanceId_fkey";

-- DropForeignKey
ALTER TABLE "ThingPermission" DROP CONSTRAINT "ThingPermission_thingId_fkey";

-- DropTable
DROP TABLE "AffordancePermission";

-- DropTable
DROP TABLE "ThingPermission";

-- DropEnum
DROP TYPE "AffordancePermissionScope";

-- DropEnum
DROP TYPE "ThingPermissionScope";

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "resourceId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'read',

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resourceId_entityId_key" ON "Permission"("resourceId", "entityId");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_resourceId_thing_fkey" FOREIGN KEY ("resourceId") REFERENCES "Thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_resourceId_affordance_fkey" FOREIGN KEY ("resourceId") REFERENCES "Affordance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
