-- CreateTable
CREATE TABLE "StorageFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StorageFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageFile_path_key" ON "StorageFile"("path");

-- CreateIndex
CREATE INDEX "StorageFile_path_idx" ON "StorageFile"("path");

-- CreateIndex
CREATE UNIQUE INDEX "StorageFolder_path_key" ON "StorageFolder"("path");

-- CreateIndex
CREATE INDEX "StorageFolder_path_idx" ON "StorageFolder"("path");
