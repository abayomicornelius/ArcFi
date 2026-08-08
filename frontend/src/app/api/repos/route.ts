import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Public repo search (used by the funding-form autocomplete) and, with ?mine=1, the signed-in user's own submissions. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const mine = url.searchParams.get("mine") === "1";

  if (mine) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const repos = await prisma.repo.findMany({ where: { addedByUserId: session.user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ repos });
  }

  const repos = await prisma.repo.findMany({
    where: q ? { OR: [{ githubOwner: { contains: q } }, { githubRepo: { contains: q } }] } : undefined,
    orderBy: { stars: "desc" },
    take: 20,
  });
  return NextResponse.json({ repos });
}
