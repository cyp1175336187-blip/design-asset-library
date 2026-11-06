import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase/server'
import { findCategory } from '@/lib/taxonomy'
import { isUuid, parseTagInput } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  if (!isUuid(id)) return NextResponse.json({ error: '资产编号无效' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式不正确' }, { status: 400 })
  }
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const title = textField(record.title, 200)
  const description = textField(record.description, 5000)
  const intro = textField(record.intro, 5000)
  const remark = textField(record.remark, 5000)
  const platform = textField(record.platform, 200)
  const version = textField(record.version, 80)
  const assetNotes = textField(record.assetNotes, 5000)
  const installNotes = textField(record.installNotes, 5000)
  const category = typeof record.category === 'string' ? record.category.trim() : ''
  const tags = typeof record.tags === 'string' ? parseTagInput(record.tags) : null

  if (title === null || description === null || intro === null || remark === null || platform === null || version === null || assetNotes === null || installNotes === null || !tags) {
    return NextResponse.json({ error: '字段过长或格式不正确' }, { status: 400 })
  }
  if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
  if (!findCategory(category)) return NextResponse.json({ error: '请选择分类' }, { status: 400 })

  const { error } = await auth.auth.supabase
    .from('assets')
    .update({
      title,
      description,
      intro,
      remark,
      platform,
      version,
      asset_notes: assetNotes,
      install_notes: installNotes,
      category,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

function textField(value: unknown, max: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length > max) return null
  return trimmed
}
