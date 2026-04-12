import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface overflow-hidden">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Top-right radial gradient */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--surface-container-high), transparent)',
            filter: 'blur(80px)',
          }}
        />
        {/* Bottom-left radial gradient */}
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--surface-container-low), transparent)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 navbar-glass">
        <div className="px-6 md:px-8 py-6 max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold font-headline tracking-tighter text-on-surface">
            Plans
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#explore"
              className="text-on-surface-variant hover:text-on-surface transition-colors font-headline text-sm tracking-tight"
            >
              Explore
            </a>
            <a
              href="#curation"
              className="text-on-surface-variant hover:text-on-surface transition-colors font-headline text-sm tracking-tight"
            >
              Curation
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-8 pt-24 pb-12 md:pb-24 text-center">
        <div className="max-w-4xl space-y-12 md:space-y-16">
          {/* Abstract line art */}
          <div
            className="mx-auto max-w-xs h-0.5 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--outline-variant) 50%, transparent)',
            }}
          />

          {/* Hero headline */}
          <h1 className="font-headline text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-bold tracking-tighter leading-[0.9] text-balance">
            Structure{' '}
            <span className="block">for the</span>{' '}
            <span className="block italic font-light opacity-60">unstructured.</span>
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-on-surface-variant font-light tracking-wide max-w-md mx-auto">
            Bespoke travel logistics for those who value the journey over the itinerary.
          </p>

          {/* CTA Button */}
          <div className="pt-4 md:pt-8">
            <Button asChild size="lg" className="uppercase tracking-[0.2em] px-10 py-6 text-sm font-medium rounded-[2px]">
              <Link href="/signup">Start Planning</Link>
            </Button>
          </div>

          {/* Abstract line art */}
          <div
            className="mx-auto max-w-xs h-0.5 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--outline-variant) 50%, transparent)',
            }}
          />
        </div>
      </main>

      {/* Feature Grid Section */}
      <section className="bg-surface-container-low py-24 md:py-32 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-24">
            {/* Feature 1 */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-on-surface">
                01 / Intent
              </span>
              <h3 className="font-headline text-2xl md:text-3xl font-semibold">Tonal Depth</h3>
              <p className="text-xs md:text-sm leading-relaxed text-on-surface-variant font-medium opacity-80">
                A minimalist approach to travel design that prioritizes emotional resonance and architectural clarity over bulk data.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-on-surface">
                02 / Curation
              </span>
              <h3 className="font-headline text-2xl md:text-3xl font-semibold">The Edit</h3>
              <p className="text-xs md:text-sm leading-relaxed text-on-surface-variant font-medium opacity-80">
                Every recommendation is a curated artifact, selected for its soul and its contribution to the overall canvas of your trip.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-on-surface">
                03 / Flow
              </span>
              <h3 className="font-headline text-2xl md:text-3xl font-semibold">Quiet Power</h3>
              <p className="text-xs md:text-sm leading-relaxed text-on-surface-variant font-medium opacity-80">
                Experience an interface that disappears, leaving only your aspirations and the open road. No noise. No friction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Signature / Quote Section */}
      <section className="bg-surface py-24 md:py-32 px-6 md:px-8 border-y border-outline-variant/10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block p-4 border border-outline-variant/20 rounded-[12px] mb-12">
            <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center">
              <span className="text-2xl">◉</span>
            </div>
          </div>
          <h2 className="font-headline text-3xl md:text-4xl font-light italic leading-snug tracking-tight">
            &quot;Travel is the only thing you buy that makes you richer.&quot;
          </h2>
          <p className="mt-8 text-[10px] tracking-[0.4em] uppercase text-on-surface-variant font-medium">
            The Boutique Manifesto
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-low py-12 px-6 md:px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
          <div className="font-bold font-headline text-on-surface">Plans</div>
          <div className="flex gap-6 md:gap-8">
            <a
              href="#"
              className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors opacity-80"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors opacity-80 underline underline-offset-4"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors opacity-80"
            >
              Support
            </a>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-80">
            © Plans Boutique Travel
          </div>
        </div>
      </footer>
    </div>
  )
}
