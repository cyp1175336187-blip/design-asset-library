'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useBrowseQuery } from '@/components/BrowseState'

export function SearchBar() {
  const { query, setQuery } = useBrowseQuery()
  const pathname = usePathname()
  const router = useRouter()
  const composing = useRef(false)
  const leaving = useRef(false)
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === '/') {
      leaving.current = false
    }
  }, [pathname])

  function update(next: string) {
    setQuery(next)
    if (pathname !== '/' && !leaving.current) {
      leaving.current = true
      router.push('/')
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    if (composing.current) {
      setDraft(next)
      return
    }
    setDraft(null)
    update(next)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDraft(null)
    update(draft ?? query)
  }

  return (
    <form onSubmit={onSubmit} className="w-full" role="search">
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-4 w-4">
            <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.5 12.5 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <input
          aria-label="搜索标题、标签或描述"
          value={draft ?? query}
          onChange={onChange}
          onCompositionStart={() => {
            composing.current = true
            setDraft(query)
          }}
          onCompositionEnd={(event) => {
            composing.current = false
            setDraft(null)
            update(event.currentTarget.value)
          }}
          placeholder="搜索标题、标签或描述"
          className="h-10 w-full rounded-full bg-mist pr-4 pl-10 text-sm text-ink placeholder:text-neutral-400"
        />
      </div>
    </form>
  )
}
