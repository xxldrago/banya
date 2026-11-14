import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { readGlobalSnapshot, renderPrometheus } from "@/shared/lib/metrics";
import { evaluateAlerts } from "@/shared/lib/alerts";
import { redis } from "@/shared/lib/redis";
import { apiError } from "@/shared/lib/api-response";

export const dynamic = "force-dynamic";

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx];
}

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return apiError("UNAUTHORIZED", "Unauthorized", 401);
  if (user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin required", 403);

  let dbUp = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbUp = true;
  } catch {
    dbUp = false;
  }

  const redisMode = await redis.ping() === "ERROR" ? "down" : redis.mode;
  const snap = readGlobalSnapshot();

  // Per-route request counts and p95 latency.
  const routes: Record<string, { requests: number; p95: number; errors: number }> = {};
  for (const [k, v] of snap.counters) {
    if (!k.startsWith("http_requests_total")) continue;
    const route = k.includes('route="') ? k.split('route="')[1].split('"')[0] : "unknown";
    routes[route] ??= { requests: 0, p95: 0, errors: 0 };
    routes[route].requests += v;
    if (k.includes('status="5xx"')) routes[route].errors += v;
  }
  for (const [k, values] of snap.histograms) {
    if (!k.startsWith("http_request_duration_seconds")) continue;
    const route = k.includes('route="') ? k.split('route="')[1].split('"')[0] : "unknown";
    if (routes[route]) routes[route].p95 = Number(quantile([...values].sort((a, b) => a - b), 0.95).toFixed(3));
  }

  const alerts = evaluateAlerts(dbUp);

  const format = new URL(req.url).searchParams.get("format");
  if (format === "prometheus") {
    return new NextResponse(renderPrometheus(), {
      status: 200,
      headers: { "Content-Type": "text/plain; version=0.0.4" },
    });
  }

  return NextResponse.json({
    data: {
      status: dbUp && alerts.every((a) => a.severity !== "critical") ? "ok" : "degraded",
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      db: dbUp ? "up" : "down",
      redis: redisMode,
      routes: Object.entries(routes)
        .map(([route, s]) => ({ route, ...s }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 15),
      alerts,
    },
  });
}
