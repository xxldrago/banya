"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RouteStat = { route: string; requests: number; p95: number; errors: number };
type Alert = { id: string; severity: "critical" | "warning"; message: string; value: number; threshold: number };
type Data = {
  status: string;
  time: string;
  uptimeSeconds: number;
  memoryMb: number;
  db: string;
  redis: string;
  routes: RouteStat[];
  alerts: Alert[];
};

export default function AdminMonitoringPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      fetch("/api/v1/admin/monitoring", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.data && setData(d.data))
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  if (loading && !data) return <div>Загрузка...</div>;
  if (!data) return <div className="text-muted-foreground">Нет данных мониторинга</div>;

  const totalRequests = data.routes.reduce((acc, r) => acc + r.requests, 0);
  const totalErrors = data.routes.reduce((acc, r) => acc + r.errors, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мониторинг</h1>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-md border p-3 text-sm ${
                a.severity === "critical" ? "border-red-300 bg-red-50 text-red-800" : "border-yellow-300 bg-yellow-50 text-yellow-800"
              }`}
            >
              <b>{a.severity === "critical" ? "Критично" : "Предупреждение"}:</b> {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Статус</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.status === "ok" ? "text-green-600" : "text-red-600"}`}>
              {data.status === "ok" ? "OK" : "Деградация"}
            </div>
            <p className="text-xs text-muted-foreground">обновлено {new Date(data.time).toLocaleTimeString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Аптайм</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(data.uptimeSeconds / 60)} мин</div>
            <p className="text-xs text-muted-foreground">память {data.memoryMb} МБ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">БД / Redis</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.db === "up" ? "✓" : "✗"} / {data.redis === "up" ? "✓" : "✗"}</div>
            <p className="text-xs text-muted-foreground">postgres / кэш</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Запросы</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">ошибок 5xx: {totalErrors}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Топ маршрутов (p95 latency, сек)</CardTitle></CardHeader>
        <CardContent>
          {data.routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет запросов с момента запуска сервера</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2">Маршрут</th>
                  <th className="py-2">Запросов</th>
                  <th className="py-2">p95, с</th>
                  <th className="py-2">5xx</th>
                </tr>
              </thead>
              <tbody>
                {data.routes.map((r) => (
                  <tr key={r.route} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{r.route}</td>
                    <td className="py-2">{r.requests}</td>
                    <td className={`py-2 ${r.p95 >= 1.5 ? "text-red-600 font-semibold" : ""}`}>{r.p95.toFixed(3)}</td>
                    <td className="py-2">{r.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Метрики в формате Prometheus: <code>GET /api/v1/metrics?format=prometheus</code> · автообновление каждые 10 с
      </p>
    </div>
  );
}
