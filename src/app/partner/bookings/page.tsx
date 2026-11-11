"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждено",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  EXPIRED: "Истекло",
};

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () => {
    setLoading(true);
    const url = filter ? `/api/v1/bookings?status=${filter}&limit=50` : "/api/v1/bookings?limit=50";
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const act = async (id: string, action: "confirm" | "cancel") => {
    const res = await fetch(`/api/v1/bookings/${id}/${action}`, {
      method: "PATCH",
      credentials: "include",
    });
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Бронирования</h1>
        <select className="rounded border px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Все</option>
          <option value="PENDING">Ожидает</option>
          <option value="CONFIRMED">Подтверждено</option>
          <option value="COMPLETED">Завершено</option>
          <option value="CANCELLED">Отменено</option>
        </select>
      </div>
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Нет бронирований</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{booking.venue?.title || "Объект"}</CardTitle>
                  <span className="text-sm">{statusLabels[booking.status]}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Клиент:</span> {booking.user?.email}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Дата:</span>{" "}
                  {new Date(booking.startsAt).toLocaleString("ru-RU")} — {new Date(booking.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex gap-2">
                  {booking.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => act(booking.id, "confirm")}>Подтвердить</Button>
                      <Button variant="outline" size="sm" onClick={() => act(booking.id, "cancel")}>Отклонить</Button>
                    </>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <Button variant="outline" size="sm" onClick={() => act(booking.id, "cancel")}>Отменить</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
