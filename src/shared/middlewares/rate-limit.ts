import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

export function rateLimit(req: any) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0] || "unknown";
  const key = ip + ":" + req.nextUrl.pathname;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return null;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  record.count++;
  return null;
}
