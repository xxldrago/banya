/**
 * Notification dispatcher: renders templates, sends via the channel provider,
 * logs delivery (NotificationLog), retries once, and falls back to email
 * when the primary channel (sms/telegram) fails.
 */
import { prisma } from "@/shared/db/client";
import { sendEmail } from "./providers/email";
import { sendSms } from "./providers/sms";
import { sendTelegram } from "./providers/telegram";

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => vars[key] ?? "");
}

export interface DispatchParams {
  userId: string;
  type: string;
  channel: "email" | "sms" | "telegram";
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

interface Recipient {
  email?: string | null;
  phone?: string | null;
  telegramChatId?: string | null;
}

async function getRecipient(userId: string): Promise<Recipient> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, telegramChatId: true },
  });
  return user || {};
}

async function deliver(
  channel: string,
  recipient: Recipient,
  subject: string,
  body: string,
): Promise<{ ok: boolean; providerRef?: string; error?: string; skipped?: boolean }> {
  if (channel === "email") {
    if (!recipient.email) return { ok: false, error: "No email address", skipped: true };
    return sendEmail({ to: recipient.email, subject, text: body });
  }
  if (channel === "sms") {
    if (!recipient.phone) return { ok: false, error: "No phone number", skipped: true };
    return sendSms({ to: recipient.phone, text: `${subject}\n${body}`.slice(0, 480) });
  }
  if (channel === "telegram") {
    const chatId = recipient.telegramChatId || process.env.TELEGRAM_OWNERS_CHAT_ID;
    if (!chatId) return { ok: false, error: "No telegram chat id", skipped: true };
    return sendTelegram({ chatId, text: `<b>${subject}</b>\n${body}` });
  }
  return { ok: false, error: `Unknown channel: ${channel}` };
}

async function logDelivery(params: {
  userId: string;
  channel: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  providerRef?: string;
  error?: string;
}) {
  await prisma.notificationLog
    .create({
      data: {
        userId: params.userId,
        channel: params.channel,
        type: params.type,
        subject: params.subject,
        body: params.body,
        status: params.status,
        providerRef: params.providerRef || null,
        error: params.error || null,
      },
    })
    .catch(() => {});
}

/**
 * Send through a specific channel with 1 retry, then fall back to email.
 * Returns the final notification record.
 */
export async function dispatchNotification(params: DispatchParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      channel: params.channel,
      subject: params.subject,
      body: params.body,
      status: "pending",
      metadata: params.metadata || {},
    },
  });

  const recipient = await getRecipient(params.userId);
  let lastError = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await deliver(params.channel, recipient, params.subject, params.body);
    if (result.ok) {
      await logDelivery({
        userId: params.userId,
        channel: params.channel,
        type: params.type,
        subject: params.subject,
        body: params.body,
        status: "sent",
        providerRef: result.providerRef,
      });
      return prisma.notification.update({
        where: { id: notification.id },
        data: { status: "sent", sentAt: new Date(), attempts: attempt },
      });
    }
    lastError = result.error || "unknown";
    // Don't retry when there is simply no address configured
    if (result.skipped) break;
  }

  // Fallback to email when the primary channel failed
  if (params.channel !== "email" && recipient.email) {
    const fb = await deliver("email", recipient, params.subject, params.body);
    if (fb.ok) {
      await logDelivery({
        userId: params.userId,
        channel: "email",
        type: params.type,
        subject: params.subject,
        body: params.body,
        status: "sent",
        providerRef: fb.providerRef,
      });
      return prisma.notification.update({
        where: { id: notification.id },
        data: { status: "sent", sentAt: new Date(), attempts: 1, error: `fallback from ${params.channel}: ${lastError}` },
      });
    }
  }

  await logDelivery({
    userId: params.userId,
    channel: params.channel,
    type: params.type,
    subject: params.subject,
    body: params.body,
    status: "failed",
    error: lastError,
  });
  return prisma.notification.update({
    where: { id: notification.id },
    data: { status: "failed", attempts: 2, error: lastError },
  });
}

/**
 * Resolve an active template for type+channel, render variables, or return
 * the raw subject/body when no template exists.
 */
export async function resolveContent(
  type: string,
  channel: string,
  vars: Record<string, string>,
  fallback: { subject: string; body: string },
): Promise<{ subject: string; body: string; templated: boolean }> {
  const template = await prisma.notificationTemplate.findFirst({
    where: { code: type, channel, isActive: true },
  });
  if (!template) return { ...fallback, templated: false };
  return {
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
    templated: true,
  };
}
