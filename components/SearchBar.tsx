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
    <form onSubmit={onSubmit} className="min-w-0 flex-1" role="search">
      <input
        id="asset-search"
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
        className="w-full border px-3 py-2 text-sm"
      />
    </form>
  )
}
