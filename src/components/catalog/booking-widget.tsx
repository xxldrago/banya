"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Slot = {
  start: string;
  end: string;
  available: boolean;
};

type BookingWidgetProps = {
  venueId: string;
  slug: string;
  priceFrom: number;
  minDuration: number;
  maxGuests: number;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function slotLabel(iso: string): string {
  // Availability slots are generated in UTC by the API — display them as-is.
  return iso.slice(11, 16);
}

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12];

export function BookingWidget({
  venueId,
  slug,
  priceFrom,
  minDuration,
  maxGuests,
}: BookingWidgetProps) {
  const minHours = Math.max(1, Math.ceil(minDuration / 60));
  const [date, setDate] = useState(todayISO);
  const [hours, setHours] = useState(minHours);
  const [guests, setGuests] = useState(Math.min(4, Math.max(1, maxGuests)));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/venues/${encodeURIComponent(slug)}/availability?date=${date}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Не удалось загрузить доступность");
      }
      const body = (await res.json()) as { data: Slot[] };
      setSlots(body.data ?? []);
      setSelectedStart(null);
    } catch (err) {
      setSlots([]);
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoadingSlots(false);
    }
  }, [date, slug]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const visibleSlots = useMemo(
    () =>
      slots.filter((s) => {
        const hour = Number(s.start.slice(11, 13));
        return hour >= 8 && hour <= 23;
      }),
    [slots],
  );

  const total = priceFrom * hours;

  async function submit() {
    if (!selectedStart) {
      setError("Выберите время начала");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const endsAt = new Date(
        new Date(selectedStart).getTime() + hours * 60 * 60 * 1000,
      ).toISOString();
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          startsAt: selectedStart,
          endsAt,
          bookingMode: "instant",
          allowBackToBack: false,
        }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(`/catalog/${slug}`)}`;
        return;
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          body?.error?.message ?? "Не удалось создать бронирование",
        );
      }
      setSuccessId(body?.data?.id ?? "created");
      setSelectedStart(null);
      void loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка бронирования");
    } finally {
      setSubmitting(false);
    }
  }

  if (successId) {
    return (
      <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-semibold text-green-900">Бронирование создано</p>
        <p className="text-green-800">
          Номер брони: <span className="font-mono">{successId.slice(0, 12)}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/client/bookings"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Мои бронирования
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSuccessId(null);
              void loadSlots();
            }}
          >
            Забронировать ещё
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Дата</span>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Гостей
          </span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Длительность
        </span>
        <select
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          {HOUR_OPTIONS.filter((h) => h >= minHours).map((h) => (
            <option key={h} value={h}>
              {h} ч
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">
          Свободное время
        </span>
        {loadingSlots ? (
          <p className="text-xs text-muted-foreground">Загрузка окон…</p>
        ) : visibleSlots.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            На эту дату окон нет — выберите другой день
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {visibleSlots.map((slot) => {
              const active = selectedStart === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedStart(slot.start)}
                  className={[
                    "rounded-md border px-1 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : slot.available
                        ? "border-input bg-background hover:bg-accent"
                        : "cursor-not-allowed border-dashed text-muted-foreground/40 line-through",
                  ].join(" ")}
                >
                  {slotLabel(slot.start)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between border-t pt-3">
        <span className="text-muted-foreground">
          {hours} ч · {guests} чел.
        </span>
        <span className="text-lg font-bold">
          {total.toLocaleString("ru-RU")} ₽
        </span>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <Button
        className="w-full"
        onClick={submit}
        disabled={submitting || loadingSlots}
      >
        {submitting ? "Бронируем…" : "Забронировать"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Мгновенное подтверждение. Оплата на объекте.
      </p>
    </div>
  );
}
