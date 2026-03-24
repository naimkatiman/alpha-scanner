export interface PaginatedResult<T> { data: T[]; total: number; page: number; totalPages: number; }
export function parsePaginationParams(sp: URLSearchParams) {
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "20")));
  const q = sp.get("q") || "";
  return { page, limit, q, skip: (page - 1) * limit };
}
export function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}
