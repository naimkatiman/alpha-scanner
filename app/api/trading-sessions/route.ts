import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const sessionSchema = z.object({
  symbol: z.string().min(1),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number().min(0),
  quantity: z.number().min(0),
  leverage: z.number().min(1).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const symbol = searchParams.get("symbol");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (symbol) where.symbol = symbol;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.tradingSession.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { openedAt: "desc" } }),
      prisma.tradingSession.count({ where }),
    ]);

    return NextResponse.json(
      { data, total, page, totalPages: Math.ceil(total / limit) },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sessionSchema.parse(body);
    const session = await prisma.tradingSession.create({ data: validated });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
