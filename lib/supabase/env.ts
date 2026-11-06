export type SupabaseEnv = {
  url: string
  anonKey: string
}

function readEnv(name: string) {
  const value = process.env[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL') ?? readEnv('SUPABASE_URL')
  const anonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? readEnv('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return null
  return { url, anonKey }
}
