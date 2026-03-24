import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncService } from "@/lib/sync/service";
import { validateEnvironmentSyncToken } from "@/app/api/environment-sync/auth";

export async function GET(request: NextRequest) {
  const tokenValidation = validateEnvironmentSyncToken(request);
  if (!tokenValidation.valid) {
    return NextResponse.json({ error: tokenValidation.error }, { status: 401 });
  }

  try {
    const payload = await syncService.buildSyncPayload(prisma);

    return NextResponse.json({
      success: true,
      message: "Environment sync payload retrieved.",
      data: payload,
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
