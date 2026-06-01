import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import Nav from "@/app/components/Nav";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = createServerClient();
  const { data } = await db.from("stories").select("headline,body,image_url,county").eq("id", id).single();
  if (!data) return { title: "Story not found" };

  return {
    title: data.headline,
    description: data.body?.slice(0, 160) || `Crime news from ${data.county}`,
    openGraph: {
      title: data.headline,
      description: data.body?.slice(0, 160) || `Crime news from ${data.county}`,
      images: data.image_url ? [{ url: data.image_url }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: data.headline,
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const db = createServerClient();

  const { data: story } = await db
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (!story) notFound();

  // Increment view count (fire and forget)
  db.from("stories").update({ views: (story.views || 0) + 1 }).eq("id", id);

  const publishedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : null;

  // Article schema for Google Discover
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.headline,
    description: story.body?.slice(0, 160) || "",
    image: story.image_url ? [story.image_url] : [],
    datePublished: story.published_at || story.created_at,
    dateModified: story.created_at,
    author: { "@type": "Organization", name: "Crime Break" },
    publisher: {
      "@type": "Organization",
      name: "Crime Break",
      logo: { "@type": "ImageObject", url: `${process.env.NEXT_PUBLIC_APP_URL}/icon-192.png` },
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-[#6B7A8D] hover:text-[#1B2B4A] mb-5 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-2 mb-3">
          {story.crime_type && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#E2E8F0] text-[#1B2B4A]">
              {story.crime_type.replace("-", " ")}
            </span>
          )}
          <span className="text-xs text-[#6B7A8D]">{story.county}</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-black text-[#1B2B4A] leading-tight mb-3">
          {story.headline}
        </h1>

        {publishedDate && (
          <p className="text-xs text-[#6B7A8D] mb-5">{publishedDate}</p>
        )}

        {/* Image */}
        {story.image_url && (
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-6 bg-[#F8F9FB]">
            <Image
              src={story.image_url}
              alt={story.headline}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
        )}

        {/* Body */}
        {story.body ? (
          <div className="prose prose-sm max-w-none text-[#1B2B4A] leading-relaxed">
            {story.body.split("\n\n").map((para: string, i: number) => (
              <p key={i} className="mb-4 text-sm leading-relaxed text-[#1B2B4A]">
                {para.trim()}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[#6B7A8D] text-sm italic">Full story not available.</p>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#6B7A8D]">
            Source: Crime Break local reporting · {story.county}
          </p>
        </div>
      </main>
    </div>
  );
}
