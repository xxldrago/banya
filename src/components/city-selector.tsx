"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type City = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};

const COOKIE_NAME = "cityId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function readCityCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function writeCityCookie(cityId: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(cityId)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CitySelector() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/v1/cities");
        if (!res.ok) {
          throw new Error("Не удалось загрузить список городов");
        }
        const body = (await res.json()) as { data: City[] };
        if (cancelled) return;
        setCities(body.data);
        const cookieId = readCityCookie();
        if (cookieId && body.data.some((c) => c.id === cookieId)) {
          setSelectedId(cookieId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Ошибка загрузки");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(city: City) {
    setSelectedId(city.id);
    writeCityCookie(city.id);
    router.push(`/catalog?cityId=${encodeURIComponent(city.id)}`);
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Загрузка городов…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-card p-6 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Города пока недоступны
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Выберите город, чтобы посмотреть доступные бани и сауны
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cities.map((city) => {
          const isSelected = selectedId === city.id;
          return (
            <Button
              key={city.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="lg"
              className="h-auto min-h-14 flex-col py-4"
              onClick={() => handleSelect(city)}
            >
              <span className="text-base font-semibold">{city.name}</span>
              <span className="text-xs opacity-70">{city.timezone}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
