import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.bountyRequest.findUnique({ where: { id } });
  if (!request || request.requestedByUserId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.status !== "open") {
    return NextResponse.json({ error: "Only open requests can be withdrawn" }, { status: 409 });
  }

  await prisma.bountyRequest.update({ where: { id }, data: { status: "withdrawn" } });
  return NextResponse.json({ ok: true });
}
