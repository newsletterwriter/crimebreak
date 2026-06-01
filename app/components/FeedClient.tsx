"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StoryCard from "./StoryCard";
import type { Story } from "@/lib/supabase";

export default function FeedClient({ initialStories }: { initialStories: Story[] }) {
  const router = useRouter();
  const [county, setCounty] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cb_county");
    if (!saved) {
      router.replace("/onboard");
      return;
    }
    setCounty(saved);
  }, [router]);

  if (!county) return null;

  const filtered = showAll
    ? initialStories
    : initialStories.filter((s) => s.county === county);

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
      {/* County badge + toggle */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xs font-semibold text-[#6B7A8D] uppercase tracking-wide">
            {showAll ? "All counties" : "Your county"}
          </h1>
          <p className="text-lg font-black text-[#1B2B4A]">
            {showAll ? "Latest stories" : county}
          </p>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-xs font-semibold text-[#6B7A8D] border border-[#E2E8F0] rounded-full px-3 py-1 hover:border-[#1B2B4A] hover:text-[#1B2B4A] transition-colors"
        >
          {showAll ? "My county" : "All stories"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#6B7A8D] text-sm">No stories yet for {county}.</p>
          <p className="text-[#6B7A8D] text-xs mt-1">Check back soon — or view all stories.</p>
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 text-xs font-bold text-[#CC2222] hover:underline"
          >
            View all counties →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </main>
  );
}
