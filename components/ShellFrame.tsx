'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { uploadHref } from '@/lib/browse'
import { signOut } from '@/app/(shell)/actions'
import { BrandMark } from '@/components/BrandMark'
import { SearchBar } from '@/components/SearchBar'
import { Sidebar } from '@/components/Sidebar'
import { primaryButtonClass, quietButtonClass } from '@/components/styles'

export function ShellFrame({ email, children }: { email: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [desktop, setDesktop] = useState(false)
  const pathname = usePathname()
  const params = useSearchParams()
  const onUpload = pathname === '/upload'
  const uploadTo = uploadHref(params.get('category'))

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => setDesktop(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const drawerHidden = !desktop && !open

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-ink">
      {open ? (
        <button type="button" className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="关闭导航" onClick={() => setOpen(false)} />
      ) : null}
      <div
        id="library-nav"
        inert={drawerHidden}
        aria-hidden={drawerHidden}
        className={`fixed inset-y-0 left-0 z-40 w-[240px] shrink-0 border-r border-line bg-white transition-transform duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Suspense fallback={<aside className="h-full bg-white" />}>
          <Sidebar onNavigate={() => setOpen(false)} />
        </Suspense>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-line bg-white">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-mist"
                aria-label={open ? '关闭导航' : '打开导航'}
                aria-expanded={open}
                aria-controls="library-nav"
                onClick={() => setOpen((value) => !value)}
              >
                <MenuIcon />
              </button>
              <Link href="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
                <BrandMark className="h-8 w-8 shrink-0" />
                <span className="truncate text-sm font-semibold">设计资产库</span>
              </Link>
            </div>
            <div className="order-last w-full lg:order-none lg:w-[min(520px,100%)]">
              <SearchBar />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <Link href={uploadTo} aria-current={onUpload ? 'page' : undefined} className={`${primaryButtonClass} whitespace-nowrap`}>
                上传
              </Link>
              {email ? (
                <span className="hidden max-w-40 truncate text-sm text-muted md:inline" title={email}>
                  {email}
                </span>
              ) : null}
              <form action={signOut}>
                <button type="submit" className={quietButtonClass}>
                  退出
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className={`min-h-0 min-w-0 flex-1 ${open ? 'overflow-hidden' : 'overflow-auto'}`}>
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
