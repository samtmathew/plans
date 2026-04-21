'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'

const AVATAR_BGS = ['#E5D5C3','#C4CFEA','#EEB5B5','#B8D4C6','#F5D78A','#D0C5E5','#F4B8A3','#BFD4A3']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_BGS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = name.trim().split(/\s+/).map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '·'

  async function finish() {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }

    const { error: upsertErr } = await supabase.from('profiles').upsert({
      id: user.id,
      name: name.trim(),
      bio: bio.trim() || null,
      date_of_birth: dob || null,
      gender: gender || null,
      avatar_color: avatarColor,
    })
    if (upsertErr) { setError(upsertErr.message); setSaving(false); return }
    router.push('/home')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-4 py-8">
      {/* Top bar */}
      <div className="w-full max-w-[440px] flex items-center justify-between mb-8">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="p-2 rounded-full hover:bg-[var(--plans-surface)] transition-colors text-[var(--plans-text-2)]"
          style={{ visibility: step > 1 ? 'visible' : 'hidden' }}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: n === step ? 24 : 6, background: n === step ? 'var(--plans-text)' : 'var(--plans-divider)' }}
            />
          ))}
        </div>
        <div className="w-8" />
      </div>

      <div className="w-full max-w-[440px] space-y-8">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)] mb-2">Step 1 of 3</p>
              <h1 className="font-headline italic text-4xl text-[var(--plans-text)]">What should we call you?</h1>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="border-0 border-b bg-transparent px-0 py-2 text-[26px] font-headline text-[var(--plans-text)] placeholder:text-[var(--plans-text-2)]/40 focus-visible:ring-0 rounded-none"
            />
            <Button
              className="w-full rounded-full"
              disabled={name.trim().length < 2}
              onClick={() => setStep(2)}
              type="button"
            >
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2: About you */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)] mb-2">Step 2 of 3</p>
              <h1 className="font-headline italic text-4xl text-[var(--plans-text)]">Tell us about you.</h1>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--plans-text-2)] block mb-1">Date of birth</label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="border-0 border-b bg-transparent px-0 py-1.5 text-sm text-[var(--plans-text)] focus-visible:ring-0 rounded-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--plans-text-2)] block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border-0 border-b border-[var(--plans-divider)] bg-transparent py-1.5 text-sm text-[var(--plans-text)] focus:outline-none"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="nonbinary">Non-binary</option>
                </select>
              </div>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A sentence about yourself…"
              rows={3}
              className="border-0 border-b bg-transparent px-0 py-2 text-sm text-[var(--plans-text)] placeholder:text-[var(--plans-text-2)]/40 focus-visible:ring-0 rounded-none resize-none"
            />
            <Button className="w-full rounded-full" onClick={() => setStep(3)} type="button">
              Continue →
            </Button>
          </div>
        )}

        {/* Step 3: Colour */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-[var(--plans-text-2)] mb-2">Step 3 of 3</p>
              <h1 className="font-headline italic text-4xl text-[var(--plans-text)]">Your look.</h1>
            </div>
            {/* Avatar preview */}
            <div className="flex justify-center">
              <div
                className="h-[88px] w-[88px] rounded-full flex items-center justify-center font-headline italic text-2xl ring-4 ring-white shadow-md"
                style={{ background: avatarColor, color: '#2E2E2E' }}
              >
                {initials}
              </div>
            </div>
            {/* Colour swatches */}
            <div className="flex justify-center gap-2 flex-wrap">
              {AVATAR_BGS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className="h-8 w-8 rounded-full transition-all duration-150 hover:scale-110"
                  style={{
                    background: color,
                    transform: avatarColor === color ? 'scale(1.2)' : undefined,
                    boxShadow: avatarColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : undefined,
                  }}
                />
              ))}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button className="w-full rounded-full" onClick={finish} disabled={saving} type="button">
              {saving ? 'Saving…' : 'Enter Plans'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
