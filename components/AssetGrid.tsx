'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Asset } from '@/lib/assets'
import { findCategory } from '@/lib/taxonomy'
import { fileExtension } from '@/lib/uploads'
import { primaryButtonClass } from '@/components/styles'
import { uploadHref } from '@/lib/browse'

const PLATES = [
  { bg: '#e7f0ec', ink: '#1f4d40' },
  { bg: '#f3eee6', ink: '#5c4a32' },
  { bg: '#f8ebe6', ink: '#6b3a2e' },
  { bg: '#eceef6', ink: '#343a5c' },
  { bg: '#e8f1f6', ink: '#23485c' },
  { bg: '#eef2e8', ink: '#31422a' },
]

export function AssetGrid({
  assets,
  categoryName,
  categoryId,
  query,
  unknownCategory = false,
}: {
  assets: Asset[]
  categoryName?: string
  categoryId?: string
  query?: string
  unknownCategory?: boolean
}) {
  if (assets.length === 0) {
    return <EmptyAssets message={emptyMessage(categoryName, query, unknownCategory)} categoryId={categoryId} />
  }

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4 xl:grid-cols-5">
      {assets.map((asset) => (
        <li key={asset.id}>
          <Link href={`/assets/${asset.id}`} title={asset.title} className="group block min-w-0 rounded-xl">
            <div className="aspect-[4/3] overflow-hidden rounded-xl bg-mist shadow-[inset_0_0_0_1px_rgba(22,22,22,0.06)] transition-shadow duration-300 group-hover:shadow-[0_10px_28px_rgba(22,22,22,0.08)] motion-reduce:transition-none">
              <AssetCover asset={asset} />
            </div>
            <h2 className="mt-2.5 line-clamp-2 text-[13px] leading-5 font-medium text-ink">{asset.title}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{cardMeta(asset)}</p>
            {asset.tags.length > 0 ? <p className="mt-1 truncate text-xs text-neutral-400">{asset.tags.slice(0, 3).join(' / ')}</p> : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AssetCover({ asset }: { asset: Asset }) {
  const [failed, setFailed] = useState(false)
  if (!asset.previewPath || failed) return <CoverPlate asset={asset} />
  return <img src={`/assets/${asset.id}/preview`} alt="" onError={() => setFailed(true)} className="h-full w-full object-contain" />
}

function CoverPlate({ asset }: { asset: Asset }) {
  const plate = plateFor(asset.categoryId || asset.id)
  const ext = fileExtension(asset.originalName || asset.files[0]?.originalName || '')
  return (
    <div className="flex h-full w-full flex-col justify-between p-3 sm:p-4" style={{ backgroundColor: plate.bg, color: plate.ink }}>
      <span className="text-[11px] font-semibold tracking-[0.16em]">{ext ? ext.toUpperCase() : '文件'}</span>
      <span className="text-xs opacity-70">无预览</span>
    </div>
  )
}

function plateFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % PLATES.length
  return PLATES[hash] ?? PLATES[0]
}

function cardMeta(asset: Asset) {
  const category = findCategory(asset.categoryId)
  const parts = [category?.name ?? asset.categoryId]
  const ext = fileExtension(asset.originalName || asset.files[0]?.originalName || '')
  if (ext) parts.push(ext.toUpperCase())
  if (asset.files.length > 1) parts.push(`${asset.files.length} 个文件`)
  if (asset.downloadCount > 0) parts.push(`下载 ${asset.downloadCount}`)
  return parts.join(' · ')
}

function EmptyAssets({ message, categoryId }: { message: string; categoryId?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-mist/80 px-6 py-16 text-center">
      <EmptyMark />
      <h2 className="mt-5 text-lg font-semibold text-ink">{message}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        上传后会显示在这里。一次可以选择一个或多个文件，并保存为同一条资产；不能上传文件夹。
      </p>
      <Link href={uploadHref(categoryId)} className={`${primaryButtonClass} mt-6`}>
        上传资产
      </Link>
    </div>
  )
}

function EmptyMark() {
  return (
    <svg viewBox="0 0 80 64" className="h-16 w-20 text-neutral-300" aria-hidden="true">
      <rect x="1" y="1" width="34" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="45" y="1" width="34" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="1" y="37" width="34" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="45" y="37" width="34" height="26" rx="6" fill="#f4f4f5" stroke="currentColor" strokeWidth="2" />
      <path d="M62 50h8M66 46v8" fill="none" stroke="#161616" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function emptyMessage(categoryName: string | undefined, query: string | undefined, unknownCategory: boolean) {
  if (unknownCategory) return '没有这个分类。'
  if (categoryName && query) return `在「${categoryName}」中没有与「${query}」匹配的资产。`
  if (categoryName) return `「${categoryName}」下暂无资产。`
  if (query) return `没有与「${query}」匹配的资产。`
  return '暂无资产。'
}
