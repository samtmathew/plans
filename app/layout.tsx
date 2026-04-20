import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'

const DeploymentBanner = dynamic(() => import('@/components/DeploymentBanner'), { ssr: false })

const geist = localFont({
  src: [{ path: './fonts/GeistVF.woff', weight: '100 900' }],
  variable: '--font-geist',
})

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://plans-kappa-mocha.vercel.app'),
  title: 'Plans',
  description: 'Organise group trips and outings — itineraries, costs, and attendees in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${instrumentSerif.variable} ${dmSans.variable} font-sans antialiased`}
        style={{ background: 'var(--bg)' }}
      >
        {children}
        <DeploymentBanner />
      </body>
    </html>
  )
}
