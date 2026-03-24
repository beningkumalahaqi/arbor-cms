import { NextRequest } from "next/server";

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

export function validateEnvironmentSyncToken(
  request: NextRequest
): { valid: boolean; error?: string } {
  const expectedToken = process.env.ENV_SYNC_TOKEN;
  if (!expectedToken) {
    return { valid: false, error: "ENV_SYNC_TOKEN is not configured on this environment." };
  }

  const token = getBearerToken(request);
  if (!token || token !== expectedToken) {
    return { valid: false, error: "Invalid or missing environment sync token." };
  }

  return { valid: true };
}
