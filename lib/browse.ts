export function browseHref(options: { categoryId?: string | null; query?: string | null }): string {
  const params = new URLSearchParams()
  const categoryId = options.categoryId?.trim()
  const query = options.query?.trim()
  if (categoryId) {
    params.set('category', categoryId)
  }
  if (query) {
    params.set('q', query)
  }
  const search = params.toString()
  return search ? `/?${search}` : '/'
}
