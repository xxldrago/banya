import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const items = await prisma.tariff.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(items);
  } catch (err) {
    console.error("GET /api/v1/partner/tariffs failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

    const body = await req.json();
    const { name, description, type = "promotion", price, isActive = true } = body;

    if (!name || price === undefined) {
      return apiError("VALIDATION_ERROR", "name and price are required", 400);
    }

    const item = await prisma.tariff.create({
      data: { partnerId: partner.id, name, description: description ?? null, type, price, isActive },
    });

    return apiSuccess(item, undefined, 201);
  } catch (err) {
    console.error("POST /api/v1/partner/tariffs failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
