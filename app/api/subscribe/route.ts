import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { onesignal_id, counties } = await req.json();

  if (!onesignal_id || !Array.isArray(counties) || !counties.length) {
    return NextResponse.json(
      { error: "onesignal_id and counties[] required" },
      { status: 400 }
    );
  }

  const db = createServerClient();
  const { error } = await db
    .from("subscribers")
    .upsert({ onesignal_id, counties }, { onConflict: "onesignal_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
