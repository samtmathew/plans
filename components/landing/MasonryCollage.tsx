import Image from "next/image"

interface CollageCard {
  title: string
  meta: string
  imageUrl: string
  aspectClass: string
}

interface MasonryCollageProps {
  cards: CollageCard[]
}

export function MasonryCollage({ cards }: MasonryCollageProps) {
  const col1 = cards.slice(0, 2)
  const col2 = cards.slice(2, 4)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Rotated grid */}
      <div className="absolute inset-0 flex items-center justify-center p-10">
        <div
          className="grid grid-cols-2 gap-4 w-full max-w-lg"
          style={{ transform: "rotate(-5deg) scale(1.1) translateY(40px) translateX(16px)" }}
        >
          {/* Column 1 — shifted up */}
          <div className="flex flex-col gap-4" style={{ marginTop: -64 }}>
            {col1.map((card, i) => (
              <CollageCardItem key={i} card={card} />
            ))}
          </div>
          {/* Column 2 — shifted down */}
          <div className="flex flex-col gap-4" style={{ marginTop: 48 }}>
            {col2.map((card, i) => (
              <CollageCardItem key={i} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* Edge fades */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, var(--plans-surface-lo) 0%, transparent 18%, transparent 82%, var(--plans-surface-lo) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, var(--plans-surface-lo) 0%, transparent 14%, transparent 86%, var(--plans-surface-lo) 100%)",
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

function CollageCardItem({ card }: { card: CollageCard }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(28,27,27,0.08)] transition-transform duration-300 hover:-translate-y-1">
      <div className={`relative w-full ${card.aspectClass}`}>
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          className="object-cover"
          sizes="240px"
          unoptimized
        />
      </div>
      <div className="px-3 py-2.5">
        <p className="font-headline italic text-[17px] text-[#1C1B1B] leading-tight mb-0.5">
          {card.title}
        </p>
        <p className="text-[11px] text-[#5E5E5E]">{card.meta}</p>
      </div>
    </div>
  )
}
