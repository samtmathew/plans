import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { calcEstimatedPerPerson } from '@/lib/utils/cost'
import type { PlanAttendee, PlanItem } from '@/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const alt = 'Plan Preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
  const [instrumentItalic, dmSans] = await Promise.all([
    fetch(new URL('../../fonts/InstrumentSerif-Italic.woff', import.meta.url)).then(
      (r) => r.arrayBuffer()
    ),
    fetch(new URL('../../fonts/DMSans-Regular.woff', import.meta.url)).then((r) =>
      r.arrayBuffer()
    ),
  ])

  const BG = '#FCF9F8'
  const INK = '#1C1B1B'
  const MUTE = '#5E5E5E'
  const ACCENT = '#3D3D8F'
  const DIVIDER = '#C7C5D3'

  const baseFonts = [
    { name: 'Instrument Serif', data: instrumentItalic, style: 'italic' as const, weight: 400 as const },
    { name: 'DM Sans', data: dmSans, style: 'normal' as const, weight: 400 as const },
  ]

  let plan: {
    title: string
    description: string | null
    deleted_at: string | null
    organiser: { name?: string; avatar_url?: string } | null
    attendees: PlanAttendee[] | null
    items: PlanItem[] | null
  } | null = null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('plans')
      .select(
        '*, organiser:profiles!organiser_id(*), attendees:plan_attendees(*), items:plan_items(*)'
      )
      .eq('join_token', params.join_token)
      .single()
    plan = data
  } catch {
    plan = null
  }

  if (!plan || plan.deleted_at) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Instrument Serif',
            fontStyle: 'italic',
            fontSize: 220,
            color: INK,
          }}
        >
          Plans
        </div>
      ),
      { ...size, fonts: baseFonts }
    )
  }

  const approvedAttendees = (plan.attendees ?? []).filter((a) => a.status === 'approved')
  const planItems = plan.items ?? []
  const costPerPerson = calcEstimatedPerPerson(planItems, approvedAttendees.length)
  const attendeeCount = approvedAttendees.length
  const organiserName = plan.organiser?.name ?? ''

  const title = plan.title
  const titleSize = title.length > 40 ? 92 : title.length > 24 ? 120 : 148

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: BG,
          padding: 72,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          fontFamily: 'DM Sans',
          color: INK,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.05,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontSize: 380,
              lineHeight: 1,
              color: INK,
            }}
          >
            Plans
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: 18,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: ACCENT,
            }}
          >
            Itinerary
          </span>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: MUTE,
            }}
          >
            plans.app
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontSize: titleSize,
              lineHeight: 1.04,
              letterSpacing: -2,
              color: INK,
            }}
          >
            {title}
          </div>
          {plan.description && (
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.3,
                color: MUTE,
                marginTop: 20,
                maxWidth: 900,
                display: 'flex',
              }}
            >
              {plan.description.length > 110
                ? plan.description.slice(0, 110) + '…'
                : plan.description}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${DIVIDER}`,
            paddingTop: 28,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {attendeeCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: ACCENT,
                    borderRadius: 999,
                    display: 'flex',
                  }}
                />
                <span style={{ fontSize: 20, color: INK }}>
                  {attendeeCount} going
                </span>
              </div>
            )}
            {costPerPerson > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: ACCENT,
                    borderRadius: 999,
                    display: 'flex',
                  }}
                />
                <span style={{ fontSize: 20, color: INK }}>
                  {formatCurrency(costPerPerson)} pp
                </span>
              </div>
            )}
          </div>

          {organiserName && (
            <span
              style={{
                fontSize: 14,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: MUTE,
              }}
            >
              by {organiserName}
            </span>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: baseFonts }
  )
}
