"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Кнопка выхода из личного кабинета: очищает cookie-сессию
 * (access + refresh) и возвращает на страницу входа.
 */
export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={logout} disabled={busy}>
      {busy ? "Выходим..." : "Выйти"}
    </Button>
  );
}
