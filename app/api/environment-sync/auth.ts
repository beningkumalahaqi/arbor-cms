import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

export function hasBearerToken(request: NextRequest): boolean {
  return getBearerToken(request) !== null;
}

export async function validateEnvironmentSyncToken(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      environmentSyncToken: true,
    },
  });

  const expectedToken = settings?.environmentSyncToken?.trim();
  if (!expectedToken) {
    return {
      valid: false,
      error: "Environment sync token is not configured on this environment.",
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { valid: false, error: "Invalid or missing environment sync token." };
  }

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(token);
  const matches = expected.length === provided.length && timingSafeEqual(expected, provided);
  if (!matches) {
    return { valid: false, error: "Invalid or missing environment sync token." };
  }

  return { valid: true };
}
