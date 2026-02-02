import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const annotation = await prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    return NextResponse.json({ annotation });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const { comment, isHighPriority } = body;

  // Validate at least one updatable field
  const updateData: Record<string, unknown> = {};

  if (comment !== undefined) {
    if (typeof comment !== "string" || comment.trim() === "") {
      return NextResponse.json(
        { error: "comment must be a non-empty string" },
        { status: 400 }
      );
    }
    updateData.comment = comment.trim();
  }

  if (isHighPriority !== undefined) {
    if (typeof isHighPriority !== "boolean") {
      return NextResponse.json(
        { error: "isHighPriority must be a boolean" },
        { status: 400 }
      );
    }
    updateData.isHighPriority = isHighPriority;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "At least one updatable field (comment, isHighPriority) must be provided" },
      { status: 400 }
    );
  }

  try {
    const annotation = await prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    if (annotation.creatorId !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own annotations" },
        { status: 403 }
      );
    }

    const updated = await prisma.annotation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ annotation: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const annotation = await prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    if (annotation.creatorId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own annotations" },
        { status: 403 }
      );
    }

    await prisma.annotation.delete({ where: { id } });

    return NextResponse.json({ message: "Annotation deleted" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
