/*
  Warnings:

  - The values [service] on the enum `EntityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [execute] on the enum `PermissionScope` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `resourceId` on the `Permission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[thingId,entityId]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `thingId` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EntityType_new" AS ENUM ('group', 'user');
ALTER TABLE "Permission" ALTER COLUMN "entityType" TYPE "EntityType_new" USING ("entityType"::text::"EntityType_new");
ALTER TYPE "EntityType" RENAME TO "EntityType_old";
ALTER TYPE "EntityType_new" RENAME TO "EntityType";
DROP TYPE "EntityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionScope_new" AS ENUM ('read', 'readProperties', 'invokeActions', 'subscribeEvents');
ALTER TABLE "Permission" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "Permission" ALTER COLUMN "scope" TYPE "PermissionScope_new" USING ("scope"::text::"PermissionScope_new");
ALTER TYPE "PermissionScope" RENAME TO "PermissionScope_old";
ALTER TYPE "PermissionScope_new" RENAME TO "PermissionScope";
DROP TYPE "PermissionScope_old";
ALTER TABLE "Permission" ALTER COLUMN "scope" SET DEFAULT 'read';
COMMIT;

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_resourceId_affordance_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_resourceId_thing_fkey";

-- DropIndex
DROP INDEX "Permission_resourceId_entityId_key";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "resourceId",
ADD COLUMN     "thingId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Permission_thingId_entityId_key" ON "Permission"("thingId", "entityId");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
