-- CreateEnum
CREATE TYPE "AffordanceType" AS ENUM ('property', 'action', 'event');

-- CreateEnum
CREATE TYPE "ThingAuthorizationScope" AS ENUM ('read');

-- CreateEnum
CREATE TYPE "AffordanceAuthorizationScope" AS ENUM ('execute');

-- CreateTable
CREATE TABLE "Thing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "owner" TEXT NOT NULL,
    "types" TEXT[],

    CONSTRAINT "Thing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affordance" (
    "id" TEXT NOT NULL,
    "type" "AffordanceType" NOT NULL,
    "description" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "types" TEXT[],
    "owner" TEXT NOT NULL,
    "source" TEXT,
    "thingId" TEXT NOT NULL,

    CONSTRAINT "Affordance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThingAuthorization" (
    "id" SERIAL NOT NULL,
    "thingId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scope" "ThingAuthorizationScope" NOT NULL DEFAULT 'read',

    CONSTRAINT "ThingAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffordanceAuthorization" (
    "id" SERIAL NOT NULL,
    "affordanceId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scope" "AffordanceAuthorizationScope" NOT NULL DEFAULT 'execute',

    CONSTRAINT "AffordanceAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "thingId" TEXT NOT NULL,
    "type" "AffordanceType" NOT NULL,
    "name" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "description" JSONB NOT NULL,
    "owner" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("thingId","type","name","index")
);

-- CreateTable
CREATE TABLE "DiscoveredThing" (
    "id" TEXT NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "owner" TEXT NOT NULL,

    CONSTRAINT "DiscoveredThing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discovery" (
    "user" TEXT NOT NULL,
    "running" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Discovery_pkey" PRIMARY KEY ("user")
);

-- CreateTable
CREATE TABLE "PluginSetting" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "settings" JSONB NOT NULL,

    CONSTRAINT "PluginSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThingAuthorization_thingId_entityId_key" ON "ThingAuthorization"("thingId", "entityId");

-- AddForeignKey
ALTER TABLE "Affordance" ADD CONSTRAINT "Affordance_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThingAuthorization" ADD CONSTRAINT "ThingAuthorization_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffordanceAuthorization" ADD CONSTRAINT "AffordanceAuthorization_affordanceId_fkey" FOREIGN KEY ("affordanceId") REFERENCES "Affordance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
