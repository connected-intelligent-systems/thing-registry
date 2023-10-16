-- CreateTable
CREATE TABLE "Thing" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "title" TEXT NOT NULL,
    "types" TEXT[],
    "description" JSONB NOT NULL,
    "publicDescription" JSONB NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicForm" (
    "thingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "security" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "description" JSONB NOT NULL,
    "uriVariables" JSONB,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicForm_pkey" PRIMARY KEY ("thingId","tenantId","type","name","index","security")
);

-- CreateTable
CREATE TABLE "SecurityDefinition" (
    "thingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "credentials" JSONB,

    CONSTRAINT "SecurityDefinition_pkey" PRIMARY KEY ("thingId","tenantId","name")
);

-- CreateIndex
CREATE UNIQUE INDEX "Thing_tenantId_id_key" ON "Thing"("tenantId", "id");

-- AddForeignKey
ALTER TABLE "PublicForm" ADD CONSTRAINT "PublicForm_thingId_tenantId_security_fkey" FOREIGN KEY ("thingId", "tenantId", "security") REFERENCES "SecurityDefinition"("thingId", "tenantId", "name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicForm" ADD CONSTRAINT "PublicForm_thingId_tenantId_fkey" FOREIGN KEY ("thingId", "tenantId") REFERENCES "Thing"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityDefinition" ADD CONSTRAINT "SecurityDefinition_thingId_tenantId_fkey" FOREIGN KEY ("thingId", "tenantId") REFERENCES "Thing"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
