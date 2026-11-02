// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/shared/db/client";

describe("Admin", () => {
  it("prisma can count users and bookings", async () => {
    const usersCount = await prisma.user.count();
    const bookingsCount = await prisma.booking.count();
    expect(typeof usersCount).toBe("number");
    expect(typeof bookingsCount).toBe("number");
  });

  it("can find admin users", async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    expect(admin).toBeTruthy();
  });
});
