import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/shared/middlewares/get-session";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venueId = req.nextUrl.searchParams.get("venueId");
  const jobs = await prisma.iCalSyncJob.findMany({
    where: venueId ? { venueId } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: jobs });
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { venueId, sourceUrl } = body;

  const job = await prisma.iCalSyncJob.create({
    data: {
      venueId,
      sourceUrl,
      status: "pending",
    },
  });

  return NextResponse.json({ data: job });
}
