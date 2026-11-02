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

  useEffect(() => {
    fetch("/api/v1/bookings", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Бронирования</h1>
        <Button>Создать ручное бронирование</Button>
      </div>
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет бронирований
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {booking.venue?.title || "Объект"}
                  </CardTitle>
                  <span className="text-sm">{statusLabels[booking.status]}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Клиент:</span>{" "}
                  {booking.user?.email}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Дата:</span>{" "}
                  {new Date(booking.startsAt).toLocaleString("ru-RU")}
                </div>
                <div className="flex gap-2">
                  {booking.status === "PENDING" && (
                    <>
                      <Button size="sm">Подтвердить</Button>
                      <Button variant="outline" size="sm">Отклонить</Button>
                    </>
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
