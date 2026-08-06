import { NextResponse } from "next/server";
import { isAddress, getAddress } from "viem";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { walletAddress } = (await req.json()) as { walletAddress?: string };
  if (!walletAddress || !isAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const checksummed = getAddress(walletAddress);

  const existing = await prisma.user.findUnique({ where: { walletAddress: checksummed } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "That wallet is already linked to another profile" }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { walletAddress: checksummed },
  });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { walletAddress: null },
  });

  return NextResponse.json({ ok: true, user });
}
