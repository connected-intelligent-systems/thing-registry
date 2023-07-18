/*
  Warnings:

  - The primary key for the `PluginSetting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PluginSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PluginSetting" DROP CONSTRAINT "PluginSetting_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "PluginSetting_pkey" PRIMARY KEY ("name", "owner");
