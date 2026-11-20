'use client'

import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { fieldClass, primaryButtonClass } from '@/components/styles'
import { ASSET_BUCKET, storageObjectPath } from '@/lib/storage'
import { getBrowserClient } from '@/lib/supabase/browser'
import { allCategories, categoryPathName } from '@/lib/taxonomy'
import {
  acceptAttribute,
  classifySelectedFiles,
  dataTransferHasDirectory,
  DIRECTORY_UPLOAD_ERROR,
  normalizeRelativePath,
  selectionError,
  selectionSummary,
  type SelectedFileInput,
} from '@/lib/uploads'

export function UploadForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const categories = allCategories()

  function onFilesChanged(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const classified = classifySelectedFiles(selectedFrom(input.files))
    if (classified.directoryPath) input.value = ''
    setError(selectionError(classified))
    setSummary(selectionSummary(classified))
  }

  function onDragOverCapture(event: DragEvent<HTMLFormElement>) {
    if (!event.dataTransfer || !dragHasFiles(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  // Capture runs before the file input accepts the drop, so a directory never becomes the selection.
  function onDropCapture(event: DragEvent<HTMLFormElement>) {
    const transfer = event.dataTransfer
    if (!transfer || !dragHasFiles(transfer)) return
    if (directoryDropped(transfer)) {
      event.preventDefault()
      event.stopPropagation()
      setError(DIRECTORY_UPLOAD_ERROR)
      return
    }
    const files = [...transfer.files]
    if (files.length === 0) return
    event.preventDefault()
    event.stopPropagation()
    const input = event.currentTarget.elements.namedItem('files')
    if (!(input instanceof HTMLInputElement)) return
    const next = new DataTransfer()
    for (const file of files) next.items.add(file)
    input.files = next.files
    const classified = classifySelectedFiles(files.map(toSelectedFile))
    if (classified.directoryPath) input.value = ''
    setError(selectionError(classified))
    setSummary(selectionSummary(classified))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    const category = String(new FormData(form).get('category') ?? '')
    const input = form.elements.namedItem('files')
    const fileList = input instanceof HTMLInputElement ? [...(input.files ?? [])] : []
    const classified = classifySelectedFiles(fileList.map(toSelectedFile))
    const problem = selectionError(classified)
    if (problem || !classified.primary) {
      if (classified.directoryPath && input instanceof HTMLInputElement) input.value = ''
      setSummary(selectionSummary(classified))
      setError(problem ?? '请选择一个或多个文件。')
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
      const relativePath = normalizeRelativePath(file.name)
      if (relativePath && !filesByPath.has(relativePath)) filesByPath.set(relativePath, file)
    }
    try {
      for (const [index, item] of classified.accepted.entries()) {
        const file = filesByPath.get(item.relativePath)
        if (!file) throw new Error(`找不到 ${item.originalName}`)
        const path = storageObjectPath(userData.user.id, assetId, item.relativePath)
        setProgress(`正在上传 ${index + 1}/${classified.accepted.length}：${item.originalName}`)
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
    <form onSubmit={onSubmit} onDragOverCapture={onDragOverCapture} onDropCapture={onDropCapture} className="mt-8 space-y-5">
      <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-mist px-6 py-14 text-center transition-colors hover:border-neutral-500 focus-within:border-ink">
        <input name="files" type="file" required multiple accept={acceptAttribute()} onChange={onFilesChanged} className="sr-only" />
        <span className="text-sm font-medium text-ink">选择文件</span>
        <span className="mt-2 max-w-md text-sm leading-6 text-muted">可以选一个或多个文件。拖入文件夹会被拒绝，不会上传其中的内容。</span>
      </label>
      <label className="block text-sm">
        分类
        <select name="category" required className={fieldClass} defaultValue={categories[0]?.id ?? ''}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {categoryPathName(category)}
            </option>
          ))}
        </select>
      </label>
      {summary ? <p className="rounded-xl bg-mist px-4 py-3 text-sm leading-6 text-neutral-700">{summary}</p> : null}
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-danger">
          {error}
        </p>
      ) : null}
      {progress ? <p className="text-sm text-muted">{progress}</p> : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? '正在上传…' : '上传'}
      </button>
    </form>
  )
}

function toSelectedFile(file: File): SelectedFileInput {
  return { name: file.name, webkitRelativePath: file.webkitRelativePath, mime: file.type }
}

function selectedFrom(files: FileList | null) {
  return [...(files ?? [])].map(toSelectedFile)
}

function dragHasFiles(transfer: DataTransfer) {
  return Array.from(transfer.types).includes('Files')
}

function directoryDropped(transfer: DataTransfer) {
  return dataTransferHasDirectory({
    items: [...transfer.items].map((item) => ({
      kind: item.kind,
      webkitGetAsEntry: () => item.webkitGetAsEntry(),
    })),
    files: [...transfer.files].map((file) => ({ webkitRelativePath: file.webkitRelativePath })),
  })
}
