import { NextResponse } from 'next/server'
import { ASSET_BUCKET, storageObjectPath } from '@/lib/storage'
import { requireUser } from '@/lib/supabase/server'
import { findCategory } from '@/lib/taxonomy'
import { classifyFolder, folderError, isUuid } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

type SubmittedFile = {
  relativePath?: unknown
  mime?: unknown
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式不正确' }, { status: 400 })
  }

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const assetId = typeof record.assetId === 'string' ? record.assetId : ''
  const category = typeof record.category === 'string' ? record.category.trim() : ''
  const titleInput = typeof record.title === 'string' ? record.title.trim() : ''
  const files = Array.isArray(record.files) ? record.files.flatMap(readFile) : []

  if (!isUuid(assetId)) return NextResponse.json({ error: '资产编号无效' }, { status: 400 })
  if (!findCategory(category)) return NextResponse.json({ error: '请选择分类' }, { status: 400 })

  const classified = classifyFolder(files)
  const problem = folderError(classified)
  if (problem || !classified.primary) return NextResponse.json({ error: problem ?? '没有可保存的文件' }, { status: 400 })

  const title = (titleInput || classified.title).slice(0, 200)
  const stored = classified.accepted.map((file) => ({
    ...file,
    path: storageObjectPath(auth.auth.userId, assetId, file.relativePath),
  }))

  for (const file of stored) {
    const { error } = await auth.auth.supabase.storage.from(ASSET_BUCKET).createSignedUrl(file.path, 30)
    if (error) {
      return NextResponse.json({ error: `存储中找不到文件 ${file.originalName}` }, { status: 400 })
    }
  }

  const primary = stored.find((file) => file.relativePath === classified.primary?.relativePath) ?? stored[0]
  const preview = classified.preview ? stored.find((file) => file.relativePath === classified.preview?.relativePath) ?? null : null
  const { error } = await auth.auth.supabase.from('assets').insert({
    id: assetId,
    title,
    description: '',
    intro: '',
    category,
    tags: classified.tags,
    remark: '',
    platform: '',
    version: '',
    preview_path: preview?.path ?? null,
    asset_notes: '',
    install_notes: '',
    file_path: primary?.path ?? null,
    mime: primary?.mime ?? null,
    original_name: primary?.originalName ?? null,
    owner_id: auth.auth.userId,
    files: stored.map((file) => ({
      path: file.path,
      originalName: file.originalName,
      mime: file.mime,
      role: file.role,
    })),
  })

  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return NextResponse.json({ id: assetId })
}

function readFile(value: unknown) {
  if (!value || typeof value !== 'object') return []
  const record = value as SubmittedFile
  if (typeof record.relativePath !== 'string') return []
  return [{ relativePath: record.relativePath, mime: typeof record.mime === 'string' ? record.mime : undefined }]
}
