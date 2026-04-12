'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from '@/components/common/Avatar'
import { Camera, X } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentUrl?: string | null
  name: string
  onUpload: (url: string) => void
}

export function AvatarUpload({ userId, currentUrl, name, onUpload }: AvatarUploadProps) {
  const [url, setUrl] = useState(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setUrl(data.publicUrl)
      onUpload(data.publicUrl)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar url={url} name={name} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center"
          aria-label="Change avatar"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface PhotosUploadProps {
  userId: string
  currentUrls: string[]
  onUpload: (urls: string[]) => void
}

export function PhotosUpload({ userId, currentUrls, onUpload }: PhotosUploadProps) {
  const [urls, setUrls] = useState<string[]>(currentUrls)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (urls.length >= 3) return
    setError(null)
    try {
      const supabase = createClient()
      const slot = urls.length + 1
      const ext = file.name.split('.').pop()
      const path = `${userId}/${slot}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
      const updated = [...urls, data.publicUrl]
      setUrls(updated)
      onUpload(updated)
    } catch {
      setError('Upload failed. Please try again.')
    }
  }

  function removePhoto(index: number) {
    const updated = urls.filter((_, i) => i !== index)
    setUrls(updated)
    onUpload(updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {urls.map((url, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {urls.length < 3 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-foreground transition-colors"
            aria-label="Add photo"
          >
            <Camera className="h-5 w-5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Up to 3 photos</p>
    </div>
  )
}
