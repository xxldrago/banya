"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  PENDING: "bg-[#FBF3DA] text-[#7A5E12]",
  CONFIRMED: "bg-[#E6F4EC] text-[#1F7A4C]",
  COMPLETED: "bg-[#E7F0FA] text-[#23507F]",
  CANCELLED: "bg-[#F1E9DF] text-[#3B322C]",
  EXPIRED: "bg-[#FDEDE4] text-[#B33F13]",
};

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждено",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  EXPIRED: "Истекло",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  const load = () => {
    setLoading(true);
    fetch("/api/v1/bookings?limit=50", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: string) => {
    const res = await fetch(`/api/v1/bookings/${id}/cancel`, { method: "PATCH", credentials: "include" });
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || err.message || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (tab === "upcoming") return new Date(b.startsAt) >= now && b.status !== "CANCELLED" && b.status !== "COMPLETED";
    if (tab === "past") return b.status === "COMPLETED" || new Date(b.endsAt) < now;
    return b.status === "CANCELLED" || b.status === "EXPIRED";
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои бронирования</h1>

      <div className="flex gap-2 border-b">
        {(["upcoming", "past", "cancelled"] as const).map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t === "upcoming" ? "Предстоящие" : t === "past" ? "Прошедшие" : "Отменённые"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет бронирований
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <Link href={`/catalog/${booking.venue?.slug}`} className="hover:underline">
                      {booking.venue?.title}
                    </Link>
                  </CardTitle>
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[booking.status]}`}>
                    {statusLabels[booking.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Дата:</span>{" "}
                  {new Date(booking.startsAt).toLocaleString("ru-RU")}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Статус оплаты:</span>{" "}
                  {booking.payment?.status || "Не оплачивалось"}
                </div>
                <div className="flex gap-2">
                  <Link href={`/bookings/${booking.id}`}>
                    <Button variant="outline" size="sm">Подробнее</Button>
                  </Link>
                  {(booking.status === "PENDING" || booking.status === "CONFIRMED") && new Date(booking.startsAt) >= new Date() && (
                    <Button variant="outline" size="sm" onClick={() => cancel(booking.id)}>Отменить</Button>
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
