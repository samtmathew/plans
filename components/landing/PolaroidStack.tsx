"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const DEMO_CARDS = [
  {
    id: "back",
    title: "Summer Fest",
    meta: "Aug 12 · 4 going",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=520&q=80&auto=format&fit=crop",
    aspect: "land" as const,
    posClass: "w-64 top-10 right-[-16px] rotate-6",
    hoverClass: "hover:rotate-[8deg] hover:translate-x-1",
    shadow: "shadow-[0_4px_20px_rgba(28,27,27,0.06)]",
    zIndex: "z-10",
  },
  {
    id: "mid",
    title: "Cabin Weekend",
    meta: "Oct 24 · 8 going",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=530&q=80&auto=format&fit=crop",
    aspect: "land" as const,
    posClass: "w-[265px] top-20 right-9 -rotate-3",
    hoverClass: "hover:-rotate-[5deg] hover:-translate-x-2",
    shadow: "shadow-[0_8px_30px_rgba(28,27,27,0.10)]",
    zIndex: "z-20",
  },
  {
    id: "front",
    title: "Sarah's 30th",
    meta: "The Continental, 8pm",
    badge: "This weekend",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=560&q=80&auto=format&fit=crop",
    aspect: "sq" as const,
    posClass: "w-[285px] top-[120px] right-[84px] rotate-[1.5deg]",
    hoverClass: "hover:rotate-0 hover:-translate-y-1",
    shadow: "shadow-[0_14px_44px_rgba(28,27,27,0.14)]",
    zIndex: "z-30",
    avatars: [
      { src: "https://i.pravatar.cc/56?img=47", fallback: "A" },
      { src: "https://i.pravatar.cc/56?img=12", fallback: "B" },
      { src: "https://i.pravatar.cc/56?img=32", fallback: "C" },
    ],
  },
] as const

export function PolaroidStack() {
  return (
    <div className="relative h-[460px] [perspective:1000px] w-full">
      {DEMO_CARDS.map((card) => (
        <div
          key={card.id}
          className={`absolute bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-default ${card.posClass} ${card.hoverClass} ${card.shadow} ${card.zIndex} hover:shadow-[0_14px_44px_rgba(28,27,27,0.14)]`}
        >
          <div className="relative">
            <div className={`relative w-full ${card.aspect === "sq" ? "aspect-square" : "aspect-[4/3]"}`}>
              <Image
                src={card.imageUrl}
                alt={card.title}
                fill
                className="object-cover grayscale-[15%] transition-all duration-300"
                sizes="320px"
                unoptimized
              />
            </div>
            {"avatars" in card && card.avatars && (
              <div className="absolute bottom-2 left-3 flex">
                {card.avatars.map((av, i) => (
                  <Avatar
                    key={i}
                    className="w-7 h-7 border-2 border-white"
                    style={{ marginLeft: i === 0 ? 0 : -8, zIndex: card.avatars.length - i }}
                  >
                    <AvatarImage src={av.src} alt={av.fallback} />
                    <AvatarFallback className="text-[10px] bg-[#F0EDEC]">{av.fallback}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 pb-3.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-headline italic text-[18px] text-[#1C1B1B] leading-tight truncate">
                {card.title}
              </p>
              {"badge" in card && card.badge && (
                <Badge className="text-[10px] font-medium bg-[#3D3D8F] text-white rounded-full shrink-0 px-2 py-0.5 hover:bg-[#3D3D8F]">
                  {card.badge}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#5E5E5E]">{card.meta}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
