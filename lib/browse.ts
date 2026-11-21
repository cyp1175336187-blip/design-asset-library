import { findCategory } from './taxonomy.ts'

export function uploadHref(categoryId?: string | null) {
  const id = categoryId?.trim()
  if (!id || !findCategory(id)) return '/upload'
  return `/upload?${new URLSearchParams({ category: id }).toString()}`
}

export function browseHref(options: { categoryId?: string | null; query?: string | null }) {
  const params = new URLSearchParams()
  const categoryId = options.categoryId?.trim()
  const query = options.query?.trim()
  if (categoryId) params.set('category', categoryId)
  if (query) params.set('q', query)
  const search = params.toString()
  return search ? `/?${search}` : '/'
}

export function safeNextPath(value: string | null | undefined, fallback = '/') {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.startsWith('/login')) return fallback
  return value
}
