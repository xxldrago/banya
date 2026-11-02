"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type VenueCoordinate = {
  id: string;
  title: string;
  slug: string;
  lat: number;
  lng: number;
  priceFrom: number;
  type: string;
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ venues }: { venues: VenueCoordinate[] }) {
  const map = useMap();
  useEffect(() => {
    if (venues.length === 0) return;
    const bounds = L.latLngBounds(venues.map((v) => [v.lat, v.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }, [venues, map]);
  return null;
}

export function VenueMapInner({ venues }: { venues: VenueCoordinate[] }) {
  return (
    <MapContainer
      center={[55.75, 37.62]}
      zoom={10}
      style={{ height: "400px", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds venues={venues} />
      {venues.map((v) => (
        <Marker key={v.id} position={[v.lat, v.lng]} icon={defaultIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-medium">{v.title}</p>
              <p className="text-sm text-muted-foreground">
                {v.type === "bath" ? "Баня" : "Сауна"} • от {v.priceFrom} ₽
              </p>
              <a
                href={`/catalog/${v.slug}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Подробнее →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
