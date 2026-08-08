import { NextResponse } from "next/server";
import { isAddress, getAddress, formatUnits } from "viem";
import { getParticipantStats } from "@/lib/onchain";

export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const stats = await getParticipantStats(getAddress(address));

  return NextResponse.json({
    fundedUsdc: formatUnits(stats?.fundedUsdc ?? 0n, 6),
    fundedCount: stats?.fundedCount ?? 0,
    receivedUsdc: formatUnits(stats?.receivedUsdc ?? 0n, 6),
    receivedCount: stats?.receivedCount ?? 0,
  });
}
