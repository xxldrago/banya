import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // CMS content pages — placeholder until Content model is added
  return NextResponse.json({ data: [] });
}
