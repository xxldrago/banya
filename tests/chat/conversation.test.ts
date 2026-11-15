// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/shared/db/client";
import { signAccess } from "@/modules/auth/token.service";
import { ACCESS_COOKIE_NAME } from "@/modules/auth/token.service";
import { GET as listConversations } from "@/app/api/v1/chat/conversations/route";
import { GET as getConversation } from "@/app/api/v1/chat/conversations/[id]/route";
import { GET as getMessages, POST as postMessage } from "@/app/api/v1/chat/conversations/[id]/messages/route";
import { GET as adminListConversations } from "@/app/api/v1/admin/chat/conversations/route";

// Все данные этого сюита маркируются префиксом email — демо-данные не затрагиваются.
const TEST_PREFIX = "chat-test-";

function withCookie(token: string) {
  return { headers: { cookie: `${ACCESS_COOKIE_NAME}=${token}` } };
}

describe("Chat conversations", () => {
  let clientToken: string;
  let partnerToken: string;
  let adminToken: string;
  let conversationId: string;
  let nonParticipantToken: string;

  /** Удаляет только данные этого сюита (пользователи с префиксом chat-test-). */
  async function cleanupOwnData() {
    const users = await prisma.user.findMany({ where: { email: { startsWith: TEST_PREFIX } }, select: { id: true } });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const bookings = await prisma.booking.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const bookingIds = bookings.map((b) => b.id);
    const convs = await prisma.chatConversation.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } });
    const convIds = convs.map((c) => c.id);
    if (convIds.length > 0) {
      await prisma.chatMessage.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.chatParticipant.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.chatConversation.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingService.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.refund.deleteMany({ where: { payment: { bookingId: { in: bookingIds } } } });
    await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    // Чистим только остатки предыдущих запусков этого сюита — глобальные таблицы не трогаем.
    await cleanupOwnData();

    const stamp = Date.now();
    const testClient = await prisma.user.create({
      data: { email: `${TEST_PREFIX}client-${stamp}@example.com`, passwordHash: "x", role: "CLIENT", status: "active" },
    });
    const testPartner = await prisma.user.create({
      data: { email: `${TEST_PREFIX}partner-${stamp}@example.com`, passwordHash: "x", role: "PARTNER", status: "active" },
    });

    clientToken = await signAccess(testClient.id, "CLIENT");
    partnerToken = await signAccess(testPartner.id, "PARTNER");

    const admin = await prisma.user.findUnique({ where: { email: "admin@banya.local" } });
    adminToken = await signAccess(admin!.id, "ADMIN");

    // Create a non-participant user
    const np = await prisma.user.create({
      data: {
        email: `${TEST_PREFIX}np-${stamp}@example.com`,
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
        userId: testClient.id,
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
            { userId: testClient.id, role: "client" },
            { userId: testPartner.id, role: "partner" },
          ],
        },
      },
      include: {
        participants: true,
      },
    });
    conversationId = conv.id;
  });

  afterAll(async () => {
    await cleanupOwnData();
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
        email: `${TEST_PREFIX}empty-${Date.now()}@example.com`,
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