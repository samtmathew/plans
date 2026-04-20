import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GrainOverlay } from "@/components/common/GrainOverlay"
import { PolaroidStack } from "@/components/landing/PolaroidStack"
import { MasonryPlanCard, type MasonryCardData } from "@/components/landing/MasonryPlanCard"
import { JoinCardPreview } from "@/components/landing/JoinCardPreview"

const MASONRY_CARDS: MasonryCardData[] = [
  {
    title: "Emma's 25th 🎂",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[3/4]",
    date: "Mar 15",
    costPerPerson: "~£45/pp",
    rotateClass: "rotate-[-1.2deg]",
    avatars: [
      { src: "https://i.pravatar.cc/36?img=5", fallback: "E" },
      { src: "https://i.pravatar.cc/36?img=10", fallback: "A" },
      { src: "https://i.pravatar.cc/36?img=15", fallback: "T" },
    ],
  },
  {
    title: "Lake District Weekend",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
    date: "Apr 5–7",
    costPerPerson: "~£120/pp",
    rotateClass: "rotate-[0.8deg]",
  },
  {
    title: "Glastonbury 2025 🎵",
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[4/3]",
    date: "Jun 25",
    costPerPerson: "~£340/pp",
    rotateClass: "rotate-[-0.5deg]",
    avatars: [
      { src: "https://i.pravatar.cc/36?img=20", fallback: "M" },
      { src: "https://i.pravatar.cc/36?img=25", fallback: "J" },
    ],
  },
  {
    title: "Rooftop Drinks",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[3/4]",
    date: "Friday",
    costPerPerson: "~£22/pp",
    rotateClass: "rotate-[1deg]",
  },
  {
    title: "Boys Golf Day ⛳",
    imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
    rotateClass: "rotate-[-0.7deg]",
    avatars: [
      { src: "https://i.pravatar.cc/36?img=30", fallback: "P" },
      { src: "https://i.pravatar.cc/36?img=35", fallback: "D" },
      { src: "https://i.pravatar.cc/36?img=40", fallback: "S" },
      { src: "https://i.pravatar.cc/36?img=45", fallback: "R" },
    ],
  },
  {
    title: "Snowdonia Hike 🏔",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[4/3]",
    date: "Aug 3",
    costPerPerson: "~£85/pp",
    rotateClass: "rotate-[1.5deg]",
  },
  {
    title: "Summer Dinner Party",
    imageUrl: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-[3/4]",
    rotateClass: "rotate-[-1deg]",
    avatars: [
      { src: "https://i.pravatar.cc/36?img=7", fallback: "L" },
      { src: "https://i.pravatar.cc/36?img=14", fallback: "K" },
    ],
    costPerPerson: "~£38/pp",
  },
  {
    title: "Italy Road Trip 🚗",
    imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80&auto=format&fit=crop",
    aspectClass: "aspect-square",
    date: "Sept",
    costPerPerson: "~£600/pp",
    rotateClass: "rotate-[0.6deg]",
  },
]

