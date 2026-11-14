"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bookingStatusLabels, paymentStatusLabels, label, formatDateTime, formatRubles } from "@/shared/lib/labels";

const statusColors: Record<string, string> = {
  DRAFT: "bg-[#F1E9DF] text-[#3B322C]",
  PENDING: "bg-[#FBF3DA] text-[#7A5E12]",
  PENDING_CONFIRMATION: "bg-[#FBF3DA] text-[#7A5E12]",
  CONFIRMED: "bg-[#E6F4EC] text-[#1F7A4C]",
  PAID: "bg-[#E7F0FA] text-[#23507F]",
  IN_PROGRESS: "bg-[#FDEDE4] text-[#B33F13]",
  COMPLETED: "bg-[#E7F0FA] text-[#23507F]",
  CANCELLED: "bg-[#F1E9DF] text-[#3B322C]",
  CANCELLED_BY_CLIENT: "bg-[#F1E9DF] text-[#3B322C]",
  CANCELLED_BY_OWNER: "bg-[#F1E9DF] text-[#3B322C]",
  CANCELLED_BY_ADMIN: "bg-[#F1E9DF] text-[#3B322C]",
  EXPIRED: "bg-[#FDEDE4] text-[#B33F13]",
  NO_SHOW: "bg-[#FDEDE4] text-[#B33F13]",
  DISPUTED: "bg-[#FDEDE4] text-[#B33F13]",
  REFUNDED: "bg-[#E6F4EC] text-[#1F7A4C]",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [refundMsg, setRefundMsg] = useState<string | null>(null);

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
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const refund = data?.data?.refundAmount ?? 0;
      setRefundMsg(refund > 0 ? `Отменено. Возврат: ${formatRubles(refund)}` : "Отменено без возврата");
      load();
    } else {
      alert(data?.error?.message || data?.error || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (tab === "upcoming") return new Date(b.startsAt) >= now && !["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_OWNER", "CANCELLED_BY_ADMIN", "COMPLETED", "EXPIRED", "REFUNDED"].includes(b.status);
    if (tab === "past") return b.status === "COMPLETED" || new Date(b.endsAt) < now;
    return ["CANCELLED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_OWNER", "CANCELLED_BY_ADMIN", "EXPIRED", "REFUNDED", "NO_SHOW"].includes(b.status);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои бронирования</h1>

      {refundMsg && (
        <div className="rounded-md border border-[#BFE3CE] bg-[#E6F4EC] p-3 text-sm text-[#1F7A4C]">
          {refundMsg}
          <button className="ml-3 text-xs underline" onClick={() => setRefundMsg(null)}>закрыть</button>
        </div>
      )}

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
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[booking.status] || "bg-muted"}`}>
                    {label(bookingStatusLabels, booking.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Дата:</span>{" "}
                  {formatDateTime(booking.startsAt)}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Гостей:</span> {booking.guestsCount ?? "—"}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Сумма:</span> {booking.totalPrice ? formatRubles(booking.totalPrice) : "—"}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Статус оплаты:</span>{" "}
                  {booking.payment?.status ? label(paymentStatusLabels, booking.payment.status) : "Не оплачивалось"}
                </div>
                {booking.cancellationReason && (
                  <div className="text-sm text-muted-foreground">
                    Причина отмены: {booking.cancellationReason}
                  </div>
                )}
                <div className="flex gap-2">
                  {(booking.status === "PENDING" || booking.status === "CONFIRMED" || booking.status === "PAID") && new Date(booking.startsAt) >= new Date() && (
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
