import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncService } from "@/lib/sync/service";
import { hasBearerToken, validateEnvironmentSyncToken } from "@/app/api/environment-sync/auth";

export async function GET(request: NextRequest) {
  if (hasBearerToken(request)) {
    const tokenValidation = await validateEnvironmentSyncToken(request);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { connected: false, error: tokenValidation.error },
        { status: 401 }
      );
    }

    return NextResponse.json({ connected: true });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.findFirst();
  const currentUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  const current = {
    url: currentUrl,
    connected: true,
    label: "Current Environment",
  };

  if (!settings?.environmentDatabaseUrl) {
    return NextResponse.json({
      current,
      target: {
        url: "",
        connected: false,
        label: "Target Environment",
        error: "Not configured",
      },
    });
  }

  const targetUrl = settings.environmentDatabaseUrl;
  const targetToken = settings.environmentDatabaseToken || undefined;
  const connectionTest = await syncService.testConnection(targetUrl, targetToken);

  return NextResponse.json({
    current,
    target: {
      url: targetUrl,
      connected: connectionTest.connected,
      label: "Target Environment",
      error: connectionTest.error,
    },
  });
}
