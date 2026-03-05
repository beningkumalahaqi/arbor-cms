import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Simple cookie-based session using a user ID token.
// In production, replace with signed JWTs or a session store.
const SESSION_COOKIE = "arbor_session";

export async function createSession(userId: string) {
  // For simplicity, store user ID directly.
  // In production, use signed/encrypted tokens.
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(role: string): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== role) {
    throw new Error("Forbidden");
  }
  return session;
}
