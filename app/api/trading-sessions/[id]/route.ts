import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  exitPrice: z.number().optional(),
  status: z.enum(["OPEN", "CLOSED", "STOPPED"]).optional(),
  pnl: z.number().optional(),
  pnlPercent: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await prisma.tradingSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Trading session not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);
    const data = { ...validated } as Record<string, unknown>;
    if (validated.status === "CLOSED" || validated.status === "STOPPED") data.closedAt = new Date();
    const session = await prisma.tradingSession.update({ where: { id }, data });
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tradingSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
