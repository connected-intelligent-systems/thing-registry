/*
  Warnings:

  - A unique constraint covering the columns `[name,owner]` on the table `PluginSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PluginSetting_name_owner_key" ON "PluginSetting"("name", "owner");
