'use client'

import { useSearchParams } from 'next/navigation'
import { AssetGrid } from '@/components/AssetGrid'
import { CategoryStrip } from '@/components/CategoryStrip'
import { useBrowseQuery } from '@/components/BrowseState'
import { filterAssets, type Asset } from '@/lib/assets'
import { findCategory } from '@/lib/taxonomy'

export function AssetBrowser({ assets }: { assets: Asset[] }) {
  const params = useSearchParams()
  const { query } = useBrowseQuery()
  const categoryId = params.get('category')?.trim() || undefined
  const category = categoryId ? findCategory(categoryId) : undefined
  const trimmedQuery = query.trim()
  const filtered = filterAssets(assets, { categoryId, query: trimmedQuery })
  const title = category ? category.name : categoryId ? '未知分类' : '全部资产'

  return (
    <section className="pb-12">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted">浏览</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-ink">{title}</h1>
          {trimmedQuery ? <p className="mt-1 text-sm text-muted">搜索「{trimmedQuery}」</p> : null}
        </div>
        <p className="shrink-0 pb-1 text-sm text-muted tabular-nums">{filtered.length} 个资产</p>
      </header>
      <CategoryStrip categoryId={categoryId} />
      <AssetGrid
        assets={filtered}
        categoryName={category?.name}
        query={trimmedQuery || undefined}
        unknownCategory={Boolean(categoryId && !category)}
      />
    </section>
  )
}
