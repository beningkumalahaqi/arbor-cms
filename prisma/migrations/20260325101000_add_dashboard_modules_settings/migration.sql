-- Add dashboard module configuration storage to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "dashboardModules" TEXT NOT NULL DEFAULT '[]';
