-- CreateEnum
CREATE TYPE "AffordanceType" AS ENUM ('PROPERTY', 'ACTION', 'EVENT');

-- CreateTable
CREATE TABLE "Affordance" (
    "id" TEXT NOT NULL,
    "type" "AffordanceType" NOT NULL,
    "description" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "thingId" TEXT NOT NULL,
    "types" TEXT[],
    "owner" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "Affordance_pkey" PRIMARY KEY ("id")
);
