import { createClient } from "@supabase/supabase-js";

export type Story = {
  id: string;
  headline: string;
  body: string | null;
  url: string | null;
  image_url: string | null;
  state: string;
  city: string | null;
  county: string;
  crime_type: string | null;
  views: number;
  source: string;
  published_at: string | null;
  created_at: string;
  external_id: string | null;
};

export type Subscriber = {
  id: string;
  onesignal_id: string | null;
  counties: string[];
  email: string | null;
  created_at: string;
};

// Browser client (uses anon key — safe to expose)
export function createBrowserClient() {
  return createClient<{ stories: Story; subscribers: Subscriber }>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client (uses service role key — never exposed to browser)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
