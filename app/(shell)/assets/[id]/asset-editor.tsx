'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { Asset } from '@/lib/assets'
import { allCategories } from '@/lib/taxonomy'

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
    <form key={asset.updatedAt} onSubmit={onSubmit} className="mt-8 space-y-3 border-t pt-6">
      <h2 className="text-lg font-medium">编辑</h2>
      <Field label="标题" name="title" defaultValue={asset.title} />
      <Field label="介绍" name="intro" defaultValue={asset.intro} multiline />
      <Field label="描述" name="description" defaultValue={asset.description} multiline />
      <label className="block text-sm">
        分类
        <select name="category" defaultValue={asset.categoryId} className="mt-1 w-full border px-3 py-2">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <Field label="标签" name="tags" defaultValue={asset.tags.join(', ')} />
      <Field label="备注" name="remark" defaultValue={asset.remark} multiline />
      <Field label="平台支持" name="platform" defaultValue={asset.platform} />
      <Field label="版本号" name="version" defaultValue={asset.version} />
      <Field label="资产说明" name="assetNotes" defaultValue={asset.notes} multiline />
      <Field label="安装说明" name="installNotes" defaultValue={asset.install} multiline />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {saved ? <p className="text-sm text-neutral-600">已保存</p> : null}
      <button type="submit" disabled={pending} className="border px-3 py-2 text-sm disabled:opacity-60">
        {pending ? '正在保存…' : '保存'}
      </button>
    </form>
  )
}

function Field({ label, name, defaultValue, multiline = false }: { label: string; name: string; defaultValue: string; multiline?: boolean }) {
  const className = 'mt-1 w-full border px-3 py-2'
  return (
    <label className="block text-sm">
      {label}
      {multiline ? <textarea name={name} defaultValue={defaultValue} rows={3} className={className} /> : <input name={name} defaultValue={defaultValue} className={className} />}
    </label>
  )
}
