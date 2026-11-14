"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<{ enabled: boolean; activated: boolean } | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/v1/auth/2fa", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStatus(d?.data ?? { enabled: false, activated: false }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startSetup = async () => {
    const res = await fetch("/api/v1/auth/2fa", { method: "POST", credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setSetup(data.data); setMsg(null); }
    else setMsg(data?.error?.message || "Ошибка");
  };

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/v1/auth/2fa/activate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setMsg("2FA активирована"); setSetup(null); setToken(""); load(); }
    else setMsg(data?.error?.message || "Неверный код");
  };

  const deactivate = async () => {
    const res = await fetch("/api/v1/auth/2fa", { method: "DELETE", credentials: "include" });
    if (res.ok) { setMsg("2FA отключена"); setSetup(null); load(); }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Безопасность — двухфакторная аутентификация</h1>

      <Card>
        <CardHeader><CardTitle>Статус</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {status?.activated
              ? "✅ 2FA включена. При входе требуется код из приложения-аутентификатора."
              : status?.enabled
                ? "⚠️ Настройка начата, но не подтверждена."
                : "2FA не включена."}
          </p>
          {!status?.enabled ? (
            <Button onClick={() => void startSetup()}>Настроить 2FA</Button>
          ) : (
            <Button variant="outline" onClick={() => void deactivate()}>Отключить 2FA</Button>
          )}
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </CardContent>
      </Card>

      {setup ? (
        <Card>
          <CardHeader><CardTitle>Подтверждение</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">Отсканируйте QR-код в приложении (Google Authenticator, 1Password и т.п.):</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qrCodeUrl} alt="QR-код" className="h-48 w-48" />
              <p className="text-xs text-muted-foreground">Секрет (вручную): <code>{setup.secret}</code></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Резервные коды (сохраните их):</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono md:grid-cols-4">
                {setup.backupCodes.map((c) => <span key={c} className="rounded border p-1">{c}</span>)}
              </div>
            </div>
            <form onSubmit={activate} className="flex gap-2">
              <Input placeholder="6-значный код" value={token} onChange={(e) => setToken(e.target.value)} maxLength={10} required />
              <Button type="submit">Активировать</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
