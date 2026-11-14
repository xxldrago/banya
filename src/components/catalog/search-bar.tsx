"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

type Suggest = {
  cities: { id: string; name: string; slug: string }[];
  venues: { id: string; title: string; slug: string; city?: { name: string } }[];
  districts: string[];
};

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggest | null>(null);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const timer = useRef<any>(null);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("parda_recent_searches") || "[]");
      setRecent(Array.isArray(r) ? r : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData(null);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search/suggest?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const d = await res.json();
          setData(d.data || d);
          setOpen(true);
        }
      } catch {}
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  function saveRecent(term: string) {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem("parda_recent_searches", JSON.stringify(next)); } catch {}
  }

  const hasResults = data && (data.cities.length || data.venues.length || data.districts.length);

  const showRecent = !q.trim() && recent.length > 0 && open;

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => { if (hasResults || recent.length) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Поиск по названию, адресу, району..."
      />
      {open && (hasResults || showRecent) ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
          {showRecent ? (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground">Недавние поиски</div>
              {recent.map((r) => (
                <button key={r} type="button" className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent" onClick={() => setQ(r)}>
                  {r}
                </button>
              ))}
            </div>
          ) : null}
          {hasResults && data!.cities.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground">Города</div>
              {data!.cities.map((c) => (
                <button key={c.id} type="button" className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent" onClick={() => { saveRecent(q); setOpen(false); setQ(""); router.push(`/catalog?cityId=${c.id}`); }}>
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
          {hasResults && data!.districts.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground">Районы</div>
              {data!.districts.map((d) => (
                <button key={d} type="button" className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent" onClick={() => { saveRecent(d); setOpen(false); setQ(d); }}>
                  {d}
                </button>
              ))}
            </div>
          ) : null}
          {hasResults && data!.venues.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground">Объекты</div>
              {data!.venues.map((v) => (
                <button key={v.id} type="button" className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent" onClick={() => { saveRecent(q); setOpen(false); setQ(""); router.push(`/catalog/${v.slug}`); }}>
                  {v.title} <span className="text-muted-foreground">· {v.city?.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
