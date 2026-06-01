"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { countiesByState, type CountyEntry } from "@/lib/counties";

type Step = "county" | "push" | "done";

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("county");
  const [selectedCounty, setSelectedCounty] = useState<CountyEntry | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "loading" | "done" | "blocked">("idle");

  const byState = countiesByState();
  const states = Object.keys(byState).sort();

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone =
      (navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    setIsIOS(ios);
    setIsStandalone(standalone);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    // Skip if already onboarded
    const saved = localStorage.getItem("cb_county");
    if (saved) router.replace("/");
  }, [router]);

  const filteredCounties = selectedState
    ? byState[selectedState].filter((c) =>
        c.county.toLowerCase().includes(search.toLowerCase())
      )
    : Object.values(byState)
        .flat()
        .filter((c) =>
          search.length > 1 &&
          (c.county.toLowerCase().includes(search.toLowerCase()) ||
            c.state.toLowerCase().includes(search.toLowerCase()))
        )
        .slice(0, 20);

  function selectCounty(c: CountyEntry) {
    setSelectedCounty(c);
    setSearch("");
  }

  function confirmCounty() {
    if (!selectedCounty) return;
    localStorage.setItem("cb_county", selectedCounty.county);
    localStorage.setItem("cb_state", selectedCounty.state);
    setStep("push");
  }

  async function enablePush() {
    if (!selectedCounty) return;
    setPushStatus("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("blocked");
        return;
      }

      // Register OneSignal player and tag with county
      const OneSignal = (window as any).OneSignal;
      if (OneSignal) {
        await OneSignal.login?.(undefined);
        const playerId = await OneSignal.User?.pushSubscription?.id;
        if (playerId) {
          await OneSignal.User?.addTag?.("county", selectedCounty.county);
          await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              onesignal_id: playerId,
              counties: [selectedCounty.county],
            }),
          });
        }
      }

      setPushStatus("done");
      setStep("done");
    } catch (err) {
      console.error(err);
      setPushStatus("blocked");
    }
  }

  function skipPush() {
    router.push("/");
  }

  function goToFeed() {
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] px-4 py-4 flex items-center gap-2">
        <span className="text-xl font-black tracking-tight text-[#1B2B4A]">CRIME</span>
        <span className="text-xl font-black tracking-tight text-[#CC2222]">BREAK</span>
      </header>

      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        {/* Step: County picker */}
        {step === "county" && (
          <div>
            <h1 className="text-2xl font-black text-[#1B2B4A] mb-1">
              Pick your county
            </h1>
            <p className="text-[#6B7A8D] text-sm mb-6">
              You&apos;ll only see crime news for the county you choose.
            </p>

            {/* State selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#6B7A8D] uppercase tracking-wide mb-1">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedCounty(null); setSearch(""); }}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[#1B2B4A] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2B4A]"
              >
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Search/filter */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#6B7A8D] uppercase tracking-wide mb-1">
                Search county
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={selectedState ? `Search in ${selectedState}…` : "Type a county name…"}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-[#1B2B4A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B4A]"
              />
            </div>

            {/* County list */}
            {(search.length > 0 || selectedState) && (
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mb-6 max-h-64 overflow-y-auto">
                {filteredCounties.length === 0 ? (
                  <p className="px-4 py-3 text-[#6B7A8D] text-sm">No counties found</p>
                ) : (
                  filteredCounties.map((c) => (
                    <button
                      key={`${c.state}-${c.county}`}
                      onClick={() => selectCounty(c)}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-[#E2E8F0] last:border-0 transition-colors ${
                        selectedCounty?.county === c.county && selectedCounty?.state === c.state
                          ? "bg-[#1B2B4A] text-white"
                          : "hover:bg-[#F8F9FB] text-[#1B2B4A]"
                      }`}
                    >
                      <span className="font-medium">{c.county}</span>
                      {!selectedState && (
                        <span className="text-xs ml-2 opacity-60">{c.abbr}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected county pill */}
            {selectedCounty && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#CC2222] shrink-0" />
                <span className="text-sm font-semibold text-[#1B2B4A]">
                  {selectedCounty.county}, {selectedCounty.abbr}
                </span>
                <button onClick={() => setSelectedCounty(null)} className="ml-auto text-[#6B7A8D] text-xs hover:text-[#1B2B4A]">
                  Change
                </button>
              </div>
            )}

            <button
              onClick={confirmCounty}
              disabled={!selectedCounty}
              className="w-full bg-[#1B2B4A] disabled:opacity-40 hover:bg-[#14213a] text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Push opt-in */}
        {step === "push" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#CC2222] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            <h1 className="text-2xl font-black text-[#1B2B4A] mb-2">
              Enable crime alerts
            </h1>
            <p className="text-[#6B7A8D] text-sm mb-2">
              You&apos;ll get a notification the moment a story lands in
            </p>
            <p className="text-[#1B2B4A] font-bold mb-8">{selectedCounty?.county}</p>

            {isIOS && !isStandalone && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-800">
                <p className="font-semibold mb-2">Add to Home Screen first</p>
                <p>iOS push only works from the installed app. Tap <strong>Share ⬆</strong> → <strong>Add to Home Screen</strong>, then open Crime Break from there.</p>
              </div>
            )}

            {pushStatus === "blocked" && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                Notifications were blocked. Go to Settings → Safari → Notifications to reset, then try again.
              </div>
            )}

            <button
              onClick={enablePush}
              disabled={pushStatus === "loading"}
              className="w-full bg-[#CC2222] hover:bg-[#b01e1e] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors mb-3"
            >
              {pushStatus === "loading" ? "Enabling…" : "Enable Notifications"}
            </button>
            <button
              onClick={skipPush}
              className="w-full text-[#6B7A8D] text-sm py-2 hover:text-[#1B2B4A] transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-[#1B2B4A] mb-2">You&apos;re set</h1>
            <p className="text-[#6B7A8D] text-sm mb-8">
              Breaking crime alerts are on for <strong className="text-[#1B2B4A]">{selectedCounty?.county}</strong>.
            </p>
            <button
              onClick={goToFeed}
              className="w-full bg-[#1B2B4A] hover:bg-[#14213a] text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              See Latest Stories
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
