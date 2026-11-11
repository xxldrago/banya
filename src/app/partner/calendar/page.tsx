"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/bookings?limit=100", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  const byDay: Record<string, any[]> = {};
  bookings.forEach((b) => {
    const day = new Date(b.startsAt).toLocaleDateString("ru-RU");
    (byDay[day] ||= []).push(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Календарь</h1>
        <Button variant="outline">Блокировать слот</Button>
      </div>
      {Object.keys(byDay).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Бронирований нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDay).map(([day, bs]) => (
            <Card key={day}>
              <CardHeader><CardTitle className="text-base">{day}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {bs.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b py-2 text-sm">
                    <span>{new Date(b.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} — {new Date(b.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{b.venue?.title} · {b.user?.email}</span>
                    <span className="text-muted-foreground">{b.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
