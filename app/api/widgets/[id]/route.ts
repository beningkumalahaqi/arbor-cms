import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidWidgetType, validateWidgetProps } from "@/lib/widgets";

// GET /api/widgets/[id] — Get a single widget
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const widget = await prisma.widget.findUnique({ where: { id } });

  if (!widget) {
    return NextResponse.json({ error: "Widget not found." }, { status: 404 });
  }

  return NextResponse.json({
    widget: {
      id: widget.id,
      pageId: widget.pageId,
      area: widget.area,
      type: widget.type,
      props: JSON.parse(widget.props),
      sortOrder: widget.sortOrder,
      parentId: widget.parentId,
      slot: widget.slot,
    },
  });
}

// PUT /api/widgets/[id] — Update a widget's props or sort order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const widget = await prisma.widget.findUnique({ where: { id } });

  if (!widget) {
    return NextResponse.json({ error: "Widget not found." }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  // Update props
  if (body.props !== undefined) {
    if (!isValidWidgetType(widget.type)) {
      return NextResponse.json({ error: "Invalid widget type." }, { status: 400 });
    }

    // Skip required validation so users can save partially-filled widgets
    // (e.g., image widget without src yet, rich-text without content)
    const errors = validateWidgetProps(widget.type, body.props, { skipRequired: true });
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed.", details: errors },
        { status: 400 }
      );
    }

    updateData.props = JSON.stringify(body.props);
  }

  // Update sort order
  if (body.sortOrder !== undefined) {
    updateData.sortOrder = Number(body.sortOrder);
  }

  // Update area (for moving between areas)
  if (body.area !== undefined) {
    updateData.area = body.area;
  }

  const updated = await prisma.widget.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    widget: {
      id: updated.id,
      pageId: updated.pageId,
      area: updated.area,
      type: updated.type,
      props: JSON.parse(updated.props),
      sortOrder: updated.sortOrder,
      parentId: updated.parentId,
      slot: updated.slot,
    },
  });
}

// DELETE /api/widgets/[id] — Delete a widget (children cascade-deleted by DB)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const widget = await prisma.widget.findUnique({ where: { id } });

  if (!widget) {
    return NextResponse.json({ error: "Widget not found." }, { status: 404 });
  }

  // Delete child widgets first (for container widgets like section/columns)
  await prisma.widget.deleteMany({ where: { parentId: id } });
  await prisma.widget.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
