-- CreateTable
CREATE TABLE "PageTypeSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageTypeName" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'file',
    "allowedChildren" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PageTypeSettings_pageTypeName_key" ON "PageTypeSettings"("pageTypeName");

-- CreateIndex
CREATE INDEX "PageTypeSettings_pageTypeName_idx" ON "PageTypeSettings"("pageTypeName");
