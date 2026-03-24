import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncService } from "@/lib/sync/service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { direction } = body;

  if (direction !== "to" && direction !== "from") {
    return NextResponse.json(
      { error: "Invalid direction. Must be 'to' or 'from'." },
      { status: 400 }
    );
  }

  const settings = await prisma.siteSettings.findFirst();
  if (!settings?.environmentDatabaseUrl) {
    return NextResponse.json(
      { error: "Target environment API URL is not configured." },
      { status: 400 }
    );
  }

  const targetUrl = settings.environmentDatabaseUrl;
  const targetToken = settings.environmentDatabaseToken || undefined;

  const result =
    direction === "to"
      ? await syncService.syncToTarget(prisma, targetUrl, targetToken)
      : await syncService.syncFromTarget(prisma, targetUrl, targetToken);

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}
