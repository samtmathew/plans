'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'

interface CopyLinkProps {
  url: string
}

export function CopyLink({ url }: CopyLinkProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <label className="micro-label block mb-2">Join Link</label>
        <Input
          value={url}
          readOnly
          className="text-sm text-on-surface-variant border-0 border-b bg-transparent px-0 py-2 font-sans outline-none"
        />
      </div>
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={handleCopy}
        aria-label="Copy join link"
        className="mt-6"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
