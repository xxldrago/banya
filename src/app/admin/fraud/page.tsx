"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auditActionLabels, label } from "@/shared/lib/labels";

export default function AdminFraudPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/fraud", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setLogs(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Антифрод</h1>
      {logs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Событий нет</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id}>
              <CardContent className="py-3">
                <div className="font-medium">{label(auditActionLabels, l.action)}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(l.createdAt).toLocaleString("ru-RU")} · {l.adminEmail || "система"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
