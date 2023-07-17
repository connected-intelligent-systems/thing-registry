-- AlterTable
CREATE SEQUENCE affordanceauthorization_id_seq;
ALTER TABLE "AffordanceAuthorization" ALTER COLUMN "id" SET DEFAULT nextval('affordanceauthorization_id_seq');
ALTER SEQUENCE affordanceauthorization_id_seq OWNED BY "AffordanceAuthorization"."id";

-- AlterTable
CREATE SEQUENCE thingauthorization_id_seq;
ALTER TABLE "ThingAuthorization" ALTER COLUMN "id" SET DEFAULT nextval('thingauthorization_id_seq');
ALTER SEQUENCE thingauthorization_id_seq OWNED BY "ThingAuthorization"."id";

-- CreateTable
CREATE TABLE "SecurityDefinitions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "securityDefintion" JSONB NOT NULL,
    "thingId" TEXT NOT NULL,

    CONSTRAINT "SecurityDefinitions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SecurityDefinitions" ADD CONSTRAINT "SecurityDefinitions_thingId_fkey" FOREIGN KEY ("thingId") REFERENCES "Thing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
