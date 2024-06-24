/*
  Warnings:

  - You are about to drop the column `publicDescription` on the `Thing` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Thing` table. All the data in the column will be lost.
  - You are about to drop the `PublicForm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SecurityDefinition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PublicForm" DROP CONSTRAINT "PublicForm_thingId_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "PublicForm" DROP CONSTRAINT "PublicForm_thingId_tenantId_security_fkey";

-- DropForeignKey
ALTER TABLE "SecurityDefinition" DROP CONSTRAINT "SecurityDefinition_thingId_tenantId_fkey";

-- AlterTable
ALTER TABLE "Thing" DROP COLUMN "publicDescription",
DROP COLUMN "source";

-- DropTable
DROP TABLE "PublicForm";

-- DropTable
DROP TABLE "SecurityDefinition";
