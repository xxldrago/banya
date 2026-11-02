import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/client";

export async function GET() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
    });
  } catch (err) {
    return NextResponse.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
