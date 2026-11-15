"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  partnerStatusLabels,
  venueStatusLabels,
  moderationStatusLabels,
  documentTypeLabels,
  documentStatusLabels,
  payoutStatusLabels,
  payoutMethodLabels,
  bookingStatusLabels,
  reviewStatusLabels,
  staffRoleLabels,
  label,
  formatDate,
  formatDateTime,
  formatRubles,
} from "@/shared/lib/labels";

export default function AdminPartnerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/admin/partners/${id}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json?.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Загрузка...</div>;
  if (!data) return <div>Партнёр не найден</div>;

  const p = data.partner;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{p.companyName || p.user?.email}</h1>
          <div className="text-sm text-muted-foreground">
            {p.user?.email} · {label(partnerStatusLabels, p.status)} · объектов: {p.venues.length}
          </div>
        </div>
        <Link href="/admin/partners">
          <Button variant="outline">← К списку</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Выручка</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatRubles(data.revenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Объектов</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{p.venues.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Сотрудников</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{p.staffMembers.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Реквизиты и контакты</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <div>Компания: <span className="font-medium">{p.companyName || "—"}</span></div>
          <div>ИНН: <span className="font-medium">{p.inn || "—"}</span></div>
          <div>Телефон: <span className="font-medium">{p.user?.phone || "—"}</span></div>
          <div>Аккаунт создан: <span className="font-medium">{formatDate(p.user?.createdAt)}</span></div>
          {p.payoutDetails && (
            <>
              <div>Банк: <span className="font-medium">{p.payoutDetails.bankName || "—"}</span></div>
              <div>Счёт: <span className="font-medium">{p.payoutDetails.accountNumber || "—"}</span></div>
              <div>БИК: <span className="font-medium">{p.payoutDetails.bik || "—"}</span></div>
              <div>Получатель: <span className="font-medium">{p.payoutDetails.recipientName || "—"}</span></div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Объекты</CardTitle></CardHeader>
        <CardContent>
          {p.venues.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Объектов нет</div>
          ) : (
            <div className="space-y-2">
              {p.venues.map((v: any) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm">
                  <div>
                    <Link href={`/catalog/${v.slug}`} className="font-medium hover:underline">
                      {v.title}
                    </Link>
                    <div className="text-muted-foreground">
                      {v.city?.name || "—"} · от {formatRubles(v.priceFrom)} · броней: {v._count?.bookings ?? 0} · отзывов: {v._count?.reviews ?? 0}
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground">
                    {label(venueStatusLabels, v.status)} · {label(moderationStatusLabels, v.moderationStatus)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Документы</CardTitle></CardHeader>
          <CardContent>
            {p.documents.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Документов нет</div>
            ) : (
              <div className="space-y-2 text-sm">
                {p.documents.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between border-b pb-2">
                    <span>{label(documentTypeLabels, d.type)}</span>
                    <span className="text-muted-foreground">{label(documentStatusLabels, d.status)} · {formatDate(d.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Выплаты</CardTitle></CardHeader>
          <CardContent>
            {p.payouts.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">Выплат нет</div>
            ) : (
              <div className="space-y-2 text-sm">
                {p.payouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{formatRubles(Math.round(payout.amount / 100))}</span>
                    <span className="text-muted-foreground">
                      {label(payoutStatusLabels, payout.status)} · {label(payoutMethodLabels, payout.method)} · {formatDate(payout.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Сотрудники</CardTitle></CardHeader>
        <CardContent>
          {p.staffMembers.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Сотрудников нет</div>
          ) : (
            <div className="space-y-2 text-sm">
              {p.staffMembers.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.email} · {label(staffRoleLabels, s.role)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Последние бронирования</CardTitle></CardHeader>
        <CardContent>
          {data.bookings.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Нет бронирований</div>
          ) : (
            <div className="space-y-2 text-sm">
              {data.bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{b.venue?.title || "Объект"}</div>
                    <div className="text-muted-foreground">{b.user?.email || "—"} · {formatDateTime(b.startsAt)}</div>
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

      <Card>
        <CardHeader><CardTitle>Последние отзывы</CardTitle></CardHeader>
        <CardContent>
          {data.reviews.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">Отзывов нет</div>
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
  );
}
