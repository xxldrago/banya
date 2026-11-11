"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PartnerCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = () => {
    fetch("/api/v1/bookings?limit=100", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setBookings(data.data || []));
  };

  const loadVenues = () => {
    fetch("/api/v1/partner/venues", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => {
        setVenues(data.data || []);
        if (data.data?.length && !selectedVenue) setSelectedVenue(data.data[0].id);
      });
  };

  const loadJobs = (venueId: string) => {
    if (!venueId) return;
    fetch(`/api/v1/ical?venueId=${venueId}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setJobs(data.data || []));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadBookings(), loadVenues()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadJobs(selectedVenue); }, [selectedVenue]);

  const sync = async () => {
    if (!selectedVenue || !sourceUrl) return;
    const res = await fetch("/api/v1/ical", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: selectedVenue, sourceUrl }),
    });
    if (res.ok) {
      setSourceUrl("");
      loadJobs(selectedVenue);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Ошибка");
    }
  };

  if (loading) return <div>Загрузка...</div>;

  const byDay: Record<string, any[]> = {};
  bookings.forEach((b) => {
    const day = new Date(b.startsAt).toLocaleDateString("ru-RU");
    (byDay[day] ||= []).push(b);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Календарь</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">iCal синхронизация</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <select className="w-full rounded border px-2 py-1" value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}>
            <option value="">Выберите объект</option>
            {venues.map((v: any) => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input className="flex-1 rounded border px-2 py-1" placeholder="URL iCal-календаря" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            <Button onClick={sync} disabled={!selectedVenue || !sourceUrl}>Синхронизировать</Button>
          </div>
          {jobs.length > 0 && (
            <div className="space-y-1">
              {jobs.map((j: any) => (
                <div key={j.id} className="text-sm text-muted-foreground">
                  {j.sourceUrl} — {j.status} ({new Date(j.createdAt).toLocaleString("ru-RU")})
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(byDay).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Бронирований нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDay).map(([day, bs]) => (
            <Card key={day}>
              <CardHeader><CardTitle className="text-base">{day}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {bs.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b py-2 text-sm">
                    <span>{new Date(b.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} — {new Date(b.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{b.venue?.title} · {b.user?.email}</span>
                    <span className="text-muted-foreground">{b.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
