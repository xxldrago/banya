// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";
import { sendNotification, getUserNotifications } from "@/modules/notifications/notification.service";

describe("Notifications", () => {
  let userId: string;

  beforeAll(async () => {
    // Force the mock provider path: unit tests must not hit real email APIs
    process.env.SENDGRID_API_KEY = "";
    // Dedicated user with an email so dispatch resolves a recipient
    // deterministically regardless of other tests' data.
    const user = await prisma.user.upsert({
      where: { email: "notify-test@banya.local" },
      update: {},
      create: {
        email: "notify-test@banya.local",
        passwordHash: "test",
        firstName: "Notify",
        lastName: "Test",
        role: "CLIENT",
      },
    });
    userId = user.id;
    await prisma.notification.deleteMany({ where: { userId } });
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
