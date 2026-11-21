import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { BrowseState } from '@/components/BrowseState'
import { ShellFrame } from '@/components/ShellFrame'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null

  return (
    <BrowseState>
      <Suspense fallback={<div className="p-6 text-sm text-muted">加载…</div>}>
        <ShellFrame email={user?.email ?? null}>{children}</ShellFrame>
      </Suspense>
    </BrowseState>
  )
}
