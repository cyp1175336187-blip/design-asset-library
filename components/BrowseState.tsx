'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type BrowseQuery = {
  query: string
  setQuery: (query: string) => void
}

const BrowseQueryContext = createContext<BrowseQuery | null>(null)

export function BrowseState({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const value = useMemo(() => ({ query, setQuery }), [query])
  return <BrowseQueryContext.Provider value={value}>{children}</BrowseQueryContext.Provider>
}

export function useBrowseQuery() {
  const value = useContext(BrowseQueryContext)
  if (!value) {
    throw new Error('useBrowseQuery must be used within BrowseState')
  }
  return value
}
