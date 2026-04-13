import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import type { PlanAttendee, PlanItem } from '@/types'

export const runtime = 'nodejs'
export const alt = 'Plan Preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadFont(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const filename = weight === 700 ? 'SpaceGrotesk-Bold.woff' : 'SpaceGrotesk-Regular.woff'
    const fontPath = path.join(process.cwd(), 'public', 'fonts', filename)
    const buffer = await readFile(fontPath)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  } catch {
    return null
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return `$${Math.round(amount)}`
}

export default async function OGImage({
  params,
}: {
  params: { join_token: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: plan } = await supabase
    .from('plans')
    .select(
      '*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*), items:plan_items(*)'
    )
    .eq('join_token', params.join_token)
    .single()

  const [fontRegular, fontBold] = await Promise.all([loadFont(400), loadFont(700)])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fonts: any[] = []
  if (fontRegular) fonts.push({ name: 'Space Grotesk', data: fontRegular, weight: 400 })
  if (fontBold) fonts.push({ name: 'Space Grotesk', data: fontBold, weight: 700 })

  const fontFamily = fonts.length > 0 ? 'Space Grotesk' : 'system-ui'

  // Fallback card when plan not found
  if (!plan || plan.deleted_at) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
            fontFamily,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: 'rgba(18,18,18,0.5)',
              letterSpacing: '-0.04em',
            }}
          >
            Plans
          </div>
        </div>
      ),
      { ...size, fonts }
    )
  }

  const approvedAttendees = ((plan.attendees as PlanAttendee[]) ?? []).filter(
    (a) => a.status === 'approved'
  )
  const planItems = (plan.items as PlanItem[]) ?? []
  const costPerPerson = calcEstimatedPerPerson(planItems, approvedAttendees.length)
  const attendeeCount = approvedAttendees.length
  const organiserName = (plan.organiser as { name?: string })?.name ?? ''
  const organiserAvatar = (plan.organiser as { avatar_url?: string })?.avatar_url ?? null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: 'white',
          padding: '96px',
          position: 'relative',
          fontFamily,
        }}
      >
        {/* Background watermark */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 384,
              fontWeight: 700,
              color: 'rgba(18,18,18,0.03)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            Plans
          </span>
        </div>

        {/* Top label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.2em',
              color: 'rgba(18,18,18,0.4)',
              textTransform: 'uppercase',
            }}
          >
            Itinerary
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '800px',
            position: 'relative',
          }}
        >
          <h1
            style={{
              fontSize: plan.title.length > 30 ? 72 : 96,
              fontWeight: 700,
              color: '#121212',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: plan.description ? 32 : 0,
            }}
          >
            {plan.title}
          </h1>
          {plan.description && (
            <p
              style={{
                fontSize: 24,
                fontWeight: 400,
                color: 'rgba(18,18,18,0.5)',
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '700px',
                // clamp to 2 lines roughly
                display: '-webkit-box',
                overflow: 'hidden',
              }}
            >
              {plan.description.length > 120
                ? plan.description.slice(0, 120) + '…'
                : plan.description}
            </p>
          )}
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(229,231,235,0.3)',
            paddingTop: 48,
            position: 'relative',
          }}
        >
          {/* Metadata pills */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {attendeeCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, color: 'rgba(18,18,18,0.4)' }}>●</span>
                <span
                  style={{ fontSize: 18, fontWeight: 500, color: '#121212' }}
                >
                  {attendeeCount} going
                </span>
              </div>
            )}
            {costPerPerson > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, color: 'rgba(18,18,18,0.4)' }}>●</span>
                <span
                  style={{ fontSize: 18, fontWeight: 500, color: '#121212' }}
                >
                  {formatCurrency(costPerPerson)} pp
                </span>
              </div>
            )}
          </div>

          {/* Organiser */}
          {organiserName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {organiserAvatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={organiserAvatar}
                  width={32}
                  height={32}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    filter: 'grayscale(100%)',
                  }}
                  alt=""
                />
              )}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'rgba(18,18,18,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}
              >
                {organiserName}
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
