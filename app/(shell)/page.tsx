import { Suspense } from 'react'
import { AssetBrowser } from '@/components/AssetBrowser'
import { listAssets } from '@/lib/asset-records'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const result = await listAssets()
  if (!result.ok) {
    return <p className="border border-dashed p-8 text-neutral-600">{result.error}</p>
  }

  return (
    <Suspense fallback={<p>加载资产…</p>}>
      <AssetBrowser assets={result.data} />
    </Suspense>
  )
}
