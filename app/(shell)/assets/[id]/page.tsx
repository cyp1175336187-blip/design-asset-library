import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AssetEditor } from '@/app/(shell)/assets/[id]/asset-editor'
import { DownloadButton } from '@/app/(shell)/assets/[id]/download-button'
import { getAssetRecord } from '@/lib/asset-records'
import { formatDate } from '@/lib/assets'
import { findCategory } from '@/lib/taxonomy'

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
    return <p className="border border-dashed p-8 text-neutral-600">{result.error}</p>
  }

  const asset = result.data
  if (!asset) {
    return (
      <section>
        <h1 className="text-xl font-semibold">未找到该资产</h1>
        <p className="mt-2 text-neutral-600">这个链接没有对应的资产。</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          返回列表
        </Link>
      </section>
    )
  }

  const category = findCategory(asset.categoryId)

  return (
    <article className="max-w-3xl">
      <p className="text-sm text-neutral-500">{category?.name ?? asset.categoryId}</p>
      <h1 className="mt-1 text-2xl font-semibold">{asset.title}</h1>
      <dl className="mt-6 space-y-5">
        <Field label="介绍">{asset.intro || '暂无'}</Field>
        <Field label="标题">{asset.title}</Field>
        <Field label="描述">{asset.description || '暂无'}</Field>
        <Field label="平台支持">{asset.platform || '暂无'}</Field>
        <Field label="版本号">{asset.version || '暂无'}</Field>
        <Field label="更新日期">{formatDate(asset.updatedAt)}</Field>
        <Field label="下载按钮">
          <DownloadButton assetId={asset.id} disabled={!asset.filePath} />
          <p className="mt-2 text-sm text-neutral-600">下载次数：{asset.downloadCount}</p>
        </Field>
        <Field label="预览">
          {asset.previewPath ? (
            <img src={`/assets/${asset.id}/preview`} alt="" className="max-h-80 w-full border bg-neutral-100 object-contain" />
          ) : (
            <div className="flex h-48 items-center justify-center border bg-neutral-100 text-neutral-600">无预览图</div>
          )}
        </Field>
        <Field label="资产说明">{asset.notes || '暂无'}</Field>
        <Field label="安装说明">{asset.install || '暂无'}</Field>
        <Field label="备注">{asset.remark || '暂无'}</Field>
        <Field label="标签">{asset.tags.length > 0 ? asset.tags.join('、') : '暂无'}</Field>
        <Field label="文件">
          {asset.files.length > 0 ? (
            <ul className="list-disc pl-5">
              {asset.files.map((file) => (
                <li key={file.path}>
                  {file.originalName}
                  {file.role === 'preview' ? '（预览）' : ''}
                </li>
              ))}
            </ul>
          ) : (
            asset.originalName || '暂无'
          )}
        </Field>
      </dl>
      <AssetEditor asset={asset} />
      <Link href={`/?category=${asset.categoryId}`} className="mt-8 inline-block text-sm underline">
        返回该分类
      </Link>
    </article>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
