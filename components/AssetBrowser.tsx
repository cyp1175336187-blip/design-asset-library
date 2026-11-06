'use client'

import { useSearchParams } from 'next/navigation'
import { AssetGrid } from '@/components/AssetGrid'
import { useBrowseQuery } from '@/components/BrowseState'
import { filterAssets } from '@/lib/assets'
import { findCategory } from '@/lib/taxonomy'

export function AssetBrowser() {
  const params = useSearchParams()
  const { query } = useBrowseQuery()
  const categoryId = params.get('category')?.trim() || undefined
  const category = categoryId ? findCategory(categoryId) : undefined
  const trimmedQuery = query.trim()

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">{category ? category.name : categoryId ? '未知分类' : '全部资产'}</h1>
      <AssetGrid
        assets={filterAssets({ categoryId, query: trimmedQuery })}
        categoryName={category?.name}
        query={trimmedQuery || undefined}
        unknownCategory={Boolean(categoryId && !category)}
      />
    </section>
  )
}
