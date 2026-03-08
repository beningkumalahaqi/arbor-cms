import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidWidgetType, validateWidgetProps, buildDefaultWidgetProps, getWidget } from "@/lib/widgets";

// GET /api/widgets?pageId=xxx — Get all widgets for a page
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json({ error: "pageId is required." }, { status: 400 });
  }

  const widgets = await prisma.widget.findMany({
    where: { pageId },
    orderBy: [{ area: "asc" }, { sortOrder: "asc" }],
  });

  const parsed = widgets.map((w) => ({
    id: w.id,
    pageId: w.pageId,
    area: w.area,
    type: w.type,
    props: JSON.parse(w.props),
    sortOrder: w.sortOrder,
    parentId: w.parentId,
    slot: w.slot,
  }));

  return NextResponse.json({ widgets: parsed });
}

// POST /api/widgets — Create a new widget
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { pageId, area, type, props, parentId, slot } = body;

  if (!pageId || !area || !type) {
    return NextResponse.json(
      { error: "pageId, area, and type are required." },
      { status: 400 }
    );
  }

  if (!isValidWidgetType(type)) {
    return NextResponse.json(
      { error: `Invalid widget type "${type}".` },
      { status: 400 }
    );
  }

  // Check page exists
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  // If adding to a parent widget, verify parent exists and is a container
  if (parentId) {
    const parentWidget = await prisma.widget.findUnique({ where: { id: parentId } });
    if (!parentWidget) {
      return NextResponse.json({ error: "Parent widget not found." }, { status: 404 });
    }
    const parentDef = getWidget(parentWidget.type);
    if (!parentDef?.isContainer) {
      return NextResponse.json({ error: "Parent widget is not a container." }, { status: 400 });
    }
  }

  // Build props with defaults
  const widgetDef = getWidget(type)!;
  const mergedProps = {
    ...buildDefaultWidgetProps(widgetDef.propSchema),
    ...props,
  };

  // Validate (skip required checks on creation — widget starts with defaults,
  // user fills in values via the editor, and required is enforced on update)
  const errors = validateWidgetProps(type, mergedProps, { skipRequired: true });
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed.", details: errors },
      { status: 400 }
    );
  }

  // Get the next sort order — either within parent slot or area
  const whereClause = parentId
    ? { pageId, parentId, slot: slot || "" }
    : { pageId, area, parentId: null };

  const maxOrder = await prisma.widget.aggregate({
    where: whereClause,
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const widget = await prisma.widget.create({
    data: {
      pageId,
      area,
      type,
      props: JSON.stringify(mergedProps),
      sortOrder: nextOrder,
      parentId: parentId || null,
      slot: slot || "",
    },
  });

  return NextResponse.json(
    {
      widget: {
        id: widget.id,
        pageId: widget.pageId,
        area: widget.area,
        type: widget.type,
        props: mergedProps,
        sortOrder: widget.sortOrder,
        parentId: widget.parentId,
        slot: widget.slot,
      },
    },
    { status: 201 }
  );
}
