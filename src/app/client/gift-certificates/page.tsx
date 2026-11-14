"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientGiftCertificatesPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gift-certificates/redeem", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) { setMsg(data.data?.message || "Активировано"); setCode(""); }
      else setMsg(data?.error?.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Подарочные сертификаты</h1>
      <Card>
        <CardHeader><CardTitle>Активировать сертификат</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={redeem} className="flex gap-2">
            <Input placeholder="Код сертификата" value={code} onChange={(e) => setCode(e.target.value)} required />
            <Button type="submit" disabled={loading}>{loading ? "..." : "Активировать"}</Button>
          </form>
          {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>О сертификатах</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Подарочные сертификаты можно использовать при бронировании бань и саун. Введите код, чтобы активировать сертификат на вашем аккаунте.
        </CardContent>
      </Card>
    </div>
  );
}
