import { NextResponse } from "next/server";

/**
 * Gates ArcFi's service-to-service routes (called by the oracle backend, not
 * a browser session) behind a shared secret rather than a user session.
 */
export function requireInternalSecret(req: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_API_SECRET not configured" }, { status: 500 });
  }
  const provided = req.headers.get("x-internal-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
