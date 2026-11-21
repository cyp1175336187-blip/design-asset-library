'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { BrandMark } from '@/components/BrandMark'
import { browseHref, uploadHref } from '@/lib/browse'
import { taxonomy, type Category } from '@/lib/taxonomy'

function initialOpenNodes() {
  const open: Record<string, boolean> = {}
  const visit = (categories: Category[]) => {
    for (const category of categories) {
      if (category.children?.length) {
        open[category.id] = true
        visit(category.children)
      }
    }
  }
  for (const section of taxonomy) {
    visit(section.categories)
  }
  return open
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const params = useSearchParams()
  const pathname = usePathname()
  const current = params.get('category')
  const browsing = pathname === '/'
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(taxonomy.map((section) => [section.id, true])),
  )
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>(initialOpenNodes)

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="px-4 pb-2 pt-4">
        <Link href={browseHref({})} onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="text-[15px] font-semibold tracking-tight">设计资产库</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-8" aria-label="分类">
        <Link
          href={browseHref({})}
          onClick={onNavigate}
          className={rowClass(browsing && !current)}
          aria-current={browsing && !current ? 'page' : undefined}
        >
          <GridIcon />
          全部
        </Link>
        <Link
          href={uploadHref(current)}
          onClick={onNavigate}
          className={`${rowClass(pathname === '/upload')} mt-1`}
          aria-current={pathname === '/upload' ? 'page' : undefined}
        >
          <PlusIcon />
          上传
        </Link>
        {taxonomy.map((section) => {
          const open = openSections[section.id] ?? true
          return (
            <section key={section.id} className="mt-6">
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    [section.id]: !open,
                  }))
                }
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium text-ink hover:bg-mist"
              >
                {section.name}
                <Chevron open={open} />
              </button>
              {open ? (
                <ul className="mt-1">
                  {section.categories.map((category) => (
                    <CategoryBranch
                      key={category.id}
                      category={category}
                      current={current}
                      openNodes={openNodes}
                      onNavigate={onNavigate}
                      onToggle={(id) =>
                        setOpenNodes((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          )
        })}
      </nav>
    </aside>
  )
}

function CategoryBranch({
  category,
  current,
  openNodes,
  onNavigate,
  onToggle,
}: {
  category: Category
  current: string | null
  openNodes: Record<string, boolean>
  onNavigate?: () => void
  onToggle: (id: string) => void
}) {
  const hasChildren = Boolean(category.children?.length)
  const open = openNodes[category.id] ?? false
  const active = current === category.id
  const branch = Boolean(current && !active && containsCategory(category, current))

  return (
    <li className="my-0.5">
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? '收起' : '展开'}${category.name}`}
            onClick={() => onToggle(category.id)}
            className="inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-mist hover:text-ink"
          >
            <Chevron open={open} />
          </button>
        ) : (
          <span className="w-7 shrink-0" />
        )}
        <Link
          href={browseHref({ categoryId: category.id })}
          onClick={onNavigate}
          className={itemClass(active, branch)}
          aria-current={active ? 'page' : undefined}
        >
          {category.name}
        </Link>
      </div>
      {hasChildren && open ? (
        <ul className="ml-3.5 border-l border-line pl-1">
          {category.children?.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              current={current}
              openNodes={openNodes}
              onNavigate={onNavigate}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function containsCategory(category: Category, id: string): boolean {
  if (category.id === id) return true
  return category.children?.some((child) => containsCategory(child, id)) ?? false
}

function rowClass(active: boolean) {
  return `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${active ? 'bg-mist font-medium text-ink' : 'text-neutral-700 hover:bg-mist'}`
}

function itemClass(active: boolean, branch: boolean) {
  const tone = active ? 'bg-mist font-medium text-ink' : branch ? 'font-medium text-ink hover:bg-mist' : 'text-neutral-700 hover:bg-mist'
  return `block min-w-0 flex-1 rounded-lg px-2 py-1.5 text-sm ${tone}`
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 text-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-90' : ''}`} aria-hidden="true">
      <path d="M6 3.5 11 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path d="M8 3.25v9.5M3.25 8h9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
