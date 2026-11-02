// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { GET as getVenues } from "@/app/api/v1/catalog/venues/route";
import { GET as getMap } from "@/app/api/v1/catalog/venues/map/route";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";

let moscowId: string;
let unknownCityId = "00000000-0000-0000-0000-000000000000";

function url(path: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ ...extra });
  return new NextRequest(`http://localhost${path}?${params.toString()}`);
}

describe("GET /api/v1/catalog/venues/map — coordinates endpoint", () => {
  beforeAll(async () => {
    const moscow = await prisma.city.findUnique({ where: { slug: "moscow" } });
    if (!moscow) throw new Error("moscow city not seeded");
    moscowId = moscow.id;
  });

  it("returns venue coordinates for a city", async () => {
    const res = await getMap(url("/api/v1/catalog/venues/map", { cityId: moscowId }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    for (const c of body.data) {
      expect(c).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        slug: expect.any(String),
        lat: expect.any(Number),
        lng: expect.any(Number),
        priceFrom: expect.any(Number),
        type: expect.any(String),
      });
    }
  });

  it("excludes venues without lat/lng", async () => {
    const res = await getMap(url("/api/v1/catalog/venues/map", { cityId: moscowId }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const withCoords = await prisma.venue.count({
      where: { cityId: moscowId, status: "PUBLISHED", moderationStatus: "APPROVED", lat: { not: null }, lng: { not: null } },
    });
    expect(body.data.length).toBe(withCoords);
  });

  it("only returns PUBLISHED + APPROVED venues", async () => {
    const res = await getMap(url("/api/v1/catalog/venues/map", { cityId: moscowId }));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const c of body.data) {
      const v = await prisma.venue.findUnique({ where: { id: c.id } });
      expect(v!.status).toBe("PUBLISHED");
      expect(v!.moderationStatus).toBe("APPROVED");
    }
  });

  it("returns 400 when cityId missing", async () => {
    const res = await getMap(new NextRequest("http://localhost/api/v1/catalog/venues/map"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for unknown cityId", async () => {
    const res = await getMap(url("/api/v1/catalog/venues/map", { cityId: unknownCityId }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("catalog sorting via venues route (sort-map)", () => {
  beforeAll(async () => {
    const moscow = await prisma.city.findUnique({ where: { slug: "moscow" } });
    if (!moscow) throw new Error("moscow city not seeded");
    moscowId = moscow.id;
  });

  it("price_asc yields ascending prices", async () => {
    const res = await getVenues(url("/api/v1/catalog/venues", { cityId: moscowId, sort: "price_asc" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const prices = body.data.map((v: { priceFrom: number }) => v.priceFrom);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("price_desc yields descending prices", async () => {
    const res = await getVenues(url("/api/v1/catalog/venues", { cityId: moscowId, sort: "price_desc" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const prices = body.data.map((v: { priceFrom: number }) => v.priceFrom);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("newest default yields descending publishedAt", async () => {
    const res = await getVenues(url("/api/v1/catalog/venues", { cityId: moscowId }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const dates = body.data.map((v: { publishedAt?: string | null }) => v.publishedAt);
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i - 1]!).getTime()).toBeGreaterThanOrEqual(new Date(dates[i]!).getTime());
    }
  });
});
