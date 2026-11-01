/**
 * Parse and validate pagination parameters from URL search params.
 * Defaults: page=1, limit=12. Limit clamped to max 50.
 */
export function getPaginationParams(
  searchParams: URLSearchParams
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination metadata for API responses.
 */
export function buildPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}
