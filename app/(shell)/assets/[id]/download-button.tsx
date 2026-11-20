'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { primaryButtonClass } from '@/components/styles'

export function DownloadButton({ assetId, disabled, className }: { assetId: string; disabled: boolean; className?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onClick() {
    setPending(true)
    setError(null)
    const response = await fetch(`/api/assets/${assetId}/download`, { method: 'POST' })
    const body = (await response.json()) as { url?: string; error?: string }
    if (response.status === 401) {
      window.location.href = '/login'
      return
    }
    if (!response.ok || !body.url) {
      setError(body.error ?? '下载失败')
      setPending(false)
      return
    }
    const link = document.createElement('a')
    link.href = body.url
    link.rel = 'noreferrer'
    link.target = '_blank'
    link.click()
    router.refresh()
    setPending(false)
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={disabled || pending} className={className ?? primaryButtonClass}>
        {pending ? '准备下载…' : '下载'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
