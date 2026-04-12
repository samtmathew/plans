import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const geist = localFont({
  src: [
    { path: './fonts/GeistVF.woff', weight: '100 900' },
  ],
  variable: '--font-geist',
})

export const metadata: Metadata = {
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
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  )
}
