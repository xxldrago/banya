// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";
import { signAccess } from "@/modules/auth/token.service";
import { ACCESS_COOKIE_NAME } from "@/modules/auth/token.service";
import { GET as listConversations } from "@/app/api/v1/chat/conversations/route";
import { GET as getConversation } from "@/app/api/v1/chat/conversations/[id]/route";
import { GET as getMessages, POST as postMessage } from "@/app/api/v1/chat/conversations/[id]/messages/route";
import { GET as adminListConversations } from "@/app/api/v1/admin/chat/conversations/route";

function withCookie(token: string) {
  return { headers: { cookie: `${ACCESS_COOKIE_NAME}=${token}` } };
}

describe("Chat conversations", () => {
  let clientToken: string;
  let partnerToken: string;
  let adminToken: string;
  let conversationId: string;
  let nonParticipantToken: string;

  beforeAll(async () => {
    // Clean up test data from other test suites
    await prisma.promoCodeUsage.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.bookingService.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatConversation.deleteMany({});
    await prisma.booking.deleteMany({});

    const client = await prisma.user.findUnique({ where: { email: "client@banya.local" } });
    const partner = await prisma.user.findUnique({ where: { email: "partner@banya.local" } });
    const admin = await prisma.user.findUnique({ where: { email: "admin@banya.local" } });

    clientToken = await signAccess(client!.id, "CLIENT");
    partnerToken = await signAccess(partner!.id, "PARTNER");
    adminToken = await signAccess(admin!.id, "ADMIN");

    // Create a non-participant user
    const np = await prisma.user.create({
      data: {
        email: `np-${Date.now()}@example.com`,
        passwordHash: "x",
        role: "CLIENT",
        status: "active",
      },
    });
    nonParticipantToken = await signAccess(np.id, "CLIENT");

    // Create a test booking first (required for conversation)
    const venue = await prisma.venue.findFirst({ where: { status: "PUBLISHED" } });
    const testBooking = await prisma.booking.create({
      data: {
        venueId: venue!.id,
        userId: client!.id,
        startsAt: new Date(Date.now() + 86400000 * 50).toISOString(),
        endsAt: new Date(Date.now() + 86400000 * 50 + 7200000).toISOString(),
        bookingMode: "instant",
        status: "CONFIRMED",
      },
    });

    // Create a test conversation with client and partner as participants
    const conv = await prisma.chatConversation.create({
      data: {
        bookingId: testBooking.id,
        participants: {
          create: [
            { userId: client!.id, role: "client" },
            { userId: partner!.id, role: "partner" },
          ],
        },
      },
      include: {
        participants: true,
      },
    });
    conversationId = conv.id;
  });

  it("lists user's conversations", async () => {
    const res = await listConversations(
      new NextRequest("http://localhost/api/v1/chat/conversations", withCookie(clientToken)),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("returns empty for user without bookings", async () => {
    const client2 = await prisma.user.create({
      data: {
        email: `empty-${Date.now()}@example.com`,
        passwordHash: "x",
        role: "CLIENT",
        status: "active",
      },
    });
    const token2 = await signAccess(client2.id, "CLIENT");
    const res = await listConversations(
      new NextRequest("http://localhost/api/v1/chat/conversations", withCookie(token2)),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
  });

  it("returns conversation detail", async () => {
    const res = await getConversation(
      new NextRequest(`http://localhost/api/v1/chat/conversations/${conversationId}`, withCookie(clientToken)),
      { params: Promise.resolve({ id: conversationId }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(conversationId);
  });

  it("denies access for non-participant", async () => {
    const res = await getConversation(
      new NextRequest(`http://localhost/api/v1/chat/conversations/${conversationId}`, withCookie(nonParticipantToken)),
      { params: Promise.resolve({ id: conversationId }) },
    );
    expect(res.status).toBe(403);
  });

  it("creates a message", async () => {
    const res = await postMessage(
      new NextRequest(`http://localhost/api/v1/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          cookie: `${ACCESS_COOKIE_NAME}=${clientToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ body: "Hello from test" }),
      }),
      { params: Promise.resolve({ id: conversationId }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.body).toBe("Hello from test");
    expect(body.data.senderId).toBeTruthy();
  });

  it("returns message history", async () => {
    const res = await getMessages(
      new NextRequest(`http://localhost/api/v1/chat/conversations/${conversationId}/messages`, withCookie(clientToken)),
      { params: Promise.resolve({ id: conversationId }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    // Verify sender info included
    expect(body.data[0].sender).toBeTruthy();
  });

  it("admin can access any conversation", async () => {
    const res = await getConversation(
      new NextRequest(`http://localhost/api/v1/chat/conversations/${conversationId}`, withCookie(adminToken)),
      { params: Promise.resolve({ id: conversationId }) },
    );
    expect(res.status).toBe(200);
  });

  it("admin lists all conversations", async () => {
    const res = await adminListConversations(
      new NextRequest("http://localhost/api/v1/admin/chat/conversations", withCookie(adminToken)),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("non-admin cannot access admin endpoint", async () => {
    const res = await adminListConversations(
      new NextRequest("http://localhost/api/v1/admin/chat/conversations", withCookie(clientToken)),
    );
    expect(res.status).toBe(403);
  });
});