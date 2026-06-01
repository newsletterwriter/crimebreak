import { NextRequest, NextResponse } from "next/server";
import { importCsv } from "@/lib/importer";
import { createServerClient } from "@/lib/supabase";
import { sendCountyPush } from "@/lib/notify";

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== process.env.IMPORT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  let csvText: string;
  try {
    csvText = await req.text();
    if (!csvText.trim()) throw new Error("Empty body");
  } catch {
    return NextResponse.json({ error: "Could not read CSV body" }, { status: 400 });
  }

  // Temporary debug — check PostgREST root + try with Accept-Profile header
  if (!dryRun) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const headers = { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "public" };
    const [root, withProfile] = await Promise.all([
      fetch(`${url}/rest/v1/`, { headers }).then(r => r.text()),
      fetch(`${url}/rest/v1/stories?limit=1`, { headers }).then(async r => ({ status: r.status, body: await r.text() })),
    ]);
    return NextResponse.json({ debug: true, root: root.slice(0, 300), withProfile });
  }

  const result = await importCsv(csvText, dryRun);

  // Fire push notifications for newly inserted stories
  if (!dryRun && result.inserted > 0) {
    try {
      const db = createServerClient();
      // Fetch the stories just inserted (most recent batch)
      const { data: newStories } = await db
        .from("stories")
        .select("id, headline, county, crime_type")
        .order("created_at", { ascending: false })
        .limit(result.inserted);

      if (newStories) {
        await Promise.allSettled(
          newStories.map((s) =>
            sendCountyPush({
              county: s.county,
              title: s.headline,
              body: s.crime_type ? `${s.county} — ${s.crime_type}` : s.county,
              url: `/story/${s.id}`,
            })
          )
        );
      }
    } catch (err) {
      console.error("Push notification error:", err);
      // Don't fail the import if push fails
    }
  }

  return NextResponse.json({
    dryRun,
    ...result,
    message: dryRun
      ? `Dry run: ${result.inserted} would be inserted, ${result.updated} updated, ${result.skipped} skipped`
      : `Imported: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`,
  });
}
