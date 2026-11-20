export const SOURCE_EXTENSIONS = ['otf', 'ttf', 'svg', 'psd', 'fig', 'figma'] as const
export const PREVIEW_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
export const MAX_UPLOAD_FILES = 200
export const DIRECTORY_UPLOAD_ERROR = '不能上传文件夹。请选择一个或多个单独的文件。'

const FORMAT_LIST = 'otf、ttf、svg、psd、fig、figma、png、jpg、jpeg、webp'

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

export type ClassifiedSelection = {
  accepted: ClassifiedFile[]
  title: string
  primary: ClassifiedFile | null
  preview: ClassifiedFile | null
  tags: string[]
  truncated: boolean
  directoryPath: string | null
  duplicateName: string | null
  unsupportedNames: string[]
  invalidName: string | null
}

export type SelectedFileInput = {
  name: string
  webkitRelativePath?: string
  mime?: string
}

type TransferItem = {
  kind: string
  webkitGetAsEntry?: () => { isDirectory?: boolean } | null
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

export function acceptAttribute() {
  return [...SOURCE_EXTENSIONS, ...PREVIEW_EXTENSIONS].map((extension) => `.${extension}`).join(',')
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

export function hasDirectoryPath(input: string) {
  return /[/\\]/.test(input)
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

export function dataTransferHasDirectory(transfer: { items?: TransferItem[]; files?: { webkitRelativePath?: string }[] }) {
  const entries = (transfer.items ?? []).filter((item) => item.kind === 'file').map((item) => item.webkitGetAsEntry?.() ?? null)
  if (entries.some((entry) => entry?.isDirectory)) return true
  return (transfer.files ?? []).some((file) => hasDirectoryPath(file.webkitRelativePath ?? ''))
}

export function classifySelectedFiles(files: SelectedFileInput[]) {
  const nested = files.find((file) => hasDirectoryPath(file.webkitRelativePath ?? ''))
  if (nested) {
    const directoryPath = (nested.webkitRelativePath ?? '').trim() || nested.name.trim() || '文件夹'
    return blankSelection({ directoryPath })
  }
  return classifySelection(files.map((file) => ({ relativePath: file.name, mime: file.mime })))
}

// One submission is one asset. A path with a directory segment is rejected whole.
export function classifySelection(files: { relativePath: string; mime?: string }[]): ClassifiedSelection {
  const accepted: ClassifiedFile[] = []
  let directoryPath: string | null = null
  let duplicateName: string | null = null
  const unsupportedNames: string[] = []
  let invalidName: string | null = null
  const seen = new Set<string>()

  for (const file of files) {
    const raw = typeof file.relativePath === 'string' ? file.relativePath : ''
    const kind = inspectRelativePath(raw)
    if (kind.status === 'directory') {
      directoryPath ??= kind.name
      continue
    }
    if (kind.status === 'invalid') {
      invalidName ??= kind.name
      continue
    }
    const extension = fileExtension(kind.path)
    if (!isAllowedExtension(extension)) {
      unsupportedNames.push(kind.path)
      continue
    }
    if (seen.has(kind.path)) {
      duplicateName ??= kind.path
      continue
    }
    seen.add(kind.path)
    accepted.push({
      relativePath: kind.path,
      originalName: kind.path,
      extension,
      mime: mimeForExtension(extension, file.mime),
      role: 'source',
    })
  }

  const { primary, preview } = assignRoles(accepted)
  const truncated = accepted.length > MAX_UPLOAD_FILES
  if (!directoryPath && !invalidName && unsupportedNames.length === 0 && !duplicateName && !truncated && primary) {
    return {
      accepted,
      title: fileTitle(primary.originalName),
      primary,
      preview,
      tags: uniqueTags(accepted),
      truncated: false,
      directoryPath: null,
      duplicateName: null,
      unsupportedNames: [],
      invalidName: null,
    }
  }

  return blankSelection({ directoryPath, duplicateName, unsupportedNames, invalidName, truncated })
}

export function selectionError(result: ClassifiedSelection) {
  if (result.directoryPath) return DIRECTORY_UPLOAD_ERROR
  if (result.invalidName) return `文件名无效：${clip(result.invalidName)}。`
  if (result.unsupportedNames.length > 0) {
    const shown = result.unsupportedNames.slice(0, 5).map(clip)
    const suffix = result.unsupportedNames.length > 5 ? ` 等 ${result.unsupportedNames.length} 个文件` : ''
    return `不支持的文件：${shown.join('、')}${suffix}。可选格式为 ${FORMAT_LIST}。`
  }
  if (result.duplicateName) return `文件名重复：${clip(result.duplicateName)}。同一次上传中每个文件名只能出现一次。`
  if (result.truncated) return `一次最多上传 ${MAX_UPLOAD_FILES} 个文件。`
  if (result.accepted.length === 0 || !result.primary) return '请选择一个或多个文件。'
  return null
}

export function selectionSummary(result: ClassifiedSelection) {
  if (!result.primary) return null
  const count = result.accepted.length
  const lead = count === 1 ? '这个文件会保存为同一条资产' : `这 ${count} 个文件会保存为同一条资产`
  const titled = `${lead}「${result.title}」`
  if (count === 1 && result.preview?.relativePath === result.primary.relativePath) {
    return `${titled}，并作为预览图。`
  }
  const preview = result.preview ? `预览：${result.preview.originalName}。` : '没有单独的预览图。'
  return `${titled}。主文件：${result.primary.originalName}。${preview}`
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}

function assignRoles(accepted: ClassifiedFile[]) {
  const hasDesignSource = accepted.some((file) => file.extension !== 'svg' && (SOURCE_EXTENSIONS as readonly string[]).includes(file.extension))
  const hasRaster = accepted.some((file) => (PREVIEW_EXTENSIONS as readonly string[]).includes(file.extension))

  for (const file of accepted) {
    const raster = (PREVIEW_EXTENSIONS as readonly string[]).includes(file.extension)
    const svgPreview = file.extension === 'svg' && !hasDesignSource && !hasRaster
    file.role = raster || svgPreview ? 'preview' : 'source'
  }

  const preview = accepted.find((file) => (PREVIEW_EXTENSIONS as readonly string[]).includes(file.extension)) ?? accepted.find((file) => file.extension === 'svg') ?? null
  const primary = accepted.find((file) => file.role === 'source' && file.extension !== 'svg') ?? accepted.find((file) => file.role === 'source') ?? preview
  return { preview, primary }
}

function uniqueTags(files: ClassifiedFile[]) {
  const tags = files.flatMap((file) => tagsFromFileName(file.originalName))
  return tags.filter((tag, index, all) => all.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index).slice(0, 30)
}

function fileTitle(name: string) {
  const stripped = name.replace(/\.[^.]+$/, '').trim()
  return stripped || '未命名文件'
}

function inspectRelativePath(input: string): { status: 'directory'; name: string } | { status: 'invalid'; name: string } | { status: 'ok'; path: string } {
  const raw = input.trim()
  if (hasDirectoryPath(raw)) return { status: 'directory', name: raw || '文件夹' }
  const path = normalizeRelativePath(raw)
  if (!path) return { status: 'invalid', name: raw || '未命名文件' }
  if (path.includes('/')) return { status: 'directory', name: raw }
  return { status: 'ok', path }
}

function blankSelection(flags: {
  truncated?: boolean
  directoryPath?: string | null
  duplicateName?: string | null
  unsupportedNames?: string[]
  invalidName?: string | null
}): ClassifiedSelection {
  return {
    accepted: [],
    title: '',
    primary: null,
    preview: null,
    tags: [],
    truncated: flags.truncated ?? false,
    directoryPath: flags.directoryPath ?? null,
    duplicateName: flags.duplicateName ?? null,
    unsupportedNames: flags.unsupportedNames ?? [],
    invalidName: flags.invalidName ?? null,
  }
}

function clip(name: string) {
  const trimmed = name.trim() || '未命名文件'
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed
}
