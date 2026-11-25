import { NextResponse, type NextRequest } from "next/server";
import { loadRegistry } from "@/server/registry";
import { resolveModuleStatus } from "@/server/content/lessons";
import { handleSearchRequest } from "@/server/search/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Read-only search endpoint: GET /api/search?q=...
 *
 * Validation, ranking and DTO construction live in the server search module so
 * they can be tested without HTTP. This adapter only handles transport.
 */
export async function GET(request: NextRequest) {
  try {
    const registry = await loadRegistry();
    const result = handleSearchRequest(new URL(request.url), registry, resolveModuleStatus);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Search route failed", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable.", code: "search-unavailable" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
