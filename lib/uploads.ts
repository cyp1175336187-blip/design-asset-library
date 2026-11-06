export const SOURCE_EXTENSIONS = ['otf', 'ttf', 'svg', 'psd', 'fig', 'figma'] as const
export const PREVIEW_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
export const MAX_FOLDER_FILES = 200

const MIME_BY_EXTENSION: Record<string, string> = {
  otf: 'font/otf',
  ttf: 'font/ttf',
  svg: 'image/svg+xml',
  psd: 'image/vnd.adobe.photoshop',
  fig: 'application/octet-stream',
  figma: 'application/octet-stream',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export type FileRole = 'source' | 'preview'

export type ClassifiedFile = {
  relativePath: string
  originalName: string
  extension: string
  mime: string
  role: FileRole
}

export function fileExtension(name: string) {
  const base = name.split(/[/\\]/).pop() ?? name
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function isAllowedExtension(extension: string) {
  return (
    (SOURCE_EXTENSIONS as readonly string[]).includes(extension) ||
    (PREVIEW_EXTENSIONS as readonly string[]).includes(extension)
  )
}

export function mimeForExtension(extension: string, provided?: string) {
  if (provided && provided !== 'application/octet-stream') return provided
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

export function normalizeRelativePath(input: string) {
  const parts = input
    .split(/[/\\]+/)
    .map((part) => part.replace(/[\u0000-\u001f]/g, '').trim())
    .filter((part) => part && part !== '.' && part !== '..')
  if (parts.length === 0) return null
  return parts.join('/')
}

export function tagsFromFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, '')
  const extension = fileExtension(name)
  const tokens = base
    .split(/[\s_\-./]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 || /[\u4e00-\u9fff]/.test(token))
  if (extension) tokens.push(extension)
  const seen = new Set<string>()
  const tags: string[] = []
  for (const token of tokens) {
    const key = token.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(token)
  }
  return tags
}

export function parseTagInput(value: string) {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of value.split(/[,，]/)) {
    const token = part.trim()
    if (!token) continue
    const key = token.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(token.slice(0, 40))
    if (tags.length >= 30) break
  }
  return tags
}

export function classifyFolder(files: { relativePath: string; mime?: string }[]) {
  const skipped: string[] = []
  const accepted: ClassifiedFile[] = []

  for (const file of files) {
    const relativePath = normalizeRelativePath(file.relativePath)
    if (!relativePath) {
      skipped.push(file.relativePath || '未命名文件')
      continue
    }
    const originalName = relativePath.split('/').pop() ?? relativePath
    const extension = fileExtension(originalName)
    if (!isAllowedExtension(extension)) {
      skipped.push(relativePath)
      continue
    }
    accepted.push({
      relativePath,
      originalName,
      extension,
      mime: mimeForExtension(extension, file.mime),
      role: 'source',
    })
  }

  const roots = new Set(accepted.map((file) => file.relativePath.split('/')[0] ?? file.relativePath))
  const hasDesignSource = accepted.some((file) => file.extension !== 'svg' && (SOURCE_EXTENSIONS as readonly string[]).includes(file.extension))
  const hasRaster = accepted.some((file) => (PREVIEW_EXTENSIONS as readonly string[]).includes(file.extension))

  for (const file of accepted) {
    const raster = (PREVIEW_EXTENSIONS as readonly string[]).includes(file.extension)
    const svgPreview = file.extension === 'svg' && !hasDesignSource && !hasRaster
    file.role = raster || svgPreview ? 'preview' : 'source'
  }

  const preview = accepted.find((file) => (PREVIEW_EXTENSIONS as readonly string[]).includes(file.extension)) ?? accepted.find((file) => file.extension === 'svg') ?? null
  const primary = accepted.find((file) => file.role === 'source' && file.extension !== 'svg') ?? accepted.find((file) => file.role === 'source') ?? preview
  const titleSource = accepted[0]?.relativePath.split('/')[0] ?? '未命名文件夹'
  const title = titleSource.includes('.') && !accepted[0]?.relativePath.includes('/') ? titleSource.replace(/\.[^.]+$/, '') : titleSource
  const tags = accepted.flatMap((file) => tagsFromFileName(file.originalName)).filter((tag, index, all) => {
    return all.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index
  })

  return {
    accepted,
    skipped,
    roots: [...roots],
    title,
    primary,
    preview,
    tags: tags.slice(0, 30),
    truncated: accepted.length > MAX_FOLDER_FILES,
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}

export function folderError(result: ReturnType<typeof classifyFolder>) {
  if (result.accepted.length === 0) {
    return '文件夹里没有支持的文件（otf、ttf、svg、psd、fig、figma、png、jpg、webp）。'
  }
  if (result.truncated) return `一次最多上传 ${MAX_FOLDER_FILES} 个支持的文件。`
  if (result.roots.length > 1) return '一次只能上传一个文件夹。'
  if (!result.primary) return '没有可保存的文件。'
  return null
}
