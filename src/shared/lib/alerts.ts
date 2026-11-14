import { readGlobalSnapshot } from "@/shared/lib/metrics";

/**
 * Threshold-based alerting on top of the in-process metrics registry.
 * Evaluates the current snapshot on demand (no background worker needed
 * for the demo): 5xx error ratio and per-route p95 latency.
 */

export type AlertSeverity = "critical" | "warning";

export type Alert = {
  id: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
};

const ERROR_RATIO_WARNING = 0.02; // 2% of responses are 5xx
const ERROR_RATIO_CRITICAL = 0.1; // 10% of responses are 5xx
const P95_WARNING_SECONDS = 1.5;
const P95_CRITICAL_SECONDS = 5;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx];
}

export function evaluateAlerts(dbUp = true): Alert[] {
  const alerts: Alert[] = [];
  const snap = readGlobalSnapshot();

  if (!dbUp) {
    alerts.push({
      id: "db_down",
      severity: "critical",
      message: "База данных недоступна",
      value: 1,
      threshold: 0,
    });
  }

  // Aggregate 5xx ratio across all routes.
  let total = 0;
  let errors = 0;
  for (const [k, v] of snap.counters) {
    if (!k.startsWith("http_requests_total")) continue;
    total += v;
    if (k.includes('status="5xx"')) errors += v;
  }
  if (total >= 50) {
    const ratio = errors / total;
    if (ratio >= ERROR_RATIO_CRITICAL) {
      alerts.push({
        id: "error_rate",
        severity: "critical",
        message: `Доля ошибок 5xx ${(ratio * 100).toFixed(1)}% (порог ${(ERROR_RATIO_CRITICAL * 100).toFixed(0)}%)`,
        value: Number(ratio.toFixed(4)),
        threshold: ERROR_RATIO_CRITICAL,
      });
    } else if (ratio >= ERROR_RATIO_WARNING) {
      alerts.push({
        id: "error_rate",
        severity: "warning",
        message: `Доля ошибок 5xx ${(ratio * 100).toFixed(1)}% (порог ${(ERROR_RATIO_WARNING * 100).toFixed(0)}%)`,
        value: Number(ratio.toFixed(4)),
        threshold: ERROR_RATIO_WARNING,
      });
    }
  }

  // Per-route p95 latency.
  for (const [k, values] of snap.histograms) {
    if (!k.startsWith("http_request_duration_seconds")) continue;
    if (values.length < 20) continue; // avoid noise on cold routes
    const p95 = quantile([...values].sort((a, b) => a - b), 0.95);
    const route = k.includes('route="') ? k.split('route="')[1].split('"')[0] : "unknown";
    if (p95 >= P95_CRITICAL_SECONDS) {
      alerts.push({
        id: `p95_${route}`,
        severity: "critical",
        message: `p95 latency ${p95.toFixed(2)}с у ${route} (порог ${P95_CRITICAL_SECONDS}с)`,
        value: Number(p95.toFixed(3)),
        threshold: P95_CRITICAL_SECONDS,
      });
    } else if (p95 >= P95_WARNING_SECONDS) {
      alerts.push({
        id: `p95_${route}`,
        severity: "warning",
        message: `p95 latency ${p95.toFixed(2)}с у ${route} (порог ${P95_WARNING_SECONDS}с)`,
        value: Number(p95.toFixed(3)),
        threshold: P95_WARNING_SECONDS,
      });
    }
  }

  return alerts;
}
