export function parseByteLimit(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && /^[0-9]+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return parsed > 0 ? parsed : null
  }
  return null
}

export function effectiveUploadLimit(bucketLimit: unknown, configuredLimit: unknown): number | null {
  const bucket = parseByteLimit(bucketLimit)
  const configured = parseByteLimit(configuredLimit)
  if (bucket != null && configured != null) return Math.min(bucket, configured)
  return bucket ?? configured
}

export function formatByteSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return `${bytes} B`
  if (bytes < 1024) return `${Math.round(bytes)} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const rounded = value >= 100 || Math.abs(value - Math.round(value)) < 0.05 ? value.toFixed(0) : value.toFixed(1)
  return `${rounded} ${units[unit]}`
}

export function uploadSizeError(files: { name: string; size: number }[], limitBytes: number | null) {
  if (limitBytes == null) return null
  const tooBig = files.filter((file) => file.size > limitBytes)
  if (tooBig.length === 0) return null
  const names = tooBig.map((file) => `「${file.name}」（${formatByteSize(file.size)}）`).join('、')
  return `${names}超过单个文件上限 ${formatByteSize(limitBytes)}。本次不会开始上传。`
}

const SIZE_ERROR = /maximum allowed size|entitytoolarge|payload too large/i
const STATED_LIMIT = /\((\d+(?:\.\d+)?\s*(?:bytes|B|KB|MB|GB|TB))\)/i

export function storageSizeMessage(message: string, file: { name: string; size: number }) {
  if (!SIZE_ERROR.test(message)) return message
  const stated = message.match(STATED_LIMIT)
  const limit = stated
    ? `存储返回的上限是 ${stated[1]}。`
    : '当前存储桶没有单独的文件大小上限，实际生效的是项目的全局文件大小限制或套餐上限。'
  return `「${file.name}」（${formatByteSize(file.size)}）超过了允许的大小。${limit}请缩小该文件后再上传。已开始上传的文件会撤回。`
}
