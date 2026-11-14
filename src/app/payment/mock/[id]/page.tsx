"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PaymentInfo = {
  providerPaymentId: string;
  amount: number;
  status: string;
  bookingId: string;
  venueTitle: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export default function MockPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/payments/mock/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setInfo(d?.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const sendWebhook = async (status: "success" | "failed") => {
    setPaying(true);
    try {
      const res = await fetch("/api/v1/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerPaymentId: id, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(status === "success" ? "Оплата прошла успешно! Бронирование подтверждено." : "Оплата отменена.");
        setInfo((prev) => (prev ? { ...prev, status: status === "success" ? "SUCCESS" : "FAILED" } : prev));
      } else {
        setResult(data?.error?.message || "Ошибка");
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;
  if (!info) return <div className="p-8 text-center text-muted-foreground">Платёж не найден</div>;

  const paid = info.status === "SUCCESS";

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <h1 className="text-2xl font-bold">Демо-оплата</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{info.venueTitle || "Бронирование"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Сумма</span>
            <span className="font-semibold">{info.amount / 100} ₽</span>
          </div>
          {info.startsAt ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Начало</span>
              <span>{new Date(info.startsAt).toLocaleString("ru-RU")}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Статус</span>
            <span className={paid ? "font-semibold text-green-600" : ""}>{info.status}</span>
          </div>
        </CardContent>
      </Card>

      {paid ? (
        <p className="text-center text-green-600">Платёж оплачен ✓</p>
      ) : info.status === "FAILED" ? (
        <p className="text-center text-red-600">Платёж не прошёл</p>
      ) : (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => void sendWebhook("success")} disabled={paying}>
            {paying ? "..." : "Оплатить"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => void sendWebhook("failed")} disabled={paying}>
            Отменить
          </Button>
        </div>
      )}
      {result ? <p className="text-center text-sm text-muted-foreground">{result}</p> : null}
      <p className="text-center text-xs text-muted-foreground">
        Это тестовая страница провайдера (mock). Реальный провайдер подключается через переменные окружения.
      </p>
    </div>
  );
}
