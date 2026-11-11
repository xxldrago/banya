import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // CMS content pages — placeholder until Content model is added
  return NextResponse.json({ data: [] });
}
