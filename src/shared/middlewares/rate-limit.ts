import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: { windowMs: number; max: number } = { windowMs: 60000, max: 100 }) {
  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    
    const record = rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + options.windowMs });
      return null;
    }
    
    if (record.count >= options.max) {
      return NextResponse.json(
        { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" } },
        { status: 429 }
      );
    }
    
    record.count++;
    return null;
  };
}
