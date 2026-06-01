import Link from "next/link";

export default function Nav({ county }: { county?: string | null }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-lg font-black tracking-tight text-[#1B2B4A]">CRIME</span>
          <span className="text-lg font-black tracking-tight text-[#CC2222]">BREAK</span>
        </Link>
        {county ? (
          <Link
            href="/onboard"
            className="text-xs font-semibold text-[#6B7A8D] border border-[#E2E8F0] rounded-full px-3 py-1 hover:border-[#1B2B4A] hover:text-[#1B2B4A] transition-colors"
          >
            {county}
          </Link>
        ) : (
          <Link
            href="/onboard"
            className="text-xs font-bold text-white bg-[#CC2222] rounded-full px-3 py-1 hover:bg-[#b01e1e] transition-colors"
          >
            Pick county
          </Link>
        )}
      </div>
    </header>
  );
}
