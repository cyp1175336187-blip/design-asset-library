import type { Asset, AssetFile } from '@/lib/assets'
import { createClient } from '@/lib/supabase/server'
import { isUuid } from '@/lib/uploads'

type AssetRow = {
  id: string
  title: string
  description: string
  intro: string
  category: string
  tags: unknown
  remark: string
  platform: string
  version: string
  updated_at: string
  preview_path: string | null
  asset_notes: string
  install_notes: string
  file_path: string | null
  mime: string | null
  original_name: string | null
  download_count: number
  owner_id: string
  files: unknown
}

const ASSET_COLUMNS =
  'id, title, description, intro, category, tags, remark, platform, version, updated_at, preview_path, asset_notes, install_notes, file_path, mime, original_name, download_count, owner_id, files'

export type AssetResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function listAssets(): Promise<AssetResult<Asset[]>> {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: '尚未配置 Supabase。请按 README 填写环境变量。' }
  const { data, error } = await supabase.from('assets').select(ASSET_COLUMNS).order('updated_at', { ascending: false })
  if (error) return { ok: false, error: databaseError(error.message) }
  return { ok: true, data: (data as AssetRow[] | null)?.map(toAsset) ?? [] }
}

export async function getAssetRecord(id: string): Promise<AssetResult<Asset | null>> {
  if (!isUuid(id)) return { ok: true, data: null }
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: '尚未配置 Supabase。请按 README 填写环境变量。' }
  const { data, error } = await supabase.from('assets').select(ASSET_COLUMNS).eq('id', id).maybeSingle()
  if (error) return { ok: false, error: databaseError(error.message) }
  return { ok: true, data: data ? toAsset(data as AssetRow) : null }
}

function toAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: asTags(row.tags),
    categoryId: row.category,
    intro: row.intro,
    platform: row.platform,
    version: row.version,
    updatedAt: row.updated_at,
    previewPath: row.preview_path,
    notes: row.asset_notes,
    install: row.install_notes,
    remark: row.remark,
    filePath: row.file_path,
    mime: row.mime,
    originalName: row.original_name,
    downloadCount: row.download_count,
    ownerId: row.owner_id,
    files: asFiles(row.files),
  }
}

function asTags(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asFiles(value: unknown): AssetFile[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (typeof record.path !== 'string' || typeof record.originalName !== 'string') return []
    const role = record.role === 'preview' ? 'preview' : 'source'
    return [
      {
        path: record.path,
        originalName: record.originalName,
        mime: typeof record.mime === 'string' ? record.mime : 'application/octet-stream',
        role,
      },
    ]
  })
}

function databaseError(message: string) {
  if (message.includes('assets') || message.includes('schema cache') || message.includes('increment_download_count')) {
    return `数据库还不可用：${message}。请在 Supabase SQL Editor 中执行 supabase/migrations 里的脚本。`
  }
  return message
}
