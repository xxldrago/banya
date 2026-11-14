import { prisma } from "@/shared/db/client";
import { HttpError } from "@/shared/lib/errors";
import { ChatAccessDenied } from "@/shared/lib/errors";

export async function createConversationForBooking(tx: any, booking: any) {
  const venue = await tx.venue.findUnique({
    where: { id: booking.venueId },
    include: { partner: true },
  });

  if (!venue || !venue.partner) {
    throw new HttpError("VENUE_NOT_FOUND", "Venue or partner not found", 404);
  }

  const conversation = await tx.chatConversation.create({
    data: {
      bookingId: booking.id,
      participants: {
        create: [
          { userId: booking.userId, role: "client" },
          { userId: venue.partner.userId, role: "partner" },
        ],
      },
    },
    include: {
      participants: true,
    },
  });

  return conversation;
}

/**
 * Check whether a user is a participant of a conversation.
 * Admins bypass this check.
 */
export async function isParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });
  return !!participant;
}

/**
 * List conversations for a user, filtered by role.
 * - CLIENT/PARTNER: only conversations where the user is a participant
 * - ADMIN: all conversations
 */
export async function getConversationsByUser(
  userId: string,
  role: string,
) {
  if (role === "ADMIN") {
    return prisma.chatConversation.findMany({
      include: {
        booking: {
          include: {
            venue: true,
            user: true,
          },
        },
        participants: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const conversations = await prisma.chatConversation.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      booking: {
        include: {
          venue: true,
          user: true,
        },
      },
      participants: {
        include: { user: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return conversations;
}

/**
 * Get a conversation by ID with access control.
 * - ADMIN: allowed
 * - Otherwise: user must be a participant
 */
export async function getConversationById(
  conversationId: string,
  userId: string,
  role: string,
) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: {
        include: {
          venue: true,
          user: true,
        },
      },
      participants: {
        include: { user: true },
      },
    },
  });

  if (!conversation) {
    throw new HttpError("CONVERSATION_NOT_FOUND", "Conversation not found", 404);
  }

  if (role !== "ADMIN") {
    const participant = await isParticipant(conversationId, userId);
    if (!participant) {
      throw new ChatAccessDenied("Access to this chat is denied");
    }
  }

  return conversation;
}

/**
 * Get messages for a conversation with pagination.
 * Messages ordered by createdAt ASC (oldest first for chat UI).
 * Cursor is a message ID; fetch messages after that ID.
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  role: string,
  limit: number,
  cursor?: string,
) {
  // Check conversation access first
  await getConversationById(conversationId, userId, role);

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId,
      ...(cursor
        ? {
            createdAt: {
              gt: (await (async () => {
                const m = await prisma.chatMessage.findUnique({
                  where: { id: cursor },
                  select: { createdAt: true },
                });
                return m?.createdAt;
              })()),
            },
          }
        : {}),
    },
    include: {
      sender: true,
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return messages;
}

/**
 * Send a message in a conversation.
 * senderId is taken from the session, not from client input.
 */
export async function sendMessage(
  conversationId: string,
  userId: string,
  body: string,
  attachments?: { url: string; type: string; name?: string; size?: number }[],
) {
  // Antispam: max 20 messages per minute per user
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentCount = await prisma.chatMessage.count({
    where: { senderId: userId, createdAt: { gte: oneMinuteAgo } },
  });
  if (recentCount >= 20) {
    throw new HttpError("RATE_LIMITED", "Too many messages, please slow down", 429);
  }

  if ((!body || body.trim().length === 0) && (!attachments || attachments.length === 0)) {
    throw new HttpError("VALIDATION_ERROR", "Message body or attachment is required", 400);
  }
  if (body && body.length > 2000) {
    throw new HttpError(
      "VALIDATION_ERROR",
      "Message body must be at most 2000 characters",
      400,
    );
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new HttpError("CONVERSATION_NOT_FOUND", "Conversation not found", 404);
  }

  const participant = await isParticipant(conversationId, userId);
  if (!participant) {
    throw new ChatAccessDenied("Access to this chat is denied");
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: userId,
      body: body || "",
      attachments: attachments && attachments.length > 0 ? {
        create: attachments.map((a) => ({
          url: a.url,
          type: a.type,
          name: a.name ?? null,
          size: a.size ?? null,
        })),
      } : undefined,
    },
    include: {
      sender: true,
      attachments: true,
    },
  });

  return message;
}

/**
 * Mark conversation as read for a user (update lastReadAt).
 */
export async function markRead(conversationId: string, userId: string) {
  await prisma.chatParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
  return { success: true };
}

/**
 * List chat templates for a partner.
 */
export async function getChatTemplates(partnerUserId: string) {
  const partner = await prisma.partner.findFirst({ where: { userId: partnerUserId } });
  if (!partner) return [];
  return prisma.chatTemplate.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } });
}

export async function createChatTemplate(partnerUserId: string, name: string, body: string) {
  const partner = await prisma.partner.findFirst({ where: { userId: partnerUserId } });
  if (!partner) throw new HttpError("PARTNER_NOT_FOUND", "Partner not found", 404);
  return prisma.chatTemplate.create({ data: { partnerId: partner.id, name, body } });
}

export async function deleteChatTemplate(partnerUserId: string, id: string) {
  const partner = await prisma.partner.findFirst({ where: { userId: partnerUserId } });
  if (!partner) throw new HttpError("PARTNER_NOT_FOUND", "Partner not found", 404);
  const t = await prisma.chatTemplate.findUnique({ where: { id } });
  if (!t || t.partnerId !== partner.id) throw new HttpError("NOT_FOUND", "Not found", 404);
  await prisma.chatTemplate.delete({ where: { id } });
  return { success: true };
}

/**
 * Get all conversations for admin moderation, with pagination.
 */
export async function getAllConversationsForAdmin(
  limit: number,
  offset: number,
) {
  const [conversations, total] = await Promise.all([
    prisma.chatConversation.findMany({
      include: {
        booking: {
          include: {
            venue: true,
            user: true,
          },
        },
        participants: {
          include: { user: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.chatConversation.count(),
  ]);

  return { conversations, total };
}