import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return apiError("VALIDATION_ERROR", "file required", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"];
    if (!allowed.includes(ext)) return apiError("VALIDATION_ERROR", "Unsupported file type", 400);
    if (file.size > 5 * 1024 * 1024) return apiError("VALIDATION_ERROR", "File too large (max 5MB)", 400);

    const fs = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", "chat");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer);
    const url = `/uploads/chat/${filename}`;
    const type = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image" : "document";

    return apiSuccess({ url, type, name: file.name, size: file.size });
  } catch (err) {
    console.error("POST /api/v1/chat/upload failed", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
