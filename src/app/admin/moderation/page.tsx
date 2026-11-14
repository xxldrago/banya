"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Item = { id: string; title: string; slug?: string; imageUrl?: string };
type Queue = { banners: Item[]; collections: Item[]; seoPages: Item[] };

const EMPTY: Queue = { banners: [], collections: [], seoPages: [] };

export default function AdminModerationPage() {
  const [queue, setQueue] = useState<Queue>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/v1/admin/moderation", { credentials: "include" });
    setQueue(res.ok ? await res.json().then((d) => d.data) : EMPTY);
  }

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, []);

  async function decide(type: string, id: string, decision: "APPROVED" | "REJECTED") {
    setBusy(id);
    try {
      await fetch("/api/v1/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, id, decision }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  const sections: Array<{ title: string; type: string; items: Item[] }> = [
    { title: "Баннеры", type: "banner", items: queue.banners },
    { title: "Коллекции", type: "collection", items: queue.collections },
    { title: "SEO-страницы", type: "seoPage", items: queue.seoPages },
  ];

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Очередь модерации контента</h1>
      {sections.map((s) => (
        <Card key={s.type}>
          <CardHeader>
            <CardTitle>
              {s.title} ({s.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {s.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет элементов на модерации</p>
            ) : (
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded border p-2">
                    <div className="text-sm">
                      <b>{item.title}</b>
                      {item.slug ? <span className="text-muted-foreground"> · {item.slug}</span> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busy === item.id}
                        onClick={() => decide(s.type, item.id, "APPROVED")}
                      >
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === item.id}
                        onClick={() => decide(s.type, item.id, "REJECTED")}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
