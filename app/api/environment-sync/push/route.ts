import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncService, type SyncPayload } from "@/lib/sync/service";
import { validateEnvironmentSyncToken } from "@/app/api/environment-sync/auth";

export async function POST(request: NextRequest) {
  const tokenValidation = await validateEnvironmentSyncToken(request);
  if (!tokenValidation.valid) {
    return NextResponse.json({ error: tokenValidation.error }, { status: 401 });
  }

  const body = await request.json();
  const payload = body?.payload as SyncPayload | undefined;

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Missing sync payload." },
      { status: 400 }
    );
  }

  try {
    await syncService.applySyncPayload(prisma, payload);

    return NextResponse.json({
      success: true,
      message: "Environment sync payload applied.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
