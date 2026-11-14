"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { documentTypeLabels, documentStatusLabels, label } from "@/shared/lib/labels";

export default function AdminDocumentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/documents", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch("/api/v1/admin/documents", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Документы партнёров</h1>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Документов пока нет</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <b>{label(documentTypeLabels, d.type)}</b> · {d.partner?.companyName || d.partner?.id} · {label(documentStatusLabels, d.status)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setStatus(d.id, "approved")}>Одобрить</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(d.id, "rejected")}>Отклонить</Button>
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Открыть</a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
