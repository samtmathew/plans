import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export interface MasonryCardData {
  title: string
  imageUrl: string
  aspectClass: string
  date?: string
  costPerPerson?: string
  rotateClass: string
  avatars?: { src: string; fallback: string }[]
}

export function MasonryPlanCard({ card }: { card: MasonryCardData }) {
  return (
    <div
      className={`break-inside-avoid mb-4 bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(28,27,27,0.06)] cursor-pointer transition-all duration-200 ${card.rotateClass} hover:rotate-0 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(28,27,27,0.10)]`}
    >
      <div className={`relative w-full ${card.aspectClass}`}>
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          className="object-cover grayscale-[15%] transition-all duration-200 hover:grayscale-0"
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
        />
      </div>
      <div className="px-3 py-2.5">
        <p className="font-headline italic text-[15px] text-[#1C1B1B] mb-1.5 leading-tight">
          {card.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {card.avatars && card.avatars.length > 0 && (
            <div className="flex">
              {card.avatars.slice(0, 4).map((av, i) => (
                <Avatar
                  key={i}
                  className="w-[18px] h-[18px] border-[1.5px] border-white"
                  style={{ marginLeft: i === 0 ? 0 : -5, zIndex: card.avatars!.length - i }}
                >
                  <AvatarImage src={av.src} alt={av.fallback} />
                  <AvatarFallback className="text-[8px]">{av.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          {card.date && (
            <span className="text-[11px] text-[#5E5E5E]">{card.date}</span>
          )}
          {card.costPerPerson && (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-[#3D3D8F] border-[rgba(61,61,143,0.2)] bg-[rgba(61,61,143,0.06)] rounded-full px-2 py-0"
            >
              {card.costPerPerson}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
