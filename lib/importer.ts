import Papa from "papaparse";
import { createServerClient } from "./supabase";

// CSV columns from the Google Sheet export
type CsvRow = {
  Headline: string;
  Story: string;
  Catagories: string; // intentional typo — matches source
  Tag: string;
  Image: string;
};

export type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

// Extract date from image filename: Row6-2026-05-28-1749.jpg → "2026-05-28"
function extractDate(filename: string): string | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

// Parse "Pennsylvania, Reading, Berks County, New England" → { state, city, county }
function parseCategories(raw: string): {
  state: string;
  city: string;
  county: string;
} | null {
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return {
    state: parts[0],
    city: parts[1],
    county: parts[2],
  };
}

// Derive a rough crime_type from headline keywords
function detectCrimeType(headline: string): string {
  const h = headline.toLowerCase();
  if (/murder|homicide|kill|shot|stabbed|fatal/.test(h)) return "violent";
  if (/robbery|rob/.test(h)) return "robbery";
  if (/assault|attack|beat|punch/.test(h)) return "assault";
  if (/theft|steal|stolen|shoplifting|retail/.test(h)) return "theft";
  if (/drug|heroin|fentanyl|narcotic|cocaine/.test(h)) return "drugs";
  if (/dwi|dui|drunk driving/.test(h)) return "dwi";
  if (/sex offend|pornography|abuse|rape/.test(h)) return "sex-offense";
  if (/missing|found|located/.test(h)) return "missing-person";
  if (/arrested|warrant|charge|sentenced/.test(h)) return "arrest";
  return "other";
}

export async function importCsv(
  csvText: string,
  dryRun = false
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  const { data, errors: parseErrors } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseErrors.length) {
    result.errors.push({ row: 0, reason: `CSV parse error: ${parseErrors[0].message}` });
  }

  const db = createServerClient();

  for (let i = 0; i < data.length; i++) {
    const rowNum = i + 2; // 1-indexed + header
    const row = data[i];

    if (!row.Headline?.trim()) {
      result.errors.push({ row: rowNum, reason: "Missing headline" });
      result.skipped++;
      continue;
    }

    if (!row.Image?.trim()) {
      result.errors.push({ row: rowNum, reason: "Missing image filename (used as external_id)" });
      result.skipped++;
      continue;
    }

    const geo = parseCategories(row.Catagories || "");
    if (!geo) {
      result.errors.push({ row: rowNum, reason: `Cannot parse categories: "${row.Catagories}"` });
      result.skipped++;
      continue;
    }

    const imageFilename = row.Image.trim();
    const external_id = imageFilename;
    const dateStr = extractDate(imageFilename);
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.replace(/\/$/, "") || "";
    const image_url = baseUrl ? `${baseUrl}/${imageFilename}` : null;

    const story = {
      headline: row.Headline.trim(),
      body: row.Story?.trim() || null,
      url: null,
      image_url,
      state: geo.state,
      city: geo.city,
      county: geo.county,
      crime_type: detectCrimeType(row.Headline),
      source: "csv",
      published_at: dateStr ? `${dateStr}T00:00:00Z` : null,
      external_id,
    };

    if (dryRun) {
      result.inserted++;
      continue;
    }

    const { data: existing } = await db
      .from("stories")
      .select("id")
      .eq("external_id", external_id)
      .single();

    if (existing) {
      const { error } = await db
        .from("stories")
        .update(story)
        .eq("external_id", external_id);
      if (error) {
        result.errors.push({ row: rowNum, reason: error.message });
        result.skipped++;
      } else {
        result.updated++;
      }
    } else {
      const { error } = await db.from("stories").insert(story);
      if (error) {
        result.errors.push({ row: rowNum, reason: error.message });
        result.skipped++;
      } else {
        result.inserted++;
      }
    }
  }

  return result;
}

// Returns only external_ids that were NOT already in the DB (truly new)
export async function getNewExternalIds(externalIds: string[]): Promise<string[]> {
  if (!externalIds.length) return [];
  const db = createServerClient();
  const { data } = await db
    .from("stories")
    .select("external_id")
    .in("external_id", externalIds);
  const existing = new Set((data || []).map((r: any) => r.external_id));
  return externalIds.filter((id) => !existing.has(id));
}
