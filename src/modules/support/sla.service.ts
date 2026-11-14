/**
 * SLA management for support tickets:
 * - auto-assignment of a new ticket to the least-loaded support admin
 * - SLA breach alerts (email + Telegram) sent once per ticket (slaAlertedAt)
 */
import { prisma } from "@/shared/db/client";
import { sendNotification } from "@/modules/notifications/notification.service";

/** Admin roles eligible for ticket assignment. */
const SUPPORT_ROLES = ["support", "superadmin"];

/** SLA hours by priority (kept in sync with POST /api/v1/support). */
export const SLA_HOURS: Record<string, number> = { urgent: 4, high: 24, medium: 48, low: 72 };

export function slaDueDate(priority?: string | null): Date {
  const hours = SLA_HOURS[priority || "medium"] || 48;
  return new Date(Date.now() + hours * 3600000);
}

/**
 * Assign a ticket to the support admin with the fewest open tickets.
 * Falls back to any superadmin when no dedicated support staff exists.
 * Best-effort: returns the assignee id or null; never throws.
 */
export async function autoAssignTicket(ticketId: string): Promise<string | null> {
  try {
    const candidates = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        status: "active",
        OR: [{ adminRole: null }, { adminRole: { in: SUPPORT_ROLES } }],
      },
      select: {
        id: true,
        adminRole: true,
        _count: {
          select: {
            assignedTickets: { where: { status: { in: ["open", "in_progress"] } } },
          },
        },
      },
    });
    if (candidates.length === 0) return null;

    // Prefer dedicated support staff, then fewest open tickets.
    candidates.sort((a, b) => {
      const aSupport = a.adminRole === "support" ? 0 : 1;
      const bSupport = b.adminRole === "support" ? 0 : 1;
      if (aSupport !== bSupport) return aSupport - bSupport;
      return a._count.assignedTickets - b._count.assignedTickets;
    });

    const assignee = candidates[0];
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTo: assignee.id },
    });
    return assignee.id;
  } catch (e) {
    console.error("autoAssignTicket failed", e);
    return null;
  }
}

/**
 * Find overdue tickets that have not been alerted yet and notify
 * the assignee (or all support admins when unassigned) via email + Telegram.
 * Marks each ticket with slaAlertedAt so alerts fire once per breach.
 */
export async function checkSlaAlerts(): Promise<{ alerted: number }> {
  const now = new Date();
  const overdue = await prisma.supportTicket.findMany({
    where: {
      slaDueAt: { lt: now },
      slaAlertedAt: null,
      status: { notIn: ["resolved", "closed"] },
    },
    include: { assigned: { select: { id: true, email: true } }, user: { select: { email: true } } },
    take: 50,
    orderBy: { slaDueAt: "asc" },
  });

  let alerted = 0;
  for (const ticket of overdue) {
    const subject = `SLA просрочен: тикет #${ticket.id.slice(-8)} (${ticket.priority})`;
    const body = `Тикет «${ticket.subject}» просрочен по SLA (${ticket.slaDueAt?.toLocaleString("ru-RU")}).\nПриоритет: ${ticket.priority}\nСтатус: ${ticket.status}`;

    let recipients: string[] = [];
    if (ticket.assignedTo) {
      recipients = [ticket.assignedTo];
    } else {
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          status: "active",
          OR: [{ adminRole: null }, { adminRole: { in: SUPPORT_ROLES } }],
        },
        select: { id: true },
        take: 5,
      });
      recipients = admins.map((a) => a.id);
    }

    for (const userId of recipients) {
      try {
        await sendNotification(userId, "sla_breach", "email", subject, body, {
          ticketId: ticket.id,
        });
        await sendNotification(userId, "sla_breach", "telegram", subject, body, {
          ticketId: ticket.id,
        });
      } catch (e) {
        console.error("SLA alert send failed", e);
      }
    }

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { slaAlertedAt: new Date() },
    });
    alerted += 1;
  }

  return { alerted };
}
