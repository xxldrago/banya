"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CompareToggle({ slug }: { slug: string }) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("parda_compare") || "[]");
      setInCompare(Array.isArray(arr) && arr.includes(slug));
    } catch {}
  }, [slug]);

  const toggle = () => {
    try {
      const key = "parda_compare";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      if (arr.includes(slug)) {
        localStorage.setItem(key, JSON.stringify(arr.filter((s: string) => s !== slug)));
        setInCompare(false);
      } else {
        if (arr.length >= 4) { alert("Максимум 4 объекта"); return; }
        arr.push(slug);
        localStorage.setItem(key, JSON.stringify(arr));
        setInCompare(true);
      }
    } catch {}
  };

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" onClick={toggle}>
        {inCompare ? "Убрать из сравнения" : "Добавить к сравнению"}
      </Button>
      <div>
        <Link href="/client/compare" className="text-xs text-muted-foreground underline">
          Открыть сравнение
        </Link>
      </div>
    </div>
  );
}
