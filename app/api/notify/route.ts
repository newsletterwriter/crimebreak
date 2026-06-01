import { NextRequest, NextResponse } from "next/server";
import { sendCountyPush } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== process.env.IMPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { county, title, body, url } = await req.json();
  if (!county || !title) {
    return NextResponse.json({ error: "county and title required" }, { status: 400 });
  }

  await sendCountyPush({ county, title, body: body || county, url: url || "/" });
  return NextResponse.json({ ok: true });
}
