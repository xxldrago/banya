"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RefsData = {
  cities: any[];
  amenities: any[];
  districts: any[];
  objectTypes: any[];
};

const EMPTY: RefsData = { cities: [], amenities: [], districts: [], objectTypes: [] };

export default function AdminRefsPage() {
  const [data, setData] = useState<RefsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [cityName, setCityName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [districtCityId, setDistrictCityId] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [objectTypeName, setObjectTypeName] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/refs", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: EMPTY }))
      .then((d) => {
        const next = { ...EMPTY, ...(d.data || {}) };
        setData(next);
        if (!districtCityId && next.cities.length > 0) setDistrictCityId(next.cities[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (type: string, payload: Record<string, any>) => {
    setMsg("");
    const res = await fetch("/api/v1/admin/refs", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
    if (res.ok) {
      setMsg("Запись добавлена");
      load();
      return true;
    }
    const err = await res.json().catch(() => ({}));
    setMsg(err.error?.message || "Ошибка добавления");
    return false;
  };

  const remove = async (type: string, id: string) => {
    setMsg("");
    const res = await fetch(`/api/v1/admin/refs?type=${type}&id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setMsg("Запись удалена");
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error?.message || "Не удалось удалить запись");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Справочники</h1>
      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Города ({data.cities.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await create("city", { name: cityName })) setCityName("");
              }}
            >
              <Input placeholder="Название города" value={cityName} onChange={(e) => setCityName(e.target.value)} required />
              <Button type="submit">Добавить</Button>
            </form>
            <div className="space-y-1">
              {data.cities.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b pb-1 text-sm">
                  <span>{c.name} <span className="text-muted-foreground">({c.slug})</span></span>
                  <Button variant="outline" size="sm" onClick={() => remove("city", c.id)}>Удалить</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Районы ({data.districts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form
              className="flex flex-wrap gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await create("district", { name: districtName, cityId: districtCityId })) setDistrictName("");
              }}
            >
              <Input placeholder="Название района" value={districtName} onChange={(e) => setDistrictName(e.target.value)} required className="w-44" />
              <select
                className="rounded border px-2 py-2 text-sm"
                value={districtCityId}
                onChange={(e) => setDistrictCityId(e.target.value)}
                required
              >
                {data.cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button type="submit">Добавить</Button>
            </form>
            <div className="space-y-1">
              {data.districts.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b pb-1 text-sm">
                  <span>{d.name} <span className="text-muted-foreground">· {d.city?.name}</span></span>
                  <Button variant="outline" size="sm" onClick={() => remove("district", d.id)}>Удалить</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Удобства ({data.amenities.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await create("amenity", { name: amenityName })) setAmenityName("");
              }}
            >
              <Input placeholder="Название удобства" value={amenityName} onChange={(e) => setAmenityName(e.target.value)} required />
              <Button type="submit">Добавить</Button>
            </form>
            <div className="space-y-1">
              {data.amenities.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b pb-1 text-sm">
                  <span>{a.name} <span className="text-muted-foreground">({a.slug})</span></span>
                  <Button variant="outline" size="sm" onClick={() => remove("amenity", a.id)}>Удалить</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Типы объектов ({data.objectTypes.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await create("objectType", { name: objectTypeName })) setObjectTypeName("");
              }}
            >
              <Input placeholder="Название типа (баня, сауна...)" value={objectTypeName} onChange={(e) => setObjectTypeName(e.target.value)} required />
              <Button type="submit">Добавить</Button>
            </form>
            <div className="space-y-1">
              {data.objectTypes.map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b pb-1 text-sm">
                  <span>{o.name} <span className="text-muted-foreground">({o.slug})</span></span>
                  <Button variant="outline" size="sm" onClick={() => remove("objectType", o.id)}>Удалить</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
