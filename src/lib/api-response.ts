import { NextResponse } from "next/server";

/**
 * Standard API success response.
 * Wraps data in { data: ... } envelope.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Standard API error response.
 * Wraps error in { error: { message, code } } envelope.
 */
export function apiError(
  message: string,
  status: number = 500,
  code: string = "INTERNAL_ERROR"
): NextResponse {
  return NextResponse.json(
    { error: { message, code } },
    { status }
  );
}

/**
 * Validation error response (422).
 * Includes field-level details.
 */
export function apiValidationError(
  details: Array<{ path: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      },
    },
    { status: 422 }
  );
}
