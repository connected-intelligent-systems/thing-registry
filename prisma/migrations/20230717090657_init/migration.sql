-- CreateTable
CREATE TABLE "Thing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "types" TEXT[],

    CONSTRAINT "Thing_pkey" PRIMARY KEY ("id")
);
