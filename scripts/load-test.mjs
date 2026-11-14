#!/usr/bin/env node
// Minimal load test: hammers a list of URLs with N virtual users for D seconds.
// Usage: node scripts/load-test.mjs [--base http://localhost:3000] [--vus 20] [--duration 30] [--path /catalog]
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    vus: { type: "string", default: "20" },
    duration: { type: "string", default: "30" },
    path: { type: "string", default: "/catalog" },
  },
});

const BASE = values.base.replace(/\/$/, "");
const VUS = Math.max(1, parseInt(values.vus, 10));
const DURATION = Math.max(1, parseInt(values.duration, 10));
const PATHS = [values.path, "/api/v1/health", "/api/v1/catalog/venues?limit=10"];

const stats = { requests: 0, errors: 0, status5xx: 0, latencies: [] };

async function worker(stopAt) {
  let i = 0;
  while (Date.now() < stopAt) {
    const path = PATHS[i++ % PATHS.length];
    const start = performance.now();
    try {
      const res = await fetch(BASE + path, { redirect: "manual" });
      stats.requests++;
      if (res.status >= 500) stats.status5xx++;
      await res.arrayBuffer().catch(() => {});
    } catch {
      stats.errors++;
    }
    stats.latencies.push((performance.now() - start) / 1000);
  }
}

const stopAt = Date.now() + DURATION * 1000;
console.log(`Load test: ${VUS} VUs x ${DURATION}s against ${BASE}`);
await Promise.all(Array.from({ length: VUS }, () => worker(stopAt)));

const lat = stats.latencies.sort((a, b) => a - b);
const q = (p) => (lat.length ? lat[Math.min(lat.length - 1, Math.ceil(p * lat.length) - 1)] : 0);
const rps = stats.requests / DURATION;

console.log(JSON.stringify({
  requests: stats.requests,
  rps: Number(rps.toFixed(1)),
  errors: stats.errors,
  status5xx: stats.status5xx,
  p50: Number(q(0.5).toFixed(3)),
  p90: Number(q(0.9).toFixed(3)),
  p99: Number(q(0.99).toFixed(3)),
}, null, 2));

process.exit(stats.status5xx > 0 || stats.errors > 0 ? 1 : 0);
