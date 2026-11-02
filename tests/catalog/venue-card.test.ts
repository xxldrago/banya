import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { GET as getVenues } from "@/app/api/v1/catalog/venues/route";
import { GET as getVenueBySlug } from "@/app/api/v1/catalog/venues/[slug]/route";
import { prisma } from "@/shared/db/client";

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/v1/catalog/venues", () => {
  let moscowId: string;

  beforeAll(async () => {
    const moscow = await prisma.city.findUnique({ where: { slug: "moscow" } });
    if (!moscow) {
      throw new Error("Seed data missing: moscow city. Run npx prisma db seed");
    }
    moscowId = moscow.id;
  });

  it("returns 200 with paginated published+approved venues for cityId", async () => {
    const res = await getVenues(
      makeRequest(`/api/v1/catalog/venues?cityId=${moscowId}`),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        limit: expect.any(Number),
        offset: expect.any(Number),
      }),
    );
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    for (const venue of body.data) {
      expect(venue.status).toBe("PUBLISHED");
      expect(venue.moderationStatus).toBe("APPROVED");
      expect(venue.cityId).toBe(moscowId);
    }
  });

  it("response shape for list is { data: Venue[], meta: { total, limit, offset } }", async () => {
    const res = await getVenues(
      makeRequest(`/api/v1/catalog/venues?cityId=${moscowId}&limit=10&offset=0`),
    );
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["data", "meta"]);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.offset).toBe(0);
  });

  it("returns 400 VALIDATION_ERROR without cityId", async () => {
    const res = await getVenues(makeRequest("/api/v1/catalog/venues"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "cityId" }),
      ]),
    );
  });

  it("returns 404 for invalid cityId", async () => {
    const res = await getVenues(
      makeRequest("/api/v1/catalog/venues?cityId=nonexistent-city-id"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/v1/catalog/venues/[slug]", () => {
  it("returns 200 with full venue detail including photos, amenities, city", async () => {
    const res = await getVenueBySlug(makeRequest("/api/v1/catalog/venues/banya-u-ivana"), {
      params: Promise.resolve({ slug: "banya-u-ivana" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("data");
    expect(body).not.toHaveProperty("meta");
    expect(body.data.slug).toBe("banya-u-ivana");
    expect(body.data.title).toBeTruthy();
    expect(body.data.description).toBeTruthy();
    expect(body.data.city).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        slug: "moscow",
      }),
    );
    expect(Array.isArray(body.data.photos)).toBe(true);
    expect(body.data.photos.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(body.data.amenities)).toBe(true);
    expect(body.data.amenities.length).toBeGreaterThanOrEqual(1);
    expect(body.data.amenities[0]).toHaveProperty("amenity");
    expect(body.data.partner).toEqual(
      expect.objectContaining({ companyName: expect.any(String) }),
    );
  });

  it("response shape for single is { data: Venue }", async () => {
    const res = await getVenueBySlug(
      makeRequest("/api/v1/catalog/venues/sauna-loft-arbat"),
      { params: Promise.resolve({ slug: "sauna-loft-arbat" }) },
    );
    const body = await res.json();
    expect(Object.keys(body)).toEqual(["data"]);
  });

  it("returns 404 for nonexistent slug", async () => {
    const res = await getVenueBySlug(
      makeRequest("/api/v1/catalog/venues/does-not-exist"),
      { params: Promise.resolve({ slug: "does-not-exist" }) },
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
