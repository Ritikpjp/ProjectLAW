import { NextResponse } from "next/server";
import { destroySession, sameOrigin } from "@/lib/auth/session";

export async function POST() {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  await destroySession();
  return NextResponse.json({ ok: true });
}
