"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bookingStatusLabels, icalStatusLabels, label } from "@/shared/lib/labels";

export default function PartnerCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>(Array.from({length:7},(_,i)=>({dayOfWeek:i,openTime:"09:00",closeTime:"22:00",isClosed:false})));
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [excForm, setExcForm] = useState({ date: "", isClosed: true, openTime: "09:00", closeTime: "22:00", reason: "" });
  const [excMsg, setExcMsg] = useState<string | null>(null);
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

  const loadSchedule = (venueId: string) => {
    if (!venueId) return;
    fetch(`/api/v1/partner/schedules?venueId=${venueId}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { data: { schedules: [] } }))
      .then((data) => {
        const scheds = data.data?.schedules || [];
        if (Array.isArray(scheds) && scheds.length) {
          const merged = Array.from({length:7},(_,i)=>{
            const found = scheds.find((s:any)=>s.dayOfWeek===i);
            return found ? {dayOfWeek:i, openTime:found.openTime, closeTime:found.closeTime, isClosed:found.isClosed} : {dayOfWeek:i, openTime:"09:00", closeTime:"22:00", isClosed:false};
          });
          setSchedule(merged);
        }
        setExceptions(data.data?.exceptions || []);
      });
  };

  const saveSchedule = async () => {
    if (!selectedVenue) return;
    const res = await fetch("/api/v1/partner/schedules", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: selectedVenue, schedules: schedule }),
    });
    setScheduleMsg(res.ok ? "Расписание сохранено" : "Ошибка сохранения");
  };

  const addException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue || !excForm.date) return;
    const res = await fetch("/api/v1/partner/schedules", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: selectedVenue, date: excForm.date, isClosed: excForm.isClosed, openTime: excForm.isClosed ? null : excForm.openTime, closeTime: excForm.isClosed ? null : excForm.closeTime, reason: excForm.reason || null }),
    });
    setExcMsg(res.ok ? "Исключение добавлено" : "Ошибка");
    if (res.ok) { setExcForm({ date: "", isClosed: true, openTime: "09:00", closeTime: "22:00", reason: "" }); loadSchedule(selectedVenue); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadBookings(), loadVenues()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadJobs(selectedVenue); loadSchedule(selectedVenue); }, [selectedVenue]);

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
                  {j.sourceUrl} — {label(icalStatusLabels, j.status)} ({new Date(j.createdAt).toLocaleString("ru-RU")})
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Расписание работы</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {["Вс","Пн","Вт","Ср","Чт","Пт","Сб"].map((label, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-8 font-medium">{label}</span>
                <input type="checkbox" checked={!schedule[i].isClosed} onChange={(e) => {
                  const next = [...schedule]; next[i] = { ...next[i], isClosed: !e.target.checked }; setSchedule(next);
                }} />
                <input type="time" className="rounded border px-2 py-1" value={schedule[i].openTime} disabled={schedule[i].isClosed} onChange={(e) => { const next=[...schedule]; next[i]={...next[i],openTime:e.target.value}; setSchedule(next); }} />
                <span>—</span>
                <input type="time" className="rounded border px-2 py-1" value={schedule[i].closeTime} disabled={schedule[i].isClosed} onChange={(e) => { const next=[...schedule]; next[i]={...next[i],closeTime:e.target.value}; setSchedule(next); }} />
                {schedule[i].isClosed && <span className="text-muted-foreground">выходной</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={saveSchedule} disabled={!selectedVenue}>Сохранить расписание</Button>
            {scheduleMsg && <span className="text-sm text-muted-foreground">{scheduleMsg}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Исключения (выходные/спец. даты)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={addException} className="grid gap-2 md:grid-cols-4">
            <input type="date" className="h-9 rounded border px-2 py-1 text-sm" value={excForm.date} onChange={(e) => setExcForm({ ...excForm, date: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={excForm.isClosed} onChange={(e) => setExcForm({ ...excForm, isClosed: e.target.checked })} />
              Закрыто
            </label>
            <input type="text" className="h-9 rounded border px-2 py-1 text-sm" placeholder="Причина" value={excForm.reason} onChange={(e) => setExcForm({ ...excForm, reason: e.target.value })} />
            <Button size="sm" type="submit" disabled={!selectedVenue}>Добавить</Button>
          </form>
          {excMsg && <div className="text-sm text-muted-foreground">{excMsg}</div>}
          {exceptions.length > 0 && (
            <div className="space-y-1">
              {exceptions.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between border-b py-1 text-sm">
                  <span>{new Date(e.date).toLocaleDateString("ru-RU")}</span>
                  <span>{e.isClosed ? "Закрыто" : `${e.openTime}–${e.closeTime}`}</span>
                  <span className="text-muted-foreground">{e.reason || ""}</span>
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
                    <span className="text-muted-foreground">{label(bookingStatusLabels, b.status)}</span>
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
