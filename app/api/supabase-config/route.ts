import { NextResponse } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export function GET() {
  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.json({ configured: false }, { headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json(
    { configured: true, url: env.url, anonKey: env.anonKey },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
