import { NextResponse } from 'next/server'
import { getAssetRecord } from '@/lib/asset-records'
import { ASSET_BUCKET } from '@/lib/storage'
import { requireUser } from '@/lib/supabase/server'
import { isUuid } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await context.params
  if (!isUuid(id)) return NextResponse.json({ error: '资产编号无效' }, { status: 400 })

  const asset = await getAssetRecord(id)
  if (!asset.ok) return NextResponse.json({ error: asset.error }, { status: 500 })
  if (!asset.data?.filePath) return NextResponse.json({ error: '没有可下载的文件' }, { status: 404 })

  const signed = await auth.auth.supabase.storage.from(ASSET_BUCKET).createSignedUrl(asset.data.filePath, 60, {
    download: asset.data.originalName ?? true,
  })
  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json({ error: signed.error?.message ?? '无法生成下载链接' }, { status: 502 })
  }

  const counted = await auth.auth.supabase.rpc('increment_download_count', { asset_id: id })
  if (counted.error) return NextResponse.json({ error: counted.error.message }, { status: 500 })

  return NextResponse.json({
    url: signed.data.signedUrl,
    filename: asset.data.originalName,
    downloadCount: counted.data,
  })
}
