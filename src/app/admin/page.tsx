"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  bookingStatusLabels,
  reviewStatusLabels,
  label,
  formatRubles,
  formatDate,
  formatDateTime,
} from "@/shared/lib/labels";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/stats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;

  const s = stats?.stats || {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.users || 0}</div>
            <Link href="/admin/users" className="text-xs text-muted-foreground hover:underline">
              Все пользователи →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Объекты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.venues || 0}</div>
            <Link href="/admin/venues" className="text-xs text-muted-foreground hover:underline">
              Модерация объектов →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Бронирования</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.bookings || 0}</div>
            <Link href="/admin/bookings" className="text-xs text-muted-foreground hover:underline">
              Все бронирования →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Отзывы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.reviews || 0}</div>
            <Link href="/admin/reviews" className="text-xs text-muted-foreground hover:underline">
              Модерация отзывов →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Выручка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRubles(s.revenue ?? 0)}</div>
            <div className="text-xs text-muted-foreground">
              за месяц: {formatRubles(s.monthRevenue ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {s.pendingModeration > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Требует модерации: {s.pendingModeration}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/venues" className="hover:underline">
              Объекты: {s.pendingVenues}
            </Link>
            <Link href="/admin/reviews" className="hover:underline">
              Отзывы: {s.pendingReviews}
            </Link>
            <Link href="/admin/moderation" className="hover:underline">
              Баннеры: {s.pendingBanners}
            </Link>
            <Link href="/admin/moderation" className="hover:underline">
              Подборки: {s.pendingCollections}
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Последние бронирования</CardTitle>
            <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:underline">
              Все →
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.recentBookings || stats.recentBookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Нет данных</div>
            ) : (
              <div className="space-y-2">
                {stats.recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-start justify-between gap-2 border-b pb-2">
                    <div>
                      <div className="font-medium">{booking.venue?.title || "Объект"}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.user?.email || "—"} · {formatDateTime(booking.startsAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {booking.payment?.amount != null
                          ? formatRubles(Math.round(booking.payment.amount / 100))
                          : formatRubles(booking.totalPrice ?? 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {label(bookingStatusLabels, booking.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Последние отзывы</CardTitle>
            <Link href="/admin/reviews" className="text-sm text-muted-foreground hover:underline">
              Все →
            </Link>
          </CardHeader>
          <CardContent>
            {!stats?.recentReviews || stats.recentReviews.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Нет данных</div>
            ) : (
              <div className="space-y-2">
                {stats.recentReviews.map((review: any) => (
                  <div key={review.id} className="border-b pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">
                        {review.venue?.title || "Объект"} · ★ {review.rating}/5
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {label(reviewStatusLabels, review.status)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {review.comment}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {review.user?.email || "—"} · {formatDate(review.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
