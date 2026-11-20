import type { ReactNode } from 'react'
import Link from 'next/link'
import { AssetEditor } from '@/app/(shell)/assets/[id]/asset-editor'
import { DownloadButton } from '@/app/(shell)/assets/[id]/download-button'
import { primaryButtonClass } from '@/components/styles'
import { formatDate, type Asset } from '@/lib/assets'
import { browseHref } from '@/lib/browse'
import { findCategory } from '@/lib/taxonomy'
import { fileExtension } from '@/lib/uploads'

export function AssetDetail({ asset }: { asset: Asset }) {
  const category = findCategory(asset.categoryId)
  const ext = fileExtension(asset.originalName || asset.files[0]?.originalName || '')

  return (
    <article className="mx-auto max-w-6xl pb-12">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="面包屑">
        <Link href="/" className="hover:text-ink">
          全部资产
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={browseHref({ categoryId: asset.categoryId })} className="hover:text-ink">
          {category?.name ?? asset.categoryId}
        </Link>
      </nav>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <div>
          <p className="mb-2 text-xs text-muted">预览</p>
          <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-mist shadow-[inset_0_0_0_1px_rgba(22,22,22,0.06)]">
            {asset.previewPath ? (
              <img src={`/assets/${asset.id}/preview`} alt="" className="max-h-[680px] w-full object-contain" />
            ) : (
              <div className="px-6 py-16 text-center">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted">{ext ? ext.toUpperCase() : '文件'}</p>
                <p className="mt-2 text-sm text-muted">无预览图</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted">标题</p>
          <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight break-words">{asset.title}</h1>
          <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="介绍" wide>
              <Multiline text={asset.intro} />
            </Field>
            <Field label="描述" wide>
              <Multiline text={asset.description} />
            </Field>
            <Field label="平台支持">{asset.platform || '暂无'}</Field>
            <Field label="版本号">{asset.version || '暂无'}</Field>
            <Field label="更新日期">{formatDate(asset.updatedAt)}</Field>
            <Field label="标签" wide>
              {asset.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <li key={`${tag}-${index}`} className="rounded-full bg-mist px-2.5 py-1 text-xs text-neutral-700">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : (
                '暂无'
              )}
            </Field>
            <Field label="下载按钮" wide>
              <DownloadButton assetId={asset.id} disabled={!asset.filePath} className={primaryButtonClass} />
              <p className="mt-2 text-sm text-muted">下载次数：{asset.downloadCount}</p>
            </Field>
          </dl>
        </div>
      </div>
      <dl className="mt-8 grid gap-5 border-t border-line pt-8 lg:grid-cols-2">
        <Field label="资产说明">
          <Multiline text={asset.notes} />
        </Field>
        <Field label="安装说明">
          <Multiline text={asset.install} />
        </Field>
        <Field label="备注">
          <Multiline text={asset.remark} />
        </Field>
        <Field label="文件">
          {asset.files.length > 0 ? (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {asset.files.map((file) => (
                <li key={file.path} className="flex items-center justify-between gap-3 px-3 py-2.5" title={file.originalName}>
                  <span className="min-w-0 truncate">{file.originalName}</span>
                  {file.role === 'preview' ? <span className="shrink-0 text-xs text-muted">预览</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            asset.originalName || '暂无'
          )}
        </Field>
      </dl>
      <AssetEditor asset={asset} />
      <Link href={browseHref({ categoryId: asset.categoryId })} className="mt-8 inline-flex text-sm text-muted hover:text-ink">
        返回该分类
      </Link>
    </article>
  )
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm leading-6 text-ink">{children}</dd>
    </div>
  )
}

function Multiline({ text }: { text: string }) {
  if (!text) return '暂无'
  return <span className="whitespace-pre-wrap">{text}</span>
}
