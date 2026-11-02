"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Избранное</h1>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Функция избранного будет добавлена позже
        </CardContent>
      </Card>
    </div>
  );
}
