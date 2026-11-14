"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientWaitlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/waitlist", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setItems(data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/waitlist?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Лист ожидания</h1>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Вы не записаны в лист ожидания. Записаться можно на карточке объекта, если нужная дата занята.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  {e.venue ? (
                    <Link href={`/catalog/${e.venue.slug}`} className="font-medium hover:underline">{e.venue.title}</Link>
                  ) : (
                    <span className="font-medium">Объект</span>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Желаемая дата: {new Date(e.desiredDate).toLocaleDateString("ru-RU")}
                    {e.notified ? " · уведомлены об освобождении" : " · ожидает освобождения"}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => void remove(e.id)}>Убрать</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
