import { describe, it, expect } from "vitest";
import {
  apiSuccess,
  apiError,
  apiValidationError,
} from "@/lib/api-response";
import { NextResponse } from "next/server";

describe("apiSuccess", () => {
  it("returns 200 with data wrapped in { data }", async () => {
    const response = apiSuccess({ id: 1, name: "Test" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: { id: 1, name: "Test" } });
  });

  it("accepts custom status code", async () => {
    const response = apiSuccess({ created: true }, 201);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ data: { created: true } });
  });

  it("wraps null data correctly", async () => {
    const response = apiSuccess(null);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: null });
  });
});

describe("apiError", () => {
  it("returns error with message and code", async () => {
    const response = apiError("Not found", 404, "NOT_FOUND");
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: { message: "Not found", code: "NOT_FOUND" },
    });
  });

  it("defaults to 500 when no status given", async () => {
    const response = apiError("Server error");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.message).toBe("Server error");
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("apiValidationError", () => {
  it("returns 422 with validation errors", async () => {
    const errors = [
      { path: "email", message: "Invalid email" },
      { path: "password", message: "Too short" },
    ];
    const response = apiValidationError(errors);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors,
      },
    });
  });
});
