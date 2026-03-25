import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseDashboardModules } from "@/lib/admin/dashboard-modules";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.findFirst();

  if (!settings) {
      return NextResponse.json({
        settings: {
          navigationEnabled: 1,
          navigationLogo: "",
          navigationTitle: "Arbor CMS",
          footerEnabled: 1,
          footerLogo: "",
          footerText: "",
          dashboardModules: "[]",
          environmentDatabaseUrl: "",
          environmentDatabaseToken: "",
          environmentSyncTokenConfigured: false,
        },
      });
  }

  return NextResponse.json({
    settings: {
      ...settings,
      environmentDatabaseToken: "",
      environmentSyncTokenConfigured: Boolean(settings.environmentSyncToken),
    },
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    navigationEnabled,
    navigationLogo,
    navigationTitle,
    footerEnabled,
    footerLogo,
    footerText,
    dashboardModules,
    environmentDatabaseUrl,
    environmentDatabaseToken,
  } = body;

  const updateData: Record<string, unknown> = {};

  if (navigationEnabled !== undefined) {
    updateData.navigationEnabled = navigationEnabled ? 1 : 0;
  }
  if (navigationLogo !== undefined) {
    updateData.navigationLogo = String(navigationLogo);
  }
  if (navigationTitle !== undefined) {
    updateData.navigationTitle = String(navigationTitle);
  }
  if (footerEnabled !== undefined) {
    updateData.footerEnabled = footerEnabled ? 1 : 0;
  }
  if (footerLogo !== undefined) {
    updateData.footerLogo = String(footerLogo);
  }
  if (footerText !== undefined) {
    updateData.footerText = String(footerText);
  }
  if (dashboardModules !== undefined) {
    const serializedModules = typeof dashboardModules === "string"
      ? dashboardModules
      : JSON.stringify(dashboardModules);

    updateData.dashboardModules = JSON.stringify(
      parseDashboardModules(serializedModules)
    );
  }
  if (environmentDatabaseUrl !== undefined) {
    updateData.environmentDatabaseUrl = String(environmentDatabaseUrl);
  }
  if (environmentDatabaseToken !== undefined) {
    updateData.environmentDatabaseToken = String(environmentDatabaseToken);
  }

  const existing = await prisma.siteSettings.findFirst();

  let settings;
  if (existing) {
    settings = await prisma.siteSettings.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    settings = await prisma.siteSettings.create({
      data: updateData as {
        navigationEnabled?: number;
        navigationLogo?: string;
        navigationTitle?: string;
        footerEnabled?: number;
        footerLogo?: string;
        footerText?: string;
        dashboardModules?: string;
        environmentDatabaseUrl?: string;
        environmentDatabaseToken?: string;
      },
    });
  }

  return NextResponse.json({ settings });
}
