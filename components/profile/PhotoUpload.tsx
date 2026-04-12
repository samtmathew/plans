'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from '@/components/common/Avatar'
import { Camera, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Cropper, { Area } from 'react-easy-crop'

interface AvatarUploadProps {
  userId: string
  currentUrl?: string | null
  name: string
  onUpload: (url: string) => void
}

// Helper: convert cropped area to blob
async function getCroppedBlob(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
  const response = await fetch(imageSrc)
  const blob = await response.blob()
  const image = await createImageBitmap(blob)

  const canvas = document.createElement('canvas')
  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}

// Crop dialog component
interface CropDialogProps {
  open: boolean
  imageSrc: string
  shape: 'round' | 'rect'
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

function CropDialog({ open, imageSrc, shape, onConfirm, onCancel }: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setConfirming(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-on-surface">Crop image</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 bg-surface-container rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={shape === 'rect' ? 3 / 1 : 1}
            cropShape={shape}
            showGrid={false}
            onCropChange={setCrop}
            onCropAreaChange={handleCropComplete}
            onZoomChange={setZoom}
            restrictPosition={false}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={confirming}>
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              'Done'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AvatarUpload({ userId, currentUrl, name, onUpload }: AvatarUploadProps) {
  const [url, setUrl] = useState(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.type.split('/')[1] || 'png'
      const path = `${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setUrl(data.publicUrl)
      onUpload(data.publicUrl)
    } catch (err) {
      console.error('[AvatarUpload] upload error:', err)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
  }

  const handleCropConfirm = async (blob: Blob) => {
    const file = new File([blob], `avatar.png`, { type: 'image/png' })
    setCropSrc(null)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    await handleFile(file)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar url={url} name={name} size="xl" />
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Change avatar"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      <CropDialog
        open={!!cropSrc}
        imageSrc={cropSrc || ''}
        shape="round"
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
      {uploading && <p className="text-xs text-on-surface-variant">Uploading…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export interface BannerUploadProps {
  userId: string
  currentUrl?: string | null
  onUpload: (url: string) => void
}

const PASTEL_COLORS = [
  '#FFB3B3', // Soft red/pink
  '#FFD9B3', // Soft orange
  '#FFFFB3', // Soft yellow
  '#B3FFB3', // Soft green
  '#B3D9FF', // Soft blue
  '#E6B3FF', // Soft purple
  '#D9D9D9', // Soft gray
]

export function BannerUpload({ userId, currentUrl, onUpload }: BannerUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.type.split('/')[1] || 'png'
      const path = `${userId}/banner-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
      setUrl(data.publicUrl)
      onUpload(data.publicUrl)
    } catch (err) {
      console.error('[BannerUpload] upload error:', err)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
  }

  const handleCropConfirm = async (blob: Blob) => {
    const file = new File([blob], `banner.png`, { type: 'image/png' })
    setCropSrc(null)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    await handleFile(file)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const selectColor = (color: string) => {
    setUrl(color)
    onUpload(color)
  }

  const isColor = url?.startsWith('#')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Current Banner Preview */}
        {url ? (
          <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-outline-variant shadow-sm transition-all">
            {isColor ? (
              <div className="w-full h-full" style={{ backgroundColor: url }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Cover" className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => { setUrl(null); onUpload('') }}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 hover:scale-105"
              aria-label="Remove cover"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-muted-foreground hover:border-foreground hover:bg-surface-container/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-sm font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Camera className="h-6 w-6 mb-2 text-on-surface-variant" />
                <span className="text-sm font-medium text-on-surface tracking-tight">Upload Cover Image</span>
                <span className="text-xs text-on-surface-variant mt-1">Recommended 3:1 ratio</span>
              </>
            )}
          </button>
        )}
        
        {/* Or choose color */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Or choose a color</p>
          <div className="flex gap-3 flex-wrap">
            {PASTEL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => selectColor(color)}
                className={`h-8 w-8 rounded-full border border-black/10 transition-all hover:scale-110 shadow-sm ${url === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      <CropDialog
        open={!!cropSrc}
        imageSrc={cropSrc || ''}
        shape="rect"
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  )
}
