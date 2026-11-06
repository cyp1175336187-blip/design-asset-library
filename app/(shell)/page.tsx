import { Suspense } from 'react'
import { AssetBrowser } from '@/components/AssetBrowser'

export default function Home() {
  return (
    <Suspense fallback={<p>加载资产…</p>}>
      <AssetBrowser />
    </Suspense>
  )
}
