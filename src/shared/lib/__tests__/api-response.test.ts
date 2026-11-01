import { describe, it, expect } from "vitest";
import { apiSuccess, apiError } from "@/shared/lib/api-response";

describe("apiSuccess", () => {
  it("returns { data } for a single resource", async () => {
    const response = apiSuccess({ id: "1", name: "Москва" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: { id: "1", name: "Москва" } });
  });

  it("returns { data, meta } for list responses", async () => {
    const items = [{ id: "1" }, { id: "2" }];
    const meta = { total: 2, limit: 20, offset: 0 };
    const response = apiSuccess(items, meta);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: items, meta });
  });
});

describe("apiError", () => {
  it("returns { error: { code, message } } with HTTP status", async () => {
    const response = apiError("CITY_REQUIRED", "cityId is required", 400);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: { code: "CITY_REQUIRED", message: "cityId is required" },
    });
  });

  it("defaults status to 400 when omitted", async () => {
    const response = apiError("VALIDATION_ERROR", "Invalid input");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid input");
  });
});
