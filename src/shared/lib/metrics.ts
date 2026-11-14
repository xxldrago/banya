// Minimal in-process metrics registry (Prometheus text format).
// Counters and histograms only — enough for request rates, error rates
// and latency quantiles without external dependencies.

type CounterMap = Map<string, number>;
type HistMap = Map<string, number[]>;

const counters: CounterMap = new Map();
const histograms: HistMap = new Map();

function key(name: string, labels: Record<string, string | number>): string {
  const parts = Object.entries(labels)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, "'")}"`);
  return parts.length ? `${name}{${parts.join(",")}}` : name;
}

export const metrics = {
  inc(name: string, labels: Record<string, string | number> = {}, value = 1): void {
    const k = key(name, labels);
    counters.set(k, (counters.get(k) ?? 0) + value);
  },

  observe(name: string, labels: Record<string, string | number> = {}, valueSeconds: number): void {
    const k = key(name, labels);
    const arr = histograms.get(k) ?? [];
    arr.push(valueSeconds);
    if (arr.length > 5000) arr.splice(0, arr.length - 5000);
    histograms.set(k, arr);
  },

  snapshot(): { counters: [string, number][]; histograms: [string, number[]][] } {
    return {
      counters: Array.from(counters.entries()),
      histograms: Array.from(histograms.entries()).map(([k, v]) => [k, [...v]]),
    };
  },
};

const QUANTILES: Array<[string, number]> = [
  ["0.5", 0.5],
  ["0.9", 0.9],
  ["0.99", 0.99],
];

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx];
}

type Snapshot = { counters: [string, number][]; histograms: [string, number[]][] };

/**
 * Read the server-level registry populated by server.js request instrumentation.
 * Both live in the same Node process, so globalThis is the shared bus between
 * the plain-JS server and the compiled Next.js route handlers.
 */
export function readGlobalSnapshot(): Snapshot {
  const state = (globalThis as unknown as { __pardaMetrics?: { counters: Map<string, number>; hists: Map<string, number[]> } })
    .__pardaMetrics;
  if (!state) return { counters: [], histograms: [] };
  return {
    counters: Array.from(state.counters?.entries() ?? []),
    histograms: Array.from(state.hists?.entries() ?? []).map(([k, v]) => [k, [...v]]),
  };
}

/** Render the registry in Prometheus text exposition format. */
export function renderPrometheus(snapshot?: Snapshot): string {
  const snap = snapshot ?? readGlobalSnapshot();
  const lines: string[] = [];

  for (const [k, v] of snap.counters) {
    lines.push(`${k} ${v}`);
  }

  for (const [k, values] of snap.histograms) {
    if (values.length === 0) continue;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, x) => acc + x, 0);
    const base = k.includes("{") ? k.slice(0, k.indexOf("{")) : k;
    const labels = k.includes("{") ? k.slice(k.indexOf("{") + 1, k.lastIndexOf("}")) : "";
    const withLabel = (extra: string) => (labels ? `{${labels},${extra}}` : `{${extra}}`);
    const suffix = k.includes("{") ? k.slice(k.indexOf("{")) : "";
    lines.push(`${base}_count${suffix} ${sorted.length}`);
    lines.push(`${base}_sum${suffix} ${sum.toFixed(6)}`);
    for (const [qLabel, q] of QUANTILES) {
      lines.push(`${base}_quantile${withLabel(`quantile="${qLabel}"`)} ${quantile(sorted, q).toFixed(6)}`);
    }
  }

  return lines.join("\n") + "\n";
}
