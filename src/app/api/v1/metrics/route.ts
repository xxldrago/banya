import { NextRequest, NextResponse } from "next/server";
import { readGlobalSnapshot, renderPrometheus } from "@/shared/lib/metrics";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const format = new URL(req.url).searchParams.get("format");

  if (format === "prometheus") {
    return new NextResponse(renderPrometheus(), {
      status: 200,
      headers: { "Content-Type": "text/plain; version=0.0.4" },
    });
  }

  const snap = readGlobalSnapshot();
  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    db: dbOk ? "up" : "down",
    counters: Object.fromEntries(snap.counters),
  });
}
