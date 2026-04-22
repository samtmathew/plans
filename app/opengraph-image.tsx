import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Plans — organise group trips & outings'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const instrumentItalic = readFileSync(
  path.join(process.cwd(), 'app/fonts/InstrumentSerif-Italic.woff')
)
const dmSans = readFileSync(path.join(process.cwd(), 'app/fonts/DMSans-Regular.woff'))

export default async function Image() {

  const BG = '#FCF9F8'
  const INK = '#1C1B1B'
  const MUTE = '#5E5E5E'
  const ACCENT = '#3D3D8F'
  const DIVIDER = '#C7C5D3'

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
              fontFamily: 'DM Sans',
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
              fontFamily: 'DM Sans',
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
            maxWidth: 980,
          }}
        >
          <div
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontSize: 124,
              lineHeight: 1.04,
              color: INK,
              letterSpacing: -2,
            }}
          >
            Plan it. Share it. Show up.
          </div>
          <div
            style={{
              fontFamily: 'DM Sans',
              fontSize: 28,
              lineHeight: 1.3,
              color: MUTE,
              marginTop: 20,
              maxWidth: 820,
            }}
          >
            Itineraries, costs, and attendees — one warm little place.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${DIVIDER}`,
            paddingTop: 32,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontFamily: 'DM Sans',
              fontSize: 20,
              color: INK,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: ACCENT,
                borderRadius: 999,
                display: 'flex',
              }}
            />
            Group trips, organised.
          </div>
          <span
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontSize: 40,
              color: INK,
            }}
          >
            Plans
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Instrument Serif',
          data: instrumentItalic,
          style: 'italic',
          weight: 400,
        },
        { name: 'DM Sans', data: dmSans, style: 'normal', weight: 400 },
      ],
    }
  )
}
