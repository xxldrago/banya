import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: u });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = ["firstName", "lastName", "phone", "email", "birthDate"];
  const data: any = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  const updated = await prisma.user.update({ where: { id: user.sub }, data });
  return NextResponse.json({ data: updated });
}
