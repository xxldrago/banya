// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";
import { signAccess } from "@/modules/auth/token.service";
import { readGlobalSnapshot, renderPrometheus } from "@/shared/lib/metrics";
import { evaluateAlerts } from "@/shared/lib/alerts";
import { GET as metricsRoute } from "@/app/api/v1/metrics/route";
import { GET as monitoringRoute } from "@/app/api/v1/admin/monitoring/route";

let adminToken: string;

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

/** Simulate what server.js instrumentation does on every request. */
function recordRequest(route: string, status: number, durationMs: number) {
  const state = (globalThis as any).__pardaMetrics ??= { counters: new Map(), hists: new Map() };
  const k = `http_requests_total{method="GET",route="${route}",status="${String(status).charAt(0)}xx"}`;
  state.counters.set(k, (state.counters.get(k) ?? 0) + 1);
  const hk = `http_request_duration_seconds{route="${route}"}`;
  const arr = state.hists.get(hk) ?? [];
  arr.push(durationMs / 1000);
  state.hists.set(hk, arr);
}

describe("Metrics and monitoring (Phase 33)", () => {
  beforeAll(async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) throw new Error("No admin user in DB");
    adminToken = await signAccess(admin.id, admin.role, admin.adminRole ?? "superadmin");
  });

  it("records counters and histograms in the global snapshot", () => {
    recordRequest("/api/v1/test-metrics", 200, 120);
    recordRequest("/api/v1/test-metrics", 500, 900);

    const snap = readGlobalSnapshot();
    const okCounter = snap.counters.find(([k]) => k.includes('route="/api/v1/test-metrics"') && k.includes('status="2xx"'));
    const errCounter = snap.counters.find(([k]) => k.includes('route="/api/v1/test-metrics"') && k.includes('status="5xx"'));
    expect(okCounter?.[1]).toBeGreaterThanOrEqual(1);
    expect(errCounter?.[1]).toBeGreaterThanOrEqual(1);

    const hist = snap.histograms.find(([k]) => k.includes('route="/api/v1/test-metrics"'));
    expect(hist?.[1].length).toBeGreaterThanOrEqual(2);
  });

  it("renders valid Prometheus exposition format", () => {
    const text = renderPrometheus();
    expect(text).toContain("http_requests_total");
    expect(text).toContain("http_request_duration_seconds_count");
    expect(text).toContain("http_request_duration_seconds_sum");
    expect(text).toContain('quantile="0.99"');
    // Every sample line ends with a numeric value
    for (const line of text.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      expect(line).toMatch(/\s[\d.e+-]+$/);
    }
  });

  it("GET /api/v1/metrics returns JSON snapshot", async () => {
    const res = await metricsRoute(req("/api/v1/metrics"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("uptimeSeconds");
    expect(body).toHaveProperty("counters");
    expect(typeof body.counters).toBe("object");
    expect(body.db).toBe("up");
  });

  it("GET /api/v1/admin/monitoring requires auth", async () => {
    const res = await monitoringRoute(req("/api/v1/admin/monitoring"));
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/admin/monitoring returns health, routes and alerts for admin", async () => {
    const res = await monitoringRoute(
      req("/api/v1/admin/monitoring", { headers: { cookie: `access_token=${adminToken}` } }),
    );
    expect(res.status).toBe(200);
    const d = (await res.json()).data;
    expect(d.status).toBeDefined();
    expect(d.db).toBe("up");
    expect(["redis", "memory"]).toContain(d.redis);
    expect(Array.isArray(d.routes)).toBe(true);
    expect(Array.isArray(d.alerts)).toBe(true);
    expect(typeof d.uptimeSeconds).toBe("number");
  });

  it("prometheus format is served via ?format=prometheus", async () => {
    const res = await monitoringRoute(
      req("/api/v1/admin/monitoring?format=prometheus", { headers: { cookie: `access_token=${adminToken}` } }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("http_requests_total");
  });

  it("evaluateAlerts flags critical when DB is down", () => {
    const alerts = evaluateAlerts(false);
    const dbAlert = alerts.find((a) => a.id === "db_down");
    expect(dbAlert).toBeDefined();
    expect(dbAlert!.severity).toBe("critical");
  });

  it("no alerts when DB is up and traffic is healthy", () => {
    const alerts = evaluateAlerts(true);
    expect(alerts).toHaveLength(0);
  });
});
