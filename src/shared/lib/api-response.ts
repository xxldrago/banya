import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  if (meta !== undefined) {
    return NextResponse.json({ data, meta });
  }
  return NextResponse.json({ data });
}

export function apiError(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    { error: { code, message } },
    { status },
  );
}
