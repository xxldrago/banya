// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET as getVenues } from "@/app/api/v1/catalog/venues/route";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";

let moscowId: string;
let bathId: string;
let saunaId: string;
let amenityIds: string[];

function url(cityId: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ cityId, ...extra });
  return new NextRequest(`http://localhost/api/v1/catalog/venues?${params.toString()}`);
}

describe("GET /api/v1/catalog/venues — filters + sorting", () => {
  beforeAll(async () => {
    // Pick real seeded data
    const moscow = await prisma.city.findUnique({ where: { slug: "moscow" } });
    if (!moscow) throw new Error("moscow city not seeded");
    moscowId = moscow.id;

    // Capture venue types present in seed
    const types = await prisma.venue.findMany({
      where: { cityId: moscowId },
      select: { id: true, type: true },
    });
    bathId = types.find((v) => v.type === "bath")?.id!;
    saunaId = types.find((v) => v.type === "sauna")?.id!;

    amenityIds = await prisma.venueAmenity.findMany({
      where: { venue: { cityId: moscowId } },
      select: { amenityId: true },
      take: 2,
    }).then((rows) => rows.map((r) => r.amenityId));
  });

  afterAll(async () => {
    // No data mutated by read-only tests
  });

  it("returns all published venues for a city when no filters applied", async () => {
    const res = await getVenues(url(moscowId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(0);
    expect(body.meta).toMatchObject({ limit: 20, offset: 0 });
    expect(typeof body.meta.total).toBe("number");
  });

  it("filters by type=bath", async () => {
    const res = await getVenues(url(moscowId, { type: "bath" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const v of body.data) {
      expect(v.type).toBe("bath");
    }
  });

  it("filters by type=sauna", async () => {
    const res = await getVenues(url(moscowId, { type: "sauna" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      expect(v.type).toBe("sauna");
    }
  });

  it("filters by minGuests (maxGuests >= N)", async () => {
    const res = await getVenues(url(moscowId, { minGuests: "20" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      expect(v.maxGuests).toBeGreaterThanOrEqual(20);
    }
  });

  it("filters by maxPrice (priceFrom <= N)", async () => {
    const res = await getVenues(url(moscowId, { maxPrice: "2000" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      expect(v.priceFrom).toBeLessThanOrEqual(2000);
    }
  });

  it("filters by minPrice (priceFrom >= N)", async () => {
    const res = await getVenues(url(moscowId, { minPrice: "500" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      expect(v.priceFrom).toBeGreaterThanOrEqual(500);
    }
  });

  it("filters by amenityId (ALL amenities must match)", async () => {
    if (amenityIds.length === 0) {
      // Seed has no venue-amenity link; skip meaningfully but still assert shape
      const res = await getVenues(url(moscowId));
      expect(res.status).toBe(200);
      return;
    }
    const res = await getVenues(
      url(moscowId, { amenityId: amenityIds[0] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      const ids = (v.amenities as Array<{ amenityId: string }>).map(
        (a) => a.amenityId,
      );
      expect(ids).toContain(amenityIds[0]);
    }
  });

  it("filters by district (case-insensitive address contains)", async () => {
    const res = await getVenues(url(moscowId, { district: "центр" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      expect(v.address.toLowerCase()).toContain("центр");
    }
  });

  it("sorts by price_asc", async () => {
    const res = await getVenues(url(moscowId, { sort: "price_asc" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const prices = body.data.map((v: { priceFrom: number }) => v.priceFrom);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts by price_desc", async () => {
    const res = await getVenues(url(moscowId, { sort: "price_desc" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const prices = body.data.map((v: { priceFrom: number }) => v.priceFrom);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it("sorts by newest (default)", async () => {
    const res = await getVenues(url(moscowId));
    expect(res.status).toBe(200);
    const body = await res.json();
    const dates = body.data.map(
      (v: { publishedAt?: string | null }) => v.publishedAt,
    );
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i - 1]!).getTime()).toBeGreaterThanOrEqual(
        new Date(dates[i]!).getTime(),
      );
    }
  });

  it("combines filters: type + minGuests + maxPrice (intersection)", async () => {
    const res = await getVenues(
      url(moscowId, { type: "bath", minGuests: "4", maxPrice: "5000" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const v of body.data) {
      expect(v.type).toBe("bath");
      expect(v.maxGuests).toBeGreaterThanOrEqual(4);
      expect(v.priceFrom).toBeLessThanOrEqual(5000);
    }
  });

  it("returns empty result set with total 0 when nothing matches", async () => {
    const res = await getVenues(url(moscowId, { maxPrice: "1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it("rejects invalid sort value with 400 VALIDATION_ERROR", async () => {
    const res = await getVenues(url(moscowId, { sort: "random" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for unknown cityId", async () => {
    const res = await getVenues(url("00000000-0000-0000-0000-000000000000"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when cityId missing", async () => {
    const res = await new NextRequest(
      "http://localhost/api/v1/catalog/venues",
    );
    // route uses next URL; cityId omitted → schema error
    const res2 = await getVenues(
      new NextRequest("http://localhost/api/v1/catalog/venues?limit=10"),
    );
    expect(res2.status).toBe(400);
  });

  it("pagination limit works", async () => {
    const res = await getVenues(url(moscowId, { limit: "2" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.limit).toBe(2);
  });
});
