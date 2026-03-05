import { NextRequest, NextResponse } from "next/server";
import { readFile } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const relativePath = pathSegments.join("/");

  if (!relativePath) {
    return NextResponse.json({ error: "File path required." }, { status: 400 });
  }

  try {
    const { data, mimeType } = await readFile(relativePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
