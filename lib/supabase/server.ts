import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase/env'

export type AuthedClient = {
  supabase: SupabaseClient
  userId: string
}

export async function requireUser(): Promise<{ ok: true; auth: AuthedClient } | { ok: false; error: string; status: number }> {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: '尚未配置 Supabase', status: 503 }
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { ok: false, error: '未登录', status: 401 }
  return { ok: true, auth: { supabase, userId: data.user.id } }
}

export async function createClient() {
  const cookieStore = await cookies()
  const env = getSupabaseEnv()
  if (!env) return null

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the session.
        }
      },
    },
  })
}
