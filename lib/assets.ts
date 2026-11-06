import { categoryMatchIds } from '@/lib/taxonomy'

export type AssetFile = {
  path: string
  originalName: string
  mime: string
  role: 'source' | 'preview'
}

export type Asset = {
  id: string
  title: string
  description: string
  tags: string[]
  categoryId: string
  intro: string
  platform: string
  version: string
  updatedAt: string
  previewPath: string | null
  notes: string
  install: string
  remark: string
  filePath: string | null
  mime: string | null
  originalName: string | null
  downloadCount: number
  ownerId: string
  files: AssetFile[]
}

export function filterAssets(assets: Asset[], options: { categoryId?: string; query?: string }) {
  const categoryId = options.categoryId?.trim()
  const query = options.query?.trim().toLowerCase()
  let list = assets

  if (categoryId) {
    const ids = categoryMatchIds(categoryId)
    if (!ids) return []
    list = list.filter((asset) => ids.has(asset.categoryId))
  }

  if (query) {
    list = list.filter((asset) => {
      const haystack = [asset.title, asset.description, ...asset.tags].join('\n').toLowerCase()
      return haystack.includes(query)
    })
  }

  return list
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
