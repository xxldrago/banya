// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { POST as createBooking } from "@/app/api/v1/bookings/route";
import { GET as getAvailability } from "@/app/api/v1/venues/[slug]/availability/route";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";
import { signAccess } from "@/modules/auth/token.service";

let clientToken: string;
let clientUserId: string;
let venueSlug: string;
let venueId: string;

function req(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

describe("Booking API", () => {
  beforeAll(async () => {
    const user = await prisma.user.findFirst({ where: { email: { contains: "client" } } });
    if (!user) throw new Error("No client user found");
    clientUserId = user.id;
    clientToken = await signAccess(user.id, user.role);

    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    if (!venue) throw new Error("No venue found");
    venueSlug = venue.slug;
    venueId = venue.id;

    // Clean test data
    await prisma.booking.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatConversation.deleteMany({});
  });

  it("GET /api/v1/venues/[slug]/availability returns 30-min slots", async () => {
    const date = new Date().toISOString().split("T")[0];
    const res = await getAvailability(req(`http://localhost/api/v1/venues/${venueSlug}/availability?date=${date}`), { params: Promise.resolve({ slug: venueSlug }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(48); // 24h * 2
    expect(body.data[0]).toHaveProperty("start");
    expect(body.data[0]).toHaveProperty("end");
    expect(body.data[0]).toHaveProperty("available");
  });

  it("POST /api/v1/bookings requires authentication", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(10, 0, 0, 0);
    const endsAt = new Date(date.getTime() + 3600000);
    const res = await createBooking(req("http://localhost/api/v1/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId, startsAt: date.toISOString(), endsAt: endsAt.toISOString(), bookingMode: "instant" }),
    }));
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/bookings creates booking for authenticated client (instant)", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    date.setHours(10, 0, 0, 0);
    const endsAt = new Date(date.getTime() + 7200000);
    const res = await createBooking(req("http://localhost/api/v1/bookings", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `access_token=${clientToken}` },
      body: JSON.stringify({ venueId, startsAt: date.toISOString(), endsAt: endsAt.toISOString(), bookingMode: "instant" }),
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe("CONFIRMED");
  });

  it("confirm mode creates PENDING booking", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 40);
    date.setHours(14, 0, 0, 0);
    const endsAt = new Date(date.getTime() + 7200000);
    const res = await createBooking(req("http://localhost/api/v1/bookings", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `access_token=${clientToken}` },
      body: JSON.stringify({ venueId, startsAt: date.toISOString(), endsAt: endsAt.toISOString(), bookingMode: "confirm" }),
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.status).toBe("PENDING");
  });
});
