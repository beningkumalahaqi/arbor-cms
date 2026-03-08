import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST /api/widgets/reorder — Reorder widgets within an area
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { widgetIds } = body as { widgetIds: string[] };

  if (!Array.isArray(widgetIds) || widgetIds.length === 0) {
    return NextResponse.json(
      { error: "widgetIds array is required." },
      { status: 400 }
    );
  }

  // Update sort orders based on array position
  const updates = widgetIds.map((id, index) =>
    prisma.widget.update({
      where: { id },
      data: { sortOrder: index },
    })
  );

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}
