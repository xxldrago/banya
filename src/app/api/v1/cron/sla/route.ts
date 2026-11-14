import { NextRequest, NextResponse } from "next/server";
import { checkSlaAlerts } from "@/modules/support/sla.service";

/**
 * Cron endpoint for SLA breach alerts. Pinged by server.js every 5 minutes.
 * Protected by CRON_SECRET when set; open in development.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET required in production" }, { status: 401 });
  }
  try {
    const result = await checkSlaAlerts();
    return NextResponse.json({ data: result });
  } catch (e) {
    console.error("cron/sla failed", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
