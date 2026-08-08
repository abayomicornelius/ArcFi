import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { isSponsor, isMaintainer, isContributor, bio, twitterUrl, linkedinUrl, telegramUrl } = body as {
    isSponsor?: boolean;
    isMaintainer?: boolean;
    isContributor?: boolean;
    bio?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    telegramUrl?: string;
  };

  const asUrlOrNull = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim().slice(0, 300) : null);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      isSponsor: Boolean(isSponsor),
      isMaintainer: Boolean(isMaintainer),
      isContributor: Boolean(isContributor),
      bio: typeof bio === "string" ? bio.slice(0, 280) : undefined,
      twitterUrl: asUrlOrNull(twitterUrl),
      linkedinUrl: asUrlOrNull(linkedinUrl),
      telegramUrl: asUrlOrNull(telegramUrl),
    },
  });

  return NextResponse.json({ ok: true, user });
}
