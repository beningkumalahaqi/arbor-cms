-- CreateTable
CREATE TABLE "FormType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "elements" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- AddColumn
ALTER TABLE "FormSubmission" ADD COLUMN "formTypeId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "FormType_name_idx" ON "FormType"("name");

-- CreateIndex
CREATE INDEX "FormSubmission_formTypeId_idx" ON "FormSubmission"("formTypeId");
