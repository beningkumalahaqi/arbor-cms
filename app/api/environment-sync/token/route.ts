import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function createEnvironmentSyncToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = createEnvironmentSyncToken();

  const existing = await prisma.siteSettings.findFirst({
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.siteSettings.update({
      where: { id: existing.id },
      data: { environmentSyncToken: token },
    });
  } else {
    await prisma.siteSettings.create({
      data: { environmentSyncToken: token },
    });
  }

  return NextResponse.json({
    token,
    message: "Environment sync token generated successfully.",
  });
}
