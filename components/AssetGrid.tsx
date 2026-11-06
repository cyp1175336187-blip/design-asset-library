import Link from 'next/link'
import type { Asset } from '@/lib/assets'
import { findCategory } from '@/lib/taxonomy'

export function AssetGrid({
  assets,
  categoryName,
  query,
  unknownCategory = false,
}: {
  assets: Asset[]
  categoryName?: string
  query?: string
  unknownCategory?: boolean
}) {
  if (assets.length === 0) {
    return <p className="border border-dashed p-8 text-center text-neutral-600">{emptyMessage(categoryName, query, unknownCategory)}</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => {
        const category = findCategory(asset.categoryId)
        return (
          <li key={asset.id}>
            <Link href={`/assets/${asset.id}`} className="block h-full border p-4 hover:bg-neutral-50">
              {asset.previewPath ? (
                <img src={`/assets/${asset.id}/preview`} alt="" className="mb-3 h-24 w-full bg-neutral-100 object-contain" />
              ) : (
                <div className="mb-3 flex h-24 items-center justify-center bg-neutral-100 text-sm text-neutral-600">{asset.originalName || '无预览'}</div>
              )}
              <h2 className="font-medium">{asset.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{asset.description || '暂无描述'}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {category?.name ?? asset.categoryId}
                {asset.tags.length > 0 ? ` · ${asset.tags.join(' / ')}` : ''}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function emptyMessage(categoryName: string | undefined, query: string | undefined, unknownCategory: boolean) {
  if (unknownCategory) return '没有这个分类。'
  if (categoryName && query) return `在「${categoryName}」中没有与「${query}」匹配的资产。`
  if (categoryName) return `「${categoryName}」下暂无资产。`
  if (query) return `没有与「${query}」匹配的资产。`
  return '暂无资产。'
}
