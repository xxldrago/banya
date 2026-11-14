"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждено",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  CANCELLED_BY_CLIENT: "Отменено клиентом",
  CANCELLED_BY_OWNER: "Отменено владельцем",
  CANCELLED_BY_ADMIN: "Отменено администратором",
  EXPIRED: "Истекло",
  PAID: "Оплачено",
  IN_PROGRESS: "Идёт сейчас",
  NO_SHOW: "Не пришёл",
  DISPUTED: "Спор",
  REFUNDED: "Возврат выполнен",
  DRAFT: "Черновик",
};

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    venueId: "",
    date: new Date().toISOString().slice(0, 10),
    time: "18:00",
    hours: "2",
    guestName: "",
    guestPhone: "",
    guests: "2",
    price: "",
  });
  const [manualMsg, setManualMsg] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const url = filter ? `/api/v1/bookings?status=${filter}&limit=50` : "/api/v1/bookings?limit=50";
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    fetch("/api/v1/partner/venues", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => {
        const v = data.data || [];
        setVenues(v);
        if (v.length && !manual.venueId) setManual((m) => ({ ...m, venueId: v[0].id }));
      });
  }, []);

  const exportCsv = () => {
    const rows = [
      ["ID", "Объект", "Клиент", "Начало", "Конец", "Статус", "Сумма"].join(";"),
      ...bookings.map((b) =>
        [b.id, b.venue?.title || "", b.user?.email || "", new Date(b.startsAt).toISOString(), new Date(b.endsAt).toISOString(), b.status, b.totalPrice ?? ""].join(";"),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const act = async (id: string, action: "confirm" | "cancel") => {
    const res = await fetch(`/api/v1/bookings/${id}/${action}`, {
      method: "PATCH",
      credentials: "include",
    });
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error?.message || err.error || "Ошибка");
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualMsg(null);
    const startsAt = new Date(`${manual.date}T${manual.time}:00`).toISOString();
    const endsAt = new Date(new Date(startsAt).getTime() + Number(manual.hours) * 3600000).toISOString();
    try {
      const res = await fetch("/api/v1/partner/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          venueId: manual.venueId,
          startsAt,
          endsAt,
          guestName: manual.guestName,
          guestPhone: manual.guestPhone,
          guests: Number(manual.guests),
          price: manual.price ? Number(manual.price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.error || "Ошибка");
      setManualMsg("Ручное бронирование создано");
      load();
    } catch (err) {
      setManualMsg(err instanceof Error ? err.message : "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Бронирования</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={bookings.length === 0}>
            Экспорт CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowManual((v) => !v)}>
            {showManual ? "Скрыть форму" : "Ручное бронирование"}
          </Button>
          <select className="rounded border px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Все</option>
            <option value="PENDING">Ожидает</option>
            <option value="CONFIRMED">Подтверждено</option>
            <option value="COMPLETED">Завершено</option>
            <option value="CANCELLED">Отменено</option>
          </select>
        </div>
      </div>

      {showManual && (
        <Card>
          <CardHeader><CardTitle className="text-base">Новое ручное бронирование</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitManual} className="grid gap-3 md:grid-cols-2">
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={manual.venueId} onChange={(e) => setManual({ ...manual, venueId: e.target.value })} required>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
              </select>
              <input type="date" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} required />
              <input type="time" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={manual.time} onChange={(e) => setManual({ ...manual, time: e.target.value })} required />
              <input type="number" min="1" className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Часов" value={manual.hours} onChange={(e) => setManual({ ...manual, hours: e.target.value })} required />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Имя гостя" value={manual.guestName} onChange={(e) => setManual({ ...manual, guestName: e.target.value })} />
              <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Телефон гостя" value={manual.guestPhone} onChange={(e) => setManual({ ...manual, guestPhone: e.target.value })} />
              <input type="number" min="1" className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Гостей" value={manual.guests} onChange={(e) => setManual({ ...manual, guests: e.target.value })} />
              <input type="number" className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Цена (опц.)" value={manual.price} onChange={(e) => setManual({ ...manual, price: e.target.value })} />
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit">Создать</Button>
                {manualMsg && <span className="text-sm text-muted-foreground">{manualMsg}</span>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
                  <span className="text-sm">{statusLabels[booking.status] || booking.status}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Клиент:</span> {booking.user?.email || booking.user?.phone || "—"}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Дата:</span>{" "}
                  {new Date(booking.startsAt).toLocaleString("ru-RU")} — {new Date(booking.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Сумма:</span> {booking.totalPrice ? `${booking.totalPrice} ₽` : "—"}
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
