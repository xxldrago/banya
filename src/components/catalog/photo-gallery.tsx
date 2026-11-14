"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Photo = { id: string; url: string; isCover?: boolean; category?: string | null };

export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center text-muted-foreground">
        Фотографии пока не добавлены
      </div>
    );
  }

  const categories = Array.from(new Set(photos.map((p) => p.category || "Общее")));

  return (
    <>
      <div className="space-y-4">
        {categories.map((cat) => {
          const catPhotos = photos.filter((p) => (p.category || "Общее") === cat);
          return (
            <div key={cat} className="space-y-2">
              {categories.length > 1 ? <h3 className="text-sm font-medium text-muted-foreground">{cat}</h3> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setOpen(photo.url)}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={title} className="h-full w-full object-cover" />
                    {photo.isCover ? (
                      <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium">
                        Обложка
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setOpen(null)}
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt={title} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