export default function LandingPage() {
  return (
    <main className="bg-[#FCF9F8] text-[#1C1B1B] min-h-screen overflow-x-hidden">
      <GrainOverlay />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-12 bg-[rgba(252,249,248,0.85)] backdrop-blur-2xl border-b border-[rgba(28,27,27,0.06)]">
        <span className="font-headline italic text-[22px] text-[#1C1B1B]">Plans</span>
        <div className="flex items-center gap-1.5">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full text-[#5E5E5E] font-medium text-sm hover:text-[#1C1B1B] hover:bg-transparent">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full bg-[#1C1B1B] text-white font-medium text-sm px-5 shadow-[0_4px_12px_rgba(28,27,27,0.12)] hover:bg-[#2d2d2d]">
              Get started →
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── S1: HERO ── */}
      <section className="max-w-[1200px] mx-auto px-12 pt-36 pb-20 flex items-center gap-16 min-h-screen">
        <div className="flex-none w-[46%] max-w-[480px]">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-5">
            For any plan. Any crew.
          </p>
          <h1
            className="font-headline italic leading-[0.95] tracking-[-2.5px] mb-6"
            style={{ fontSize: "clamp(56px, 5.8vw, 80px)" }}
          >
            Make plans.
            <br />
            <span className="text-[#3D3D8F]">Actually go.</span>
          </h1>
          <p className="text-[17px] text-[#5E5E5E] leading-[1.65] mb-10 max-w-[360px]">
            The group planner that doesn&apos;t get in the way.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/signup">
              <Button className="rounded-full bg-[#1C1B1B] text-white text-[16px] font-medium px-8 py-6 shadow-[0_4px_20px_rgba(28,27,27,0.12)] hover:bg-[#2d2d2d] transition-all hover:-translate-y-0.5">
                Start planning free →
              </Button>
            </Link>
            <button className="text-[14px] text-[#5E5E5E] underline underline-offset-[3px] hover:text-[#1C1B1B] transition-colors bg-transparent border-0 cursor-pointer">
              See how it works
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center min-h-[480px]">
          <PolaroidStack />
        </div>
      </section>

      {/* ── S2: FEATURE STRIP ── */}
      <div className="border-y border-[rgba(28,27,27,0.07)]">
        <div className="max-w-[1200px] mx-auto px-12 grid grid-cols-3">
          {[
            {
              n: "01",
              t: "Plans for anything.",
              d: "Birthdays, trips, concerts, or just hanging out. No templates, no categories.",
            },
            {
              n: "02",
              t: "Split costs cleanly.",
              d: "Itemised breakdowns, calculated per-head or group. Always live, never stale.",
            },
            {
              n: "03",
              t: "Bring everyone in.",
              d: "Share a link, manage approvals, see who's coming. One tap from any group chat.",
            },
          ].map((feat, i) => (
            <div
              key={i}
              className={`py-14 px-11 ${i < 2 ? "border-r border-[rgba(28,27,27,0.06)]" : ""}`}
            >
              <p className="font-headline italic text-[40px] leading-none text-[#C7C5D3] mb-4">{feat.n}</p>
              <p className="text-[17px] font-semibold tracking-[-0.3px] mb-2">{feat.t}</p>
              <p className="text-[14px] text-[#5E5E5E] leading-[1.65]">{feat.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── S3: MASONRY SHOWCASE ── */}
      <section className="max-w-[1200px] mx-auto px-12 py-24">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-4">
              The mood board
            </p>
            <h2
              className="font-headline italic leading-[1.05] tracking-[-1.5px]"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              Every kind of plan.
              <br />
              One place.
            </h2>
          </div>
          <p className="text-[14px] text-[#5E5E5E] max-w-[260px] text-right leading-[1.6]">
            From spontaneous drinks to month-long road trips. Plans adapts to whatever you&apos;re doing.
          </p>
        </div>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {MASONRY_CARDS.map((card, i) => (
            <MasonryPlanCard key={i} card={card} />
          ))}
        </div>
      </section>

      {/* ── S4: HOW IT WORKS ── */}
      <section className="bg-white border-y border-[rgba(28,27,27,0.06)]">
        <div className="max-w-[1200px] mx-auto px-12 py-24">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-3">
            How it works
          </p>
          <h2
            className="font-headline italic leading-[1.05] tracking-[-1.5px] mb-16 max-w-[380px]"
            style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
          >
            Three steps.
            <br />
            That&apos;s it.
          </h2>
          <div className="grid grid-cols-3 gap-10">
            <div className="pl-5 border-l border-[rgba(28,27,27,0.1)]">
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-3">Step 01</p>
              <p className="text-[18px] font-semibold tracking-[-0.3px] mb-2.5">Create your plan</p>
              <p className="text-[14px] text-[#5E5E5E] leading-[1.65] mb-4">
                Name it, add a cover photo, dates, itinerary, and cost breakdown. Takes under 3 minutes.
              </p>
              <div className="flex items-center gap-3 bg-[#F6F3F2] rounded-lg p-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=100&q=80&auto=format&fit=crop"
                  alt="Sarah's 30th"
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div>
                  <p className="font-headline italic text-[13px] text-[#1C1B1B]">Sarah&apos;s 30th</p>
                  <p className="text-[11px] text-[#5E5E5E]">Mar 22 · £45/person</p>
                </div>
              </div>
            </div>

            <div className="pl-5 border-l border-[rgba(28,27,27,0.1)]">
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-3">Step 02</p>
              <p className="text-[18px] font-semibold tracking-[-0.3px] mb-2.5">Share the link</p>
              <p className="text-[14px] text-[#5E5E5E] leading-[1.65] mb-4">
                Drop it in the group chat. Friends join directly from the link — no app needed to RSVP.
              </p>
              <div className="bg-[#F6F3F2] rounded-lg p-3.5 space-y-2">
                <p className="text-[11px] font-medium text-[#5E5E5E]">plans.app/join/sarah30</p>
                <div className="flex gap-2">
                  <span className="bg-[#25D366] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    WhatsApp
                  </span>
                  <span className="bg-[#F0EDEC] text-[#5E5E5E] text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    Copy link
                  </span>
                </div>
              </div>
            </div>

            <div className="pl-5 border-l border-[rgba(28,27,27,0.1)]">
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#5E5E5E] mb-3">Step 03</p>
              <p className="text-[18px] font-semibold tracking-[-0.3px] mb-2.5">Everyone&apos;s in</p>
              <p className="text-[14px] text-[#5E5E5E] leading-[1.65] mb-4">
                Approve requests, see who&apos;s coming, and everyone has the full plan in their pocket.
              </p>
              <div className="flex items-center gap-3 bg-[#F6F3F2] rounded-lg p-3.5">
                <div className="flex">
                  {["47", "12", "32", "25", "8"].map((id, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={id}
                      src={`https://i.pravatar.cc/56?img=${id}`}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-headline italic text-[13px] text-[#1C1B1B]">8 going</p>
                  <p className="text-[11px] text-[#5E5E5E]">2 pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── S5: SHARE SECTION ── */}
      <section className="max-w-[1200px] mx-auto px-12 py-24">
        <div className="grid grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#3D3D8F] mb-4">
              Growth · Sharing
            </p>
            <h2
              className="font-headline italic leading-[1.05] tracking-[-1.5px] mb-5"
              style={{ fontSize: "clamp(36px, 4vw, 52px)" }}
            >
              The plan lives
              <br />
              in the chat.
            </h2>
            <p className="text-[16px] text-[#5E5E5E] leading-[1.65] mb-8 max-w-[400px]">
              Drop a Plans link in any group chat. Friends see a beautiful preview — no sign-up, no
              friction. Just tap and join.
            </p>
            <ul className="space-y-3">
              {[
                "No app needed to RSVP — works for everyone",
                "Organiser approves or auto-accepts requests",
                "Joiners see full plan: itinerary, cost, who else is going",
                "Convert to account later to create their own plans",
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[#5E5E5E] leading-[1.5]">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#3D3D8F] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <JoinCardPreview />
          </div>
        </div>
      </section>

      {/* ── S6 + S7: STATS + QUOTE (dark band) ── */}
      <div className="bg-[#1C1B1B]">
        {/* Stats */}
        <div className="max-w-[1200px] mx-auto px-12 py-16 grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.08)]">
          {[
            { n: "12,400+", l: "Plans made so far" },
            { n: "94%", l: "Plans that actually happened" },
            { n: "2 min", l: "Average time to create a plan" },
          ].map((s, i) => (
            <div key={i} className={i === 0 ? "pr-12" : i === 1 ? "px-12" : "pl-12"}>
              <p
                className="font-headline italic text-white leading-none tracking-[-2px] mb-1.5"
                style={{ fontSize: "clamp(40px, 4vw, 52px)" }}
              >
                {s.n}
              </p>
              <p className="text-[14px] text-[rgba(255,255,255,0.5)]">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="relative overflow-hidden pb-24">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-[#262477] opacity-20 rounded-full blur-[80px] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto px-12 text-center relative z-10">
            <span className="font-headline italic text-[72px] text-[rgba(255,255,255,0.08)] leading-[0.7] block mb-3">
              &ldquo;
            </span>
            <blockquote
              className="font-headline italic text-white leading-[1.35] tracking-[-0.5px] max-w-[620px] mx-auto mb-7"
              style={{ fontSize: "clamp(22px, 3vw, 34px)" }}
            >
              &ldquo;It finally feels like I&apos;m planning a hangout with friends, not managing a
              project.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.pravatar.cc/88?img=25"
                alt="Alex Chen"
                className="w-11 h-11 rounded-full border border-[rgba(255,255,255,0.2)] object-cover"
              />
              <div className="text-left">
                <p className="text-[14px] font-medium text-white">Alex Chen</p>
                <p className="text-[12px] text-[rgba(255,255,255,0.4)]">Chronic over-planner</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── S8: FINAL CTA ── */}
      <section className="max-w-[1200px] mx-auto px-12 py-32 text-center">
        <h2
          className="font-headline italic leading-[0.95] tracking-[-2.5px] mb-6"
          style={{ fontSize: "clamp(48px, 6vw, 80px)" }}
        >
          What are you
          <br />
          waiting for?
        </h2>
        <p className="text-[17px] text-[#5E5E5E] mb-10">
          Make your first plan in two minutes. Free, forever.
        </p>
        <Link href="/signup">
          <Button className="rounded-full bg-[#1C1B1B] text-white text-[17px] font-medium px-11 py-7 shadow-[0_4px_20px_rgba(28,27,27,0.14)] hover:bg-[#2d2d2d]">
            Start planning free →
          </Button>
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[rgba(28,27,27,0.07)]">
        <div className="max-w-[1200px] mx-auto px-12 py-8 flex items-center justify-between">
          <span className="font-headline italic text-[18px] text-[#1C1B1B]">Plans</span>
          <div className="flex gap-7">
            {["Privacy", "Terms", "About"].map((l) => (
              <Link
                key={l}
                href="#"
                className="text-[12px] text-[#5E5E5E] hover:text-[#1C1B1B] transition-colors"
              >
                {l}
              </Link>
            ))}
          </div>
          <span className="text-[12px] text-[#5E5E5E] italic">Made for making plans</span>
        </div>
      </footer>
    </main>
  )
}
