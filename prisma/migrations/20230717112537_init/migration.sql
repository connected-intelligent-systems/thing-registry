/*
  Warnings:

  - The values [PROPERTY,ACTION,EVENT] on the enum `AffordanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ThingAuthorizationScope" AS ENUM ('read');

-- CreateEnum
CREATE TYPE "AffordanceAuthorizationScope" AS ENUM ('execute');

-- AlterEnum
BEGIN;
CREATE TYPE "AffordanceType_new" AS ENUM ('property', 'action', 'event');
ALTER TABLE "Affordance" ALTER COLUMN "type" TYPE "AffordanceType_new" USING ("type"::text::"AffordanceType_new");
ALTER TYPE "AffordanceType" RENAME TO "AffordanceType_old";
ALTER TYPE "AffordanceType_new" RENAME TO "AffordanceType";
DROP TYPE "AffordanceType_old";
COMMIT;

-- CreateTable
CREATE TABLE "ThingAuthorization" (
    "id" INTEGER NOT NULL,
    "thingId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scope" "ThingAuthorizationScope" NOT NULL DEFAULT 'read',

    CONSTRAINT "ThingAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffordanceAuthorization" (
    "id" INTEGER NOT NULL,
    "affordanceId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scope" "ThingAuthorizationScope" NOT NULL DEFAULT 'read',

    CONSTRAINT "AffordanceAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThingAuthorization_thingId_entityId_key" ON "ThingAuthorization"("thingId", "entityId");

-- AddForeignKey
ALTER TABLE "ThingAuthorization" ADD CONSTRAINT "ThingAuthorization_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffordanceAuthorization" ADD CONSTRAINT "AffordanceAuthorization_affordanceId_fkey" FOREIGN KEY ("affordanceId") REFERENCES "Affordance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
