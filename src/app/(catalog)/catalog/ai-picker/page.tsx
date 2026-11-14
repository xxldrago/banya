"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Venue = { id: string; slug: string; title: string; priceFrom: number; maxGuests: number; type: string; city?: { name: string } };

export default function AiPickerPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [cityId, setCityId] = useState("");
  const [guests, setGuests] = useState("4");
  const [budget, setBudget] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/cities").then((r) => (r.ok ? r.json() : { data: [] })).then((d) => {
      const c = d.data || [];
      setCities(c);
      if (c.length && !cityId) setCityId(c[0].id);
    });
  }, []);

  const pick = async () => {
    if (!cityId) return;
    setLoading(true);
    const params = new URLSearchParams({ cityId, limit: "50" });
    if (type) params.set("type", type);
    if (guests) params.set("minGuests", guests);
    if (budget) params.set("maxPrice", budget);
    const res = await fetch(`/api/v1/catalog/venues?${params.toString()}`);
    const data = res.ok ? await res.json() : { data: [] };
    const venues: Venue[] = data.data || [];
    // Rule-based scoring
    const scored = venues.map((v) => {
      let score = 0;
      if (Number(guests) <= v.maxGuests) score += 30;
      if (budget && v.priceFrom <= Number(budget)) score += 20;
      if (type && v.type === type) score += 20;
      score += Math.min(30, (v as any).rating ? (v as any).rating * 6 : 15);
      return { v, score };
    }).sort((a, b) => b.score - a.score);
    setResults(scored.map((s) => s.v));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Подбор бани</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Укажите пожелания</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={cityId} onChange={(e) => setCityId(e.target.value)}>
            {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Любой тип</option>
            <option value="bath">Баня</option>
            <option value="sauna">Сауна</option>
          </select>
          <input type="number" min="1" className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Гостей" value={guests} onChange={(e) => setGuests(e.target.value)} />
          <input type="number" min="0" className="h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Бюджет (₽/ч)" value={budget} onChange={(e) => setBudget(e.target.value)} />
          <div className="md:col-span-2">
            <Button onClick={() => void pick()} disabled={loading}>{loading ? "Подбираем..." : "Подобрать"}</Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Рекомендации</h2>
          {results.slice(0, 6).map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <Link href={`/catalog/${v.slug}`} className="font-medium hover:underline">{v.title}</Link>
                  <div className="text-sm text-muted-foreground">{v.city?.name} · до {v.maxGuests} чел. · от {v.priceFrom} ₽/ч</div>
                </div>
                <Link href={`/catalog/${v.slug}`}>
                  <Button size="sm">Подробнее</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
