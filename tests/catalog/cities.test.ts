import { describe, it, expect, beforeAll } from "vitest";
import { GET as getCities } from "@/app/api/v1/cities/route";
import { prisma } from "@/shared/db/client";

describe("GET /api/v1/cities", () => {
  beforeAll(async () => {
    // Ensure at least one inactive city exists for the filter assertion
    await prisma.city.upsert({
      where: { slug: "inactive-test-city" },
      update: { isActive: false, name: "Inactive Test" },
      create: {
        name: "Inactive Test",
        slug: "inactive-test-city",
        isActive: false,
        timezone: "Europe/Moscow",
      },
    });
  });

  it("returns 200 with array of active cities (id, name, slug, timezone)", async () => {
    const res = await getCities();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);

    for (const city of body.data) {
      expect(city).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          timezone: expect.any(String),
        }),
      );
    }

    const slugs = body.data.map((c: { slug: string }) => c.slug);
    expect(slugs).toEqual(expect.arrayContaining(["moscow", "spb", "sochi"]));
  });

  it("does not return cities where isActive=false", async () => {
    const res = await getCities();
    const body = await res.json();
    const slugs = body.data.map((c: { slug: string }) => c.slug);
    expect(slugs).not.toContain("inactive-test-city");
    expect(slugs).not.toContain("kazan");
  });
});
