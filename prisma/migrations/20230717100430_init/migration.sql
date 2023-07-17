-- AddForeignKey
ALTER TABLE "Affordance" ADD CONSTRAINT "Affordance_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
