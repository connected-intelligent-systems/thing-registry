/*
  Warnings:

  - The primary key for the `PluginSetting` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "PluginSetting" DROP CONSTRAINT "PluginSetting_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PluginSetting_pkey" PRIMARY KEY ("id");
