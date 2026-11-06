import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type ConfigResponse = {
  configured?: boolean
  url?: string
  anonKey?: string
}

let clientPromise: Promise<SupabaseClient | null> | null = null

export async function getBrowserClient() {
  if (clientPromise) return clientPromise
  const pending = loadBrowserClient()
  clientPromise = pending
  const client = await pending
  if (!client) clientPromise = null
  return client
}

async function loadBrowserClient() {
  const response = await fetch('/api/supabase-config', { cache: 'no-store' })
  if (!response.ok) return null
  const body = (await response.json()) as ConfigResponse
  if (!body.configured || !body.url || !body.anonKey) return null
  return createBrowserClient(body.url, body.anonKey)
}
