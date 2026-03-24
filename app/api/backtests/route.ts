import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const backtestSchema = z.object({
  strategyName: z.string().min(1),
  symbol: z.string().min(1),
  timeframe: z.string().min(1),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  totalTrades: z.number().int().min(0),
  winRate: z.number().min(0).max(100),
  profitFactor: z.number(),
  maxDrawdown: z.number(),
  netProfit: z.number(),
  sharpeRatio: z.number().optional(),
  config: z.string(),
  results: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const symbol = searchParams.get("symbol");
    const strategy = searchParams.get("strategy");

    const where: Record<string, unknown> = {};
    if (symbol) where.symbol = symbol;
    if (strategy) where.strategyName = strategy;

    const [data, total] = await Promise.all([
      prisma.backtest.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.backtest.count({ where }),
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
    const validated = backtestSchema.parse(body);
    const backtest = await prisma.backtest.create({ data: validated });
    return NextResponse.json(backtest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
