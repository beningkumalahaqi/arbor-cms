-- Add environment sync settings to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "environmentDatabaseUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "environmentDatabaseToken" TEXT NOT NULL DEFAULT '';
