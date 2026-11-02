// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { sendNotification, getUserNotifications } from "@/modules/notifications/notification.service";

describe("Notifications", () => {
  let userId: string;

  beforeAll(async () => {
    await prisma.notification.deleteMany({});
    const user = await prisma.user.findFirst({ where: { role: "CLIENT" } });
    if (user) userId = user.id;
  });

  it("sendNotification creates and sends notification", async () => {
    const notification = await sendNotification(
      userId,
      "booking_confirmed",
      "email",
      "Test notification",
      "This is a test"
    );
    expect(notification).toBeTruthy();
    expect(notification.status).toBe("sent");
    expect(notification.type).toBe("booking_confirmed");
  });

  it("getUserNotifications returns user notifications", async () => {
    const notifications = await getUserNotifications(userId);
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBeGreaterThan(0);
  });
});
