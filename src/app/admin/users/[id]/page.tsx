"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  roleLabels,
  adminRoleLabels,
  userStatusLabels,
  partnerStatusLabels,
  bookingStatusLabels,
  paymentStatusLabels,
  reviewStatusLabels,
  ticketStatusLabels,
  priorityLabels,
  auditActionLabels,
  auditEntityLabels,
  label,
  formatDate,
  formatDateTime,
  formatRubles,
} from "@/shared/lib/labels";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/admin/users/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json?.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Загрузка...</div>;
  if (!data) return <div>Пользователь не найден</div>;

  const u = data.user;
  const fullName = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{u.email}</h1>
          <div className="text-sm text-muted-foreground">
            {fullName} · {label(roleLabels, u.role)}
            {u.adminRole ? ` (${label(adminRoleLabels, u.adminRole)})` : ""} ·{" "}
            {label(userStatusLabels, u.status)}
          </div>
        </div>
        <Link href="/admin/users">
          <Button variant="outline">← К списку</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Профиль</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Имя: <span className="font-medium">{fullName}</span></div>
            <div>Email: <span className="font-medium">{u.email}</span></div>
            <div>Телефон: <span className="font-medium">{u.phone || "—"}</span></div>
            <div>Дата рождения: <span className="font-medium">{u.profile?.birthDate ? formatDate(u.profile.birthDate) : "—"}</span></div>
            <div>Регистрация: <span className="font-medium">{formatDateTime(u.createdAt)}</span></div>
            <div>Статус: <span className="font-medium">{label(userStatusLabels, u.status)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Активность</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Бронирований: <span className="font-medium">{u._count?.bookings ?? 0}</span></div>
            <div>Отзывов: <span className="font-medium">{u._count?.reviews ?? 0}</span></div>
            <div>Обращений в поддержку: <span className="font-medium">{u._count?.supportTickets ?? 0}</span></div>
            <div>Уведомлений: <span className="font-medium">{u._count?.notifications ?? 0}</span></div>
            {u.partner && (
              <div className="pt-2">
                Партнёр:{" "}
                <Link href={`/admin/partners/${u.partner.id}`} className="font-medium hover:underline">
                  {u.partner.companyName || "Карточка партнёра"}
                </Link>{" "}
                · {label(partnerStatusLabels, u.partner.status)} · объектов: {u.partner._count?.venues ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Последние бронирования</CardTitle></CardHeader>
        <CardContent>
          {data.bookings.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет бронирований</div>
          ) : (
            <div className="space-y-2">
              {data.bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    <div className="font-medium">{b.venue?.title || "Объект"}</div>
                    <div className="text-muted-foreground">{formatDateTime(b.startsAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {b.payment?.amount != null
                        ? formatRubles(Math.round(b.payment.amount / 100))
                        : formatRubles(b.totalPrice ?? 0)}
                    </div>
                    <div className="text-muted-foreground">{label(bookingStatusLabels, b.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Платежи</CardTitle></CardHeader>
          <CardContent>
            {data.payments.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Нет платежей</div>
            ) : (
              <div className="space-y-2 text-sm">
                {data.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2">
                    <span>{formatDate(p.paidAt || p.createdAt)}</span>
                    <span className="font-medium">{formatRubles(Math.round(p.amount / 100))}</span>
                    <span className="text-muted-foreground">{label(paymentStatusLabels, p.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Отзывы</CardTitle></CardHeader>
          <CardContent>
            {data.reviews.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Нет отзывов</div>
            ) : (
              <div className="space-y-2 text-sm">
                {data.reviews.map((r: any) => (
                  <div key={r.id} className="border-b pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.venue?.title || "Объект"} · ★ {r.rating}/5</span>
                      <span className="text-muted-foreground">{label(reviewStatusLabels, r.status)}</span>
                    </div>
                    <div className="text-muted-foreground line-clamp-2">{r.comment}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Обращения в поддержку</CardTitle></CardHeader>
        <CardContent>
          {data.tickets.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Обращений нет</div>
          ) : (
            <div className="space-y-2 text-sm">
              {data.tickets.map((t: any) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <div className="font-medium">{t.subject}</div>
                    <div className="text-muted-foreground">{formatDateTime(t.createdAt)}</div>
                  </div>
                  <div className="text-right text-muted-foreground">
                    {label(ticketStatusLabels, t.status)} · {label(priorityLabels, t.priority)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {u.role === "ADMIN" && (
        <Card>
          <CardHeader><CardTitle>Действия в системе</CardTitle></CardHeader>
          <CardContent>
            {data.audit.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Записей нет</div>
            ) : (
              <div className="space-y-2 text-sm">
                {data.audit.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between border-b pb-2">
                    <span>{label(auditActionLabels, l.action)} · {label(auditEntityLabels, l.entityType)}</span>
                    <span className="text-muted-foreground">{formatDateTime(l.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
