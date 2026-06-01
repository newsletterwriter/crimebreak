import { createServerClient } from "@/lib/supabase";
import Nav from "./components/Nav";
import FeedClient from "./components/FeedClient";
import type { Story } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = createServerClient();

  // Fetch the 40 most recent stories for SSR (county filtering happens client-side)
  const { data: stories } = await db
    .from("stories")
    .select("id,headline,body,image_url,state,city,county,crime_type,views,published_at,created_at")
    .order("published_at", { ascending: false })
    .limit(40);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <FeedClient initialStories={(stories as Story[]) || []} />
    </div>
  );
}
