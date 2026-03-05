import { NextRequest, NextResponse } from "next/server";
import { hasSuperAdmin, createSuperAdmin } from "@/lib/auth";
import { validateEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const exists = await hasSuperAdmin();
  if (exists) {
    return NextResponse.json(
      { error: "SuperAdmin already exists. Registration is disabled." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Email, name, and password are required." },
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await createSuperAdmin(email, name, password);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}

export async function GET() {
  const exists = await hasSuperAdmin();
  return NextResponse.json({ hasSuperAdmin: exists });
}
