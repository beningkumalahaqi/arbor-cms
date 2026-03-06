-- Add navigation fields to Page
ALTER TABLE "Page" ADD COLUMN "showInNav" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Page" ADD COLUMN "navLabel" TEXT NOT NULL DEFAULT '';

-- Create SiteSettings table
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "navigationEnabled" INTEGER NOT NULL DEFAULT 1,
    "navigationLogo" TEXT NOT NULL DEFAULT '',
    "navigationTitle" TEXT NOT NULL DEFAULT 'Arbor CMS',
    "footerEnabled" INTEGER NOT NULL DEFAULT 1,
    "footerLogo" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
