import type { ReactNode } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/(shell)/actions'
import { BrowseState } from '@/components/BrowseState'
import { SearchBar } from '@/components/SearchBar'
import { Sidebar } from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const user = supabase ? (await supabase.auth.getUser()).data.user : null

  return (
    <BrowseState>
      <div className="flex h-screen">
        <Suspense fallback={<aside className="h-full w-64 shrink-0 border-r p-4">加载分类…</aside>}>
          <Sidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-4 border-b p-4">
            <div role="img" aria-label="Logo 占位" className="flex h-10 w-16 shrink-0 items-center justify-center border text-xs">
              Logo
            </div>
            <SearchBar />
            <Link href="/upload" className="shrink-0 text-sm">
              上传
            </Link>
            {user?.email ? <span className="hidden max-w-40 truncate text-sm text-neutral-600 sm:inline">{user.email}</span> : null}
            <form action={signOut}>
              <button type="submit" className="shrink-0 text-sm">
                退出
              </button>
            </form>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        </div>
      </div>
    </BrowseState>
  )
}
