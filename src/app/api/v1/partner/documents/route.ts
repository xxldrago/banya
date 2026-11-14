import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const docs = await prisma.partnerDocument.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } });
  return apiSuccess(docs);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partner = await prisma.partner.findFirst({ where: { userId: user.sub } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const body = await req.json();
  const { type, url } = body;
  if (!type || !url) return apiError("VALIDATION_ERROR", "type and url required", 400);

  const doc = await prisma.partnerDocument.create({ data: { partnerId: partner.id, type, url, status: "pending" } });
  return apiSuccess(doc, undefined, 201);
}
