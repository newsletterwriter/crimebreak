import Link from "next/link";
import Image from "next/image";
import type { Story } from "@/lib/supabase";

const CRIME_COLORS: Record<string, string> = {
  violent: "bg-red-100 text-red-800",
  robbery: "bg-orange-100 text-orange-800",
  assault: "bg-orange-100 text-orange-800",
  theft: "bg-amber-100 text-amber-800",
  drugs: "bg-purple-100 text-purple-800",
  dwi: "bg-blue-100 text-blue-800",
  "sex-offense": "bg-red-100 text-red-800",
  "missing-person": "bg-teal-100 text-teal-800",
  arrest: "bg-[#E2E8F0] text-[#1B2B4A]",
  other: "bg-[#E2E8F0] text-[#6B7A8D]",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StoryCard({ story }: { story: Story }) {
  const tagClass = CRIME_COLORS[story.crime_type || "other"] ?? CRIME_COLORS.other;
  const imageUrl = story.image_url;

  return (
    <Link
      href={`/story/${story.id}`}
      className="block bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#1B2B4A] transition-colors group"
    >
      {imageUrl && (
        <div className="relative w-full aspect-[16/9] bg-[#F8F9FB]">
          <Image
            src={imageUrl}
            alt={story.headline}
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {story.crime_type && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${tagClass}`}>
              {story.crime_type.replace("-", " ")}
            </span>
          )}
          <span className="text-[#6B7A8D] text-xs ml-auto">{formatDate(story.published_at)}</span>
        </div>
        <h2 className="font-bold text-[#1B2B4A] text-sm leading-snug group-hover:text-[#CC2222] transition-colors line-clamp-3">
          {story.headline}
        </h2>
        <p className="text-[#6B7A8D] text-xs mt-1.5">{story.city ? `${story.city}, ` : ""}{story.county}</p>
      </div>
    </Link>
  );
}
