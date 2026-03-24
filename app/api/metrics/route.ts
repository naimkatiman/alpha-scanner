import { NextResponse } from "next/server";
const metrics = { requestCount: 0, errorCount: 0, totalResponseTimeMs: 0 };
export function trackRequest(durationMs: number, isError: boolean = false) {
  metrics.requestCount++; metrics.totalResponseTimeMs += durationMs; if (isError) metrics.errorCount++;
}
export async function GET() {
  const avg = metrics.requestCount > 0 ? Math.round(metrics.totalResponseTimeMs / metrics.requestCount) : 0;
  return NextResponse.json({
    requestCount: metrics.requestCount, errorCount: metrics.errorCount,
    errorRate: metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount * 100).toFixed(2) + "%" : "0%",
    avgResponseTimeMs: avg, uptime: process.uptime(), timestamp: Date.now(),
  });
}
