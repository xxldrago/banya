"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PromoCodesPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/promocodes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult(data.data || data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Промокоды</h1>
      <Card>
        <CardHeader>
          <CardTitle>Проверить промокод</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите промокод"
            />
            <Button onClick={handleValidate} disabled={loading || !code}>
              {loading ? "Проверка..." : "Проверить"}
            </Button>
          </div>
          {result && (
            <div className="rounded-lg border p-4">
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
