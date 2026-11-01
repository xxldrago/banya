import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  if (meta !== undefined) {
    return NextResponse.json({ data, meta });
  }
  return NextResponse.json({ data });
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
) {
  const error: { code: string; message: string; details?: unknown } = {
    code,
    message,
  };
  if (details !== undefined) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}
