"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-red-100 text-red-800",
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

  useEffect(() => {
    fetch("/api/v1/bookings", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои бронирования</h1>
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            У вас пока нет бронирований
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
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
                  {booking.status === "PENDING" && (
                    <Button variant="outline" size="sm">Отменить</Button>
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
