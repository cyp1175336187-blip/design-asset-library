import { NextResponse } from 'next/server'
import { getAssetRecord } from '@/lib/asset-records'
import { ASSET_BUCKET } from '@/lib/storage'
import { createClient } from '@/lib/supabase/server'
import { isUuid } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!isUuid(id)) return new NextResponse(null, { status: 404 })

  const supabase = await createClient()
  if (!supabase) return new NextResponse(null, { status: 503 })
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return new NextResponse(null, { status: 401 })

  const asset = await getAssetRecord(id)
  if (!asset.ok || !asset.data?.previewPath) return new NextResponse(null, { status: 404 })

  const signed = await supabase.storage.from(ASSET_BUCKET).createSignedUrl(asset.data.previewPath, 60)
  if (signed.error || !signed.data?.signedUrl) return new NextResponse(null, { status: 404 })
  return NextResponse.redirect(signed.data.signedUrl)
}
