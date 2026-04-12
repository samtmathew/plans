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
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92)
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
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
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
      const ext = file.type.split('/')[1] || 'jpg'
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
    const file = new File([blob], `avatar.jpg`, { type: 'image/jpeg' })
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
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (urls.length >= 3) return
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const slot = urls.length + 1
      const ext = file.type.split('/')[1] || 'jpg'
      const path = `${userId}/${slot}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
      const updated = [...urls, data.publicUrl]
      setUrls(updated)
      onUpload(updated)
    } catch (err) {
      console.error('[PhotosUpload] upload error:', err)
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
    const file = new File([blob], `photo.jpg`, { type: 'image/jpeg' })
    setCropSrc(null)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    await handleFile(file)
  }

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
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
          <div key={i} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
            disabled={uploading}
            className="relative h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-foreground transition-colors disabled:opacity-50"
            aria-label="Add photo"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
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
        shape="rect"
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Up to 3 photos</p>
    </div>
  )
}
