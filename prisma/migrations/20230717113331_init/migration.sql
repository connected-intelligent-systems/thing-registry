/*
  Warnings:

  - You are about to drop the column `securityDefintion` on the `SecurityDefinitions` table. All the data in the column will be lost.
  - Added the required column `securityDefinition` to the `SecurityDefinitions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SecurityDefinitions" DROP COLUMN "securityDefintion",
ADD COLUMN     "securityDefinition" JSONB NOT NULL;
