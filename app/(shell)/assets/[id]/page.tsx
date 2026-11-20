import type { Metadata } from 'next'
import Link from 'next/link'
import { AssetDetail } from '@/components/AssetDetail'
import { primaryButtonClass } from '@/components/styles'
import { getAssetRecord } from '@/lib/asset-records'

export const dynamic = 'force-dynamic'

type AssetPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AssetPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getAssetRecord(id)
  const title = result.ok && result.data ? result.data.title : '未找到资产'
  return { title: `${title} · 设计资产库` }
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params
  const result = await getAssetRecord(id)

  if (!result.ok) {
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-dashed border-line bg-mist/80 px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">暂时无法读取资产</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{result.error}</p>
      </section>
    )
  }

  const asset = result.data
  if (!asset) {
    return (
      <section className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-semibold">未找到该资产</h1>
        <p className="mt-2 text-sm text-muted">这个链接没有对应的资产。</p>
        <Link href="/" className={`${primaryButtonClass} mt-6`}>
          返回列表
        </Link>
      </section>
    )
  }

  return <AssetDetail asset={asset} />
}
