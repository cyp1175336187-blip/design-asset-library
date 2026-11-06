import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getAsset } from '@/lib/assets'
import { findCategory } from '@/lib/taxonomy'

type AssetPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AssetPageProps): Promise<Metadata> {
  const { id } = await params
  const asset = getAsset(id)
  return {
    title: asset ? `${asset.title} · 设计资产库` : '未找到资产',
  }
}

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params
  const asset = getAsset(id)

  if (!asset) {
    return (
      <section>
        <h1 className="text-xl font-semibold">未找到该资产</h1>
        <p className="mt-2 text-neutral-600">这个链接没有对应的示例资产。</p>
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
        <Field label="介绍">{asset.intro}</Field>
        <Field label="标题">{asset.title}</Field>
        <Field label="描述">{asset.description}</Field>
        <Field label="平台支持">{asset.platforms.join('、')}</Field>
        <Field label="版本号">{asset.version}</Field>
        <Field label="更新日期">{asset.updatedAt}</Field>
        <Field label="下载按钮">
          <button type="button" disabled className="border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60">
            下载
          </button>
        </Field>
        <Field label="预览">
          <div className="flex h-48 items-center justify-center border bg-neutral-100 text-neutral-600">{asset.preview}</div>
        </Field>
        <Field label="资产说明">{asset.notes}</Field>
        <Field label="安装说明">{asset.install}</Field>
      </dl>
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
