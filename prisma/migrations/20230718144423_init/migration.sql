/*
  Warnings:

  - Changed the type of `description` on the `DiscoveredThing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "DiscoveredThing" DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL;
