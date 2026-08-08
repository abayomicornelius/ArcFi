import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const bounty = await prisma.bounty.findUnique({ where: { id } });
  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }
  if (bounty.status !== "funded") {
    return NextResponse.json({ error: "This bounty isn't open for applications" }, { status: 409 });
  }

  const { message } = (await req.json().catch(() => ({}))) as { message?: string };

  try {
    const application = await prisma.bountyApplication.create({
      data: {
        bountyId: id,
        userId: session.user.id,
        message: typeof message === "string" ? message.slice(0, 500) : null,
      },
    });
    return NextResponse.json({ ok: true, application });
  } catch {
    return NextResponse.json({ error: "You've already applied to this bounty" }, { status: 409 });
  }
}
