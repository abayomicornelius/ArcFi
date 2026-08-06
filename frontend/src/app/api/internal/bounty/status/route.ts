import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalSecret } from "@/lib/internal-auth";

const VALID_STATUSES = ["funded", "released", "pending_recipient", "refunded"] as const;

/**
 * Called by the oracle backend after it resolves (or fails to resolve) a
 * merge — marks the bounty released with its tx hash, or flags it as
 * pending_recipient when the PR author has no linked wallet yet.
 */
export async function POST(req: Request) {
  const authError = requireInternalSecret(req);
  if (authError) return authError;

  const { bountyId, status, releaseTxHash } = (await req.json()) as {
    bountyId?: string;
    status?: (typeof VALID_STATUSES)[number];
    releaseTxHash?: string;
  };

  if (!bountyId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Missing or invalid bountyId/status" }, { status: 400 });
  }

  const bounty = await prisma.bounty.update({
    where: { id: bountyId },
    data: { status, releaseTxHash },
  });

  return NextResponse.json({ ok: true, bounty });
}
