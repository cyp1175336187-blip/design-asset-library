'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ASSET_BUCKET, storageObjectPath } from '@/lib/storage'
import { getBrowserClient } from '@/lib/supabase/browser'
import { allCategories } from '@/lib/taxonomy'
import { classifyFolder, folderError, normalizeRelativePath } from '@/lib/uploads'

export function UploadForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const categories = allCategories()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    const category = String(new FormData(form).get('category') ?? '')
    const input = form.elements.namedItem('folder')
    const fileList = input instanceof HTMLInputElement ? [...(input.files ?? [])] : []
    const classified = classifyFolder(
      fileList.map((file) => ({
        relativePath: file.webkitRelativePath || file.name,
        mime: file.type,
      })),
    )
    const problem = folderError(classified)
    if (problem) {
      setError(problem)
      return
    }

    setPending(true)
    const supabase = await getBrowserClient()
    if (!supabase) {
      setError('尚未配置 Supabase。')
      setPending(false)
      return
    }
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      window.location.href = '/login'
      return
    }

    const assetId = crypto.randomUUID()
    const uploaded: string[] = []
    const filesByPath = new Map<string, File>()
    for (const file of fileList) {
      const relativePath = normalizeRelativePath(file.webkitRelativePath || file.name)
      if (relativePath) filesByPath.set(relativePath, file)
    }
    try {
      for (const [index, item] of classified.accepted.entries()) {
        const file = filesByPath.get(item.relativePath)
        if (!file) throw new Error(`找不到 ${item.originalName}`)
        const path = storageObjectPath(userData.user.id, assetId, item.relativePath)
        setProgress(`正在上传 ${index + 1}/${classified.accepted.length}`)
        const { error: uploadError } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
          contentType: item.mime,
          upsert: false,
        })
        if (uploadError) throw new Error(uploadError.message)
        uploaded.push(path)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          category,
          title: classified.title,
          files: classified.accepted.map((file) => ({ relativePath: file.relativePath, mime: file.mime })),
        }),
      })
      const body = (await response.json()) as { id?: string; error?: string }
      if (!response.ok || !body.id) throw new Error(body.error ?? '保存资产信息失败')
      router.push(`/assets/${body.id}`)
      router.refresh()
    } catch (uploadError) {
      if (uploaded.length > 0) {
        await supabase.storage.from(ASSET_BUCKET).remove(uploaded)
      }
      setError(uploadError instanceof Error ? uploadError.message : '上传失败')
      setPending(false)
      setProgress(null)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <label className="block text-sm">
        文件夹
        <input
          name="folder"
          type="file"
          required
          multiple
          className="mt-1 block w-full text-sm"
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        />
      </label>
      <label className="block text-sm">
        分类
        <select name="category" required className="mt-1 w-full border px-3 py-2" defaultValue={categories[0]?.id ?? ''}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {progress ? <p className="text-sm text-neutral-600">{progress}</p> : null}
      <button type="submit" disabled={pending} className="border px-3 py-2 text-sm disabled:opacity-60">
        {pending ? '正在上传…' : '上传'}
      </button>
    </form>
  )
}
