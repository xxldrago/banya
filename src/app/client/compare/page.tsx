"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { venueTypeLabels, label } from "@/shared/lib/labels";

export default function ComparePage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("parda_compare") || "[]");
      setSlugs(Array.isArray(arr) ? arr : []);
    } catch {
      setSlugs([]);
    }
  }, []);

  useEffect(() => {
    if (slugs.length === 0) { setLoading(false); return; }
    setLoading(true);
    Promise.all(slugs.map((s) => fetch(`/api/v1/catalog/venues/${s}`).then((r) => (r.ok ? r.json() : null))))
      .then((results) => setVenues(results.map((r) => r?.data).filter(Boolean)))
      .finally(() => setLoading(false));
  }, [slugs]);

  const clear = () => {
    localStorage.removeItem("parda_compare");
    setSlugs([]);
    setVenues([]);
  };

  if (loading) return <div>Загрузка...</div>;

  if (venues.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Сравнение объектов</h1>
        <Card><CardContent className="py-8 text-center text-muted-foreground">Нет объектов для сравнения. Добавьте их из карточки объекта.</CardContent></Card>
      </div>
    );
  }

  const rows = [
    { label: "Название", get: (v: any) => v.title },
    { label: "Тип", get: (v: any) => label(venueTypeLabels, v.type) },
    { label: "Город", get: (v: any) => v.city?.name },
    { label: "Адрес", get: (v: any) => v.address },
    { label: "Цена от", get: (v: any) => `${v.priceFrom} ₽/ч` },
    { label: "Вместимость", get: (v: any) => `до ${v.maxGuests} чел.` },
    { label: "Мин. длительность", get: (v: any) => `${v.minDuration} мин.` },
    { label: "Рейтинг", get: (v: any) => (v.rating ? v.rating.toFixed(1) : "—") },
    { label: "Отзывов", get: (v: any) => v.reviewsCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Сравнение объектов</h1>
        <Button variant="outline" size="sm" onClick={clear}>Очистить</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-2 text-left">Параметр</th>
              {venues.map((v) => (
                <th key={v.id} className="border p-2 text-left">
                  <Link href={`/catalog/${v.slug}`} className="hover:underline">{v.title}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border p-2 font-medium">{row.label}</td>
                {venues.map((v) => (
                  <td key={v.id} className="border p-2">{row.get(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
