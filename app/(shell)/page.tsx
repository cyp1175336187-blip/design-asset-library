import { Suspense } from 'react'
import { AssetBrowser } from '@/components/AssetBrowser'
import { listAssets } from '@/lib/asset-records'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const result = await listAssets()
  if (!result.ok) {
    return (
      <section className="rounded-3xl border border-dashed border-line bg-mist/80 px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">暂时无法加载资产</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{result.error}</p>
      </section>
    )
  }

  return (
    <Suspense fallback={<BrowserFallback />}>
      <AssetBrowser assets={result.data} />
    </Suspense>
  )
}

function BrowserFallback() {
  return (
    <div aria-busy="true">
      <p className="sr-only">加载资产…</p>
      <div className="mb-5 h-8 w-36 rounded-lg bg-mist" />
      <div className="mb-6 h-8 max-w-xl rounded-full bg-mist" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>
            <div className="aspect-[4/3] rounded-xl bg-mist" />
            <div className="mt-3 h-3 w-2/3 rounded bg-mist" />
          </div>
        ))}
      </div>
    </div>
  )
}
