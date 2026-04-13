import type { Metadata } from 'next'
import localFont from 'next/font/local'
import dynamic from 'next/dynamic'
import './globals.css'

const DeploymentBanner = dynamic(() => import('@/components/DeploymentBanner'), { ssr: false })

const geist = localFont({
  src: [
    { path: './fonts/GeistVF.woff', weight: '100 900' },
  ],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://plans-kappa-mocha.vercel.app'),
  title: 'Plans',
  description: 'Organise group trips and outings — itineraries, costs, and attendees in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>{children}<DeploymentBanner /></body>
    </html>
  )
}
