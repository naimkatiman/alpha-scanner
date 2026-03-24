import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { parsePaginationParams, buildPaginatedResponse } from "@/app/lib/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, q, skip } = parsePaginationParams(searchParams);
    const type = searchParams.get("type") || "signals";

    if (type === "alerts") {
      const where: Record<string, unknown> = {};
      if (q) { where.OR = [{ symbol: { contains: q } }, { message: { contains: q } }]; }
      const [data, total] = await Promise.all([
        prisma.alert.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.alert.count({ where }),
      ]);
      return NextResponse.json(buildPaginatedResponse(data, total, page, limit));
    }

    if (type === "sessions") {
      const where: Record<string, unknown> = {};
      if (q) { where.symbol = { contains: q }; }
      const [data, total] = await Promise.all([
        prisma.tradingSession.findMany({ where, skip, take: limit, orderBy: { openedAt: "desc" } }),
        prisma.tradingSession.count({ where }),
      ]);
      return NextResponse.json(buildPaginatedResponse(data, total, page, limit));
    }

    if (type === "backtests") {
      const where: Record<string, unknown> = {};
      if (q) { where.OR = [{ symbol: { contains: q } }, { strategyName: { contains: q } }]; }
      const [data, total] = await Promise.all([
        prisma.backtest.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.backtest.count({ where }),
      ]);
      return NextResponse.json(buildPaginatedResponse(data, total, page, limit));
    }

    const where: Record<string, unknown> = {};
    if (q) { where.OR = [{ symbol: { contains: q } }, { direction: { contains: q } }]; }
    const [data, total] = await Promise.all([
      prisma.signalRecord.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.signalRecord.count({ where }),
    ]);

    return NextResponse.json(buildPaginatedResponse(data, total, page, limit), {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
