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

  const contentType = req.headers.get("content-type") || "";
  let type: string;
  let url: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    type = String(form.get("type") || "other");
    const file = form.get("file") as File | null;
    if (!file) return apiError("VALIDATION_ERROR", "file required", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const allowed = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
    if (!allowed.includes(ext)) return apiError("VALIDATION_ERROR", "Unsupported file type", 400);
    if (file.size > 10 * 1024 * 1024) return apiError("VALIDATION_ERROR", "File too large (max 10MB)", 400);

    const fs = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", "partner", "docs");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer);
    url = `/uploads/partner/docs/${filename}`;
  } else {
    const body = await req.json();
    type = body.type;
    url = body.url;
    if (!type || !url) return apiError("VALIDATION_ERROR", "type and url required", 400);
  }

  const doc = await prisma.partnerDocument.create({ data: { partnerId: partner.id, type, url, status: "pending" } });
  return apiSuccess(doc, undefined, 201);
}
