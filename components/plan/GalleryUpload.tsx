'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface GalleryUploadProps {
  userId: string
  currentUrls?: string[]
  onChange: (urls: string[]) => void
  maxPhotos?: number
}

export function GalleryUpload({
  userId,
  currentUrls = [],
  onChange,
  maxPhotos = 10,
}: GalleryUploadProps) {
  const [urls, setUrls] = useState<string[]>(currentUrls)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    const remaining = maxPhotos - urls.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setError(null)
    setUploading(true)
    const uploaded: string[] = []

    try {
      const supabase = createClient()
      for (const file of toUpload) {
        const ext = file.name.split('.').pop()
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('plan-gallery')
          .upload(path, file, { upsert: true })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('plan-gallery').getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }
      const updated = [...urls, ...uploaded]
      setUrls(updated)
      onChange(updated)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function remove(index: number) {
    const updated = urls.filter((_, i) => i !== index)
    setUrls(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow hover:bg-background transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {urls.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {urls.length}/{maxPhotos} photos · select multiple at once
      </p>
    </div>
  )
}
