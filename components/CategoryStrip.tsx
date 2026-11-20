import Link from 'next/link'
import type { ReactNode } from 'react'
import { browseHref } from '@/lib/browse'
import { findCategoryContext, taxonomy, type Category } from '@/lib/taxonomy'

export function CategoryStrip({ categoryId }: { categoryId?: string }) {
  const context = categoryId ? findCategoryContext(categoryId) : null
  const branch = context?.category.children?.length ? context.category : context?.ancestors[context.ancestors.length - 1]
  const children = branch?.children

  return (
    <div className="mb-6 space-y-2.5">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip href={browseHref({})} active={!categoryId}>
          全部
        </Chip>
        {taxonomy.map((section) => (
          <div key={section.id} className="flex shrink-0 items-center gap-2 pl-2">
            <span className="inline-flex h-8 items-center text-xs text-muted">{section.name}</span>
            {section.categories.map((category) => {
              const state = topLevelState(category, categoryId)
              return (
                <Chip key={category.id} href={browseHref({ categoryId: category.id })} active={state === 'active'} branch={state === 'branch'}>
                  {category.name}
                </Chip>
              )
            })}
          </div>
        ))}
      </div>
      {children && children.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="inline-flex h-8 shrink-0 items-center pr-1 text-xs text-muted">子分类</span>
          {children.map((category) => (
            <Chip key={category.id} href={browseHref({ categoryId: category.id })} active={categoryId === category.id}>
              {category.name}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function topLevelState(category: Category, categoryId?: string): 'active' | 'branch' | 'idle' {
  if (!categoryId) return 'idle'
  if (category.id === categoryId) return 'active'
  if (category.children?.some((child) => containsId(child, categoryId))) return 'branch'
  return 'idle'
}

function containsId(category: Category, id: string): boolean {
  if (category.id === id) return true
  return category.children?.some((child) => containsId(child, id)) ?? false
}

function Chip({
  href,
  active = false,
  branch = false,
  children,
}: {
  href: string
  active?: boolean
  branch?: boolean
  children: ReactNode
}) {
  const tone = active
    ? 'bg-ink text-white'
    : branch
      ? 'bg-white text-ink ring-1 ring-ink ring-inset'
      : 'bg-mist text-neutral-800 hover:bg-neutral-200'
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm whitespace-nowrap ${tone}`}
    >
      {children}
    </Link>
  )
}
