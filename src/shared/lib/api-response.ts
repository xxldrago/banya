import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown> | number, status: number = 200) {
  let metaObj: Record<string, unknown> | undefined;
  let statusCode = status;
  
  if (typeof meta === 'number') {
    statusCode = meta;
  } else if (meta !== undefined && meta !== null) {
    metaObj = meta;
  }
  
  if (metaObj !== undefined) {
    return NextResponse.json({ data, meta: metaObj }, { status: statusCode });
  }
  return NextResponse.json({ data }, { status: statusCode });
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
