'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { browseHref } from '@/lib/browse'
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

export function Sidebar() {
  const params = useSearchParams()
  const current = params.get('category')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(taxonomy.map((section) => [section.id, true])),
  )
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>(initialOpenNodes)

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r p-4">
      <Link
        href={browseHref({})}
        className={itemClass(!current)}
        aria-current={!current ? 'page' : undefined}
      >
        全部
      </Link>
      {taxonomy.map((section) => {
        const open = openSections[section.id] ?? true
        return (
          <section key={section.id} className="mt-4">
            <button
              type="button"
              aria-expanded={open}
              onClick={() =>
                setOpenSections((prev) => ({
                  ...prev,
                  [section.id]: !open,
                }))
              }
              className="flex w-full items-center justify-between border-b py-2 text-left text-sm font-semibold"
            >
              {section.name}
              <span aria-hidden="true">{open ? '▾' : '▸'}</span>
            </button>
            {open ? (
              <ul className="py-1">
                {section.categories.map((category) => (
                  <CategoryBranch
                    key={category.id}
                    category={category}
                    current={current}
                    openNodes={openNodes}
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
    </aside>
  )
}

function CategoryBranch({
  category,
  current,
  openNodes,
  onToggle,
}: {
  category: Category
  current: string | null
  openNodes: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  const hasChildren = Boolean(category.children?.length)
  const open = openNodes[category.id] ?? false
  const active = current === category.id

  return (
    <li className="my-0.5">
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? '收起' : '展开'}${category.name}`}
            onClick={() => onToggle(category.id)}
            className="w-6 shrink-0 text-sm"
          >
            <span aria-hidden="true">{open ? '▾' : '▸'}</span>
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Link
          href={browseHref({ categoryId: category.id })}
          className={itemClass(active)}
          aria-current={active ? 'page' : undefined}
        >
          {category.name}
        </Link>
      </div>
      {hasChildren && open ? (
        <ul className="pl-4">
          {category.children?.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              current={current}
              openNodes={openNodes}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function itemClass(active: boolean) {
  return active ? 'block flex-1 rounded bg-neutral-200 px-2 py-1 text-sm' : 'block flex-1 rounded px-2 py-1 text-sm hover:bg-neutral-100'
}
