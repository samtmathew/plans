import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function JoinCardPreview() {
  return (
    <div className="relative">
      {/* WhatsApp badge */}
      <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1.5 bg-[#25D366] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(37,211,102,0.35)]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Shared in chat
      </div>

      {/* Card */}
      <div className="w-[300px] bg-white rounded-2xl shadow-[0_14px_44px_rgba(28,27,27,0.14)] overflow-hidden">
        <div className="relative aspect-video w-full">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80&auto=format&fit=crop"
            alt="Lake District Weekend"
            fill
            className="object-cover grayscale-[20%]"
            sizes="300px"
            unoptimized
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="https://i.pravatar.cc/48?img=47" alt="Alex" />
              <AvatarFallback className="text-[8px]">A</AvatarFallback>
            </Avatar>
            <span className="text-[12px] text-[#5E5E5E]">by Alex</span>
          </div>

          <h3 className="font-headline italic text-[22px] text-[#1C1B1B] leading-tight mb-1">
            Lake District Weekend
          </h3>

          <p className="text-[13px] text-[#5E5E5E] mb-1">📅 Apr 5–7, 2025</p>

          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {["12", "25", "30"].map((id, i) => (
                <Avatar
                  key={id}
                  className="w-5 h-5 border-[1.5px] border-white"
                  style={{ marginLeft: i === 0 ? 0 : -5 }}
                >
                  <AvatarImage src={`https://i.pravatar.cc/40?img=${id}`} alt="" />
                  <AvatarFallback className="text-[8px]">?</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[13px] text-[#5E5E5E]">8 going</span>
          </div>

          <p className="text-[13px] font-semibold text-[#1C1B1B] mb-4">~£120 per person</p>

          <Button className="w-full rounded-full bg-[#1C1B1B] text-white hover:bg-[#2d2d2d] font-medium">
            I&apos;m in →
          </Button>
        </div>
      </div>
    </div>
  )
}
