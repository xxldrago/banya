import { describe, it, expect } from "vitest";
import { getPaginationParams, buildPaginationMeta } from "@/lib/pagination";

describe("getPaginationParams", () => {
  it("extracts page and limit from URL search params", () => {
    const params = new URLSearchParams("?page=2&limit=20");
    const result = getPaginationParams(params);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it("applies defaults when missing", () => {
    const params = new URLSearchParams("");
    const result = getPaginationParams(params);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });

  it("clamps limit to max 50", () => {
    const params = new URLSearchParams("?limit=200");
    const result = getPaginationParams(params);
    expect(result.limit).toBe(50);
  });

  it("clamps page to minimum 1", () => {
    const params = new URLSearchParams("?page=-5");
    const result = getPaginationParams(params);
    expect(result.page).toBe(1);
  });
});

describe("buildPaginationMeta", () => {
  it("computes total pages and hasMore flag", () => {
    const meta = buildPaginationMeta(25, 2, 12);
    expect(meta.total).toBe(25);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(12);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasMore).toBe(true); // page 2 < 3 total pages
  });

  it("hasMore is true when on a page before the last", () => {
    const meta = buildPaginationMeta(25, 1, 12);
    expect(meta.hasMore).toBe(true);
  });

  it("handles zero total", () => {
    const meta = buildPaginationMeta(0, 1, 12);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasMore).toBe(false);
  });
});
