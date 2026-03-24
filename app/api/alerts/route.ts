import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const alertSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["PRICE_ABOVE", "PRICE_BELOW", "RSI_OVERBOUGHT", "RSI_OVERSOLD", "MACD_CROSS", "VOLUME_SPIKE"]),
  condition: z.string().min(1),
  targetPrice: z.number().optional(),
  message: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const symbol = searchParams.get("symbol");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (symbol) where.symbol = symbol;
    if (active !== null && active !== undefined) where.active = active === "true";

    const [data, total] = await Promise.all([
      prisma.alert.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.alert.count({ where }),
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
    const validated = alertSchema.parse(body);
    const alert = await prisma.alert.create({ data: validated });
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
