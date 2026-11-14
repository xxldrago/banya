"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WaitlistButton({ venueId }: { venueId: string }) {
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!date) { setMsg("Выберите дату"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, desiredDate: date }),
      });
      const data = await res.json();
      if (res.ok) setMsg("Вы записаны в лист ожидания");
      else setMsg(data?.error?.message || "Ошибка (возможно, нужна авторизация)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input type="date" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="sm" variant="outline" onClick={() => void join()} disabled={loading}>
          {loading ? "..." : "Записаться в лист ожидания"}
        </Button>
      </div>
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
