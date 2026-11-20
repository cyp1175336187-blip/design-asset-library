'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { fieldClass, primaryButtonClass } from '@/components/styles'
import type { Asset } from '@/lib/assets'
import { allCategories, categoryPathName } from '@/lib/taxonomy'

export function AssetEditor({ asset }: { asset: Asset }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)
  const categories = allCategories()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setSaved(false)
    setError(null)
    const form = new FormData(event.currentTarget)
    const response = await fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(form.get('title') ?? ''),
        description: String(form.get('description') ?? ''),
        intro: String(form.get('intro') ?? ''),
        category: String(form.get('category') ?? ''),
        tags: String(form.get('tags') ?? ''),
        remark: String(form.get('remark') ?? ''),
        platform: String(form.get('platform') ?? ''),
        version: String(form.get('version') ?? ''),
        assetNotes: String(form.get('assetNotes') ?? ''),
        installNotes: String(form.get('installNotes') ?? ''),
      }),
    })
    const body = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(body.error ?? '保存失败')
      setPending(false)
      return
    }
    setSaved(true)
    setPending(false)
    router.refresh()
  }

  return (
    <form key={asset.updatedAt} onSubmit={onSubmit} className="mt-10 border-t border-line pt-8">
      <h2 className="text-lg font-semibold">编辑</h2>
      <p className="mt-1 text-sm text-muted">保存后只更新这条资产的资料，不会重新上传文件。</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="标题" name="title" defaultValue={asset.title} wide />
        <Field label="介绍" name="intro" defaultValue={asset.intro} multiline wide />
        <Field label="描述" name="description" defaultValue={asset.description} multiline wide />
        <label className="block text-sm">
          分类
          <select name="category" defaultValue={asset.categoryId} className={fieldClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryPathName(category)}
              </option>
            ))}
          </select>
        </label>
        <Field label="标签" name="tags" defaultValue={asset.tags.join(', ')} />
        <Field label="平台支持" name="platform" defaultValue={asset.platform} />
        <Field label="版本号" name="version" defaultValue={asset.version} />
        <Field label="备注" name="remark" defaultValue={asset.remark} multiline wide />
        <Field label="资产说明" name="assetNotes" defaultValue={asset.notes} multiline wide />
        <Field label="安装说明" name="installNotes" defaultValue={asset.install} multiline wide />
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {saved ? <p className="mt-4 text-sm text-accent">已保存</p> : null}
      <button type="submit" disabled={pending} className={`${primaryButtonClass} mt-4`}>
        {pending ? '正在保存…' : '保存'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  multiline = false,
  wide = false,
}: {
  label: string
  name: string
  defaultValue: string
  multiline?: boolean
  wide?: boolean
}) {
  return (
    <label className={`block text-sm ${wide ? 'md:col-span-2' : ''}`}>
      {label}
      {multiline ? <textarea name={name} defaultValue={defaultValue} rows={4} className={fieldClass} /> : <input name={name} defaultValue={defaultValue} className={fieldClass} />}
    </label>
  )
}
