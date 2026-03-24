-- Add generated environment sync token to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "environmentSyncToken" TEXT NOT NULL DEFAULT '';
