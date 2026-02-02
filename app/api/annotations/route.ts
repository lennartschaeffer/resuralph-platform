import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing documentId query parameter" },
      { status: 400 }
    );
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const annotations = await prisma.annotation.findMany({
      where: { documentId },
      orderBy: [{ createdAt: "asc" }],
    });

    return NextResponse.json({ annotations });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface Rect {
  x: unknown;
  y: unknown;
  width: unknown;
  height: unknown;
}

function validatePositionData(
  positionData: unknown
): { valid: true } | { valid: false; message: string } {
  if (!positionData || typeof positionData !== "object") {
    return { valid: false, message: "positionData is required and must be an object" };
  }

  const pd = positionData as Record<string, unknown>;

  if (typeof pd.pageNumber !== "number" || !Number.isInteger(pd.pageNumber) || pd.pageNumber < 1) {
    return { valid: false, message: "positionData.pageNumber must be a positive integer" };
  }

  if (!Array.isArray(pd.rects) || pd.rects.length === 0) {
    return { valid: false, message: "positionData.rects must be a non-empty array" };
  }

  for (const rect of pd.rects as Rect[]) {
    if (
      typeof rect.x !== "number" || rect.x < 0 ||
      typeof rect.y !== "number" || rect.y < 0 ||
      typeof rect.width !== "number" || rect.width < 0 ||
      typeof rect.height !== "number" || rect.height < 0
    ) {
      return {
        valid: false,
        message: "Each rect must have x, y, width, height as numbers >= 0",
      };
    }
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { documentId, selectedText, comment, positionData, isHighPriority } = body;

  // Validate required fields
  const errors: string[] = [];

  if (!documentId || typeof documentId !== "string") {
    errors.push("documentId is required");
  }

  if (!selectedText || typeof selectedText !== "string" || (selectedText as string).trim() === "") {
    errors.push("selectedText is required and must be a non-empty string");
  }

  if (!comment || typeof comment !== "string" || (comment as string).trim() === "") {
    errors.push("comment is required and must be a non-empty string");
  }

  const positionResult = validatePositionData(positionData);
  if (!positionResult.valid) {
    errors.push(positionResult.message);
  }

  if (isHighPriority !== undefined && typeof isHighPriority !== "boolean") {
    errors.push("isHighPriority must be a boolean");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 }
    );
  }

  try {
    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId as string },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const annotation = await prisma.annotation.create({
      data: {
        documentId: documentId as string,
        selectedText: (selectedText as string).trim(),
        comment: (comment as string).trim(),
        positionData: positionData as object,
        isHighPriority: (isHighPriority as boolean) ?? false,
        creatorId: user.id,
      },
    });

    return NextResponse.json({ annotation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
