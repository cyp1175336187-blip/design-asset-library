'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { fieldClass, primaryButtonClass } from '@/components/styles'
import { ASSET_BUCKET, storageObjectPath } from '@/lib/storage'
import { getBrowserClient } from '@/lib/supabase/browser'
import { allCategories, categoryPathName, findCategory } from '@/lib/taxonomy'
import {
  effectiveUploadLimit,
  storageSizeMessage,
  uploadSizeError,
} from '@/lib/upload-size'
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

export function UploadForm({ configuredMaxBytes = null }: { configuredMaxBytes?: number | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const requestedCategory = params.get('category')?.trim() ?? ''
  const locked = requestedCategory ? findCategory(requestedCategory) : undefined
  const invalidCategory = Boolean(requestedCategory) && !locked
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [bucketLimit, setBucketLimit] = useState<unknown>(null)
  const categories = allCategories()

  useEffect(() => {
    let cancelled = false
    async function loadBucketLimit() {
      const supabase = await getBrowserClient()
      if (!supabase) return
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return
      const bucketResult = await supabase.storage.getBucket(ASSET_BUCKET)
      if (cancelled || bucketResult.error) return
      setBucketLimit(bucketResult.data?.file_size_limit ?? null)
    }
    void loadBucketLimit()
    return () => {
      cancelled = true
    }
  }, [])

  function sizeProblemFor(files: File[], limit: unknown = bucketLimit) {
    return uploadSizeError(
      files.map((file) => ({ name: file.name, size: file.size })),
      effectiveUploadLimit(limit, configuredMaxBytes),
    )
  }

  function applySelection(files: File[]) {
    const classified = classifySelectedFiles(files.map(toSelectedFile))
    if (classified.directoryPath) {
      setSummary(null)
      setError(DIRECTORY_UPLOAD_ERROR)
      return true
    }
    const sizeProblem = sizeProblemFor(files)
    setError(sizeProblem ?? selectionError(classified))
    setSummary(sizeProblem ? null : selectionSummary(classified))
    return false
  }

  function onFilesChanged(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const clear = applySelection([...(input.files ?? [])])
    if (clear) input.value = ''
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
      setSummary(null)
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
    const clear = applySelection(files)
    if (clear) input.value = ''
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    const category = locked?.id ?? String(new FormData(form).get('category') ?? '').trim()
    const input = form.elements.namedItem('files')
    const fileList = input instanceof HTMLInputElement ? [...(input.files ?? [])] : []
    const classified = classifySelectedFiles(fileList.map(toSelectedFile))
    const problem = selectionError(classified)
    if (classified.directoryPath && input instanceof HTMLInputElement) input.value = ''
    if (problem || !classified.primary) {
      setSummary(classified.directoryPath ? null : selectionSummary(classified))
      setError(problem ?? '请选择一个或多个文件。')
      return
    }
    if (!findCategory(category)) {
      setError(invalidCategory || category ? '分类无效。' : '请选择分类。')
      return
    }
    const knownSizeProblem = sizeProblemFor(fileList)
    if (knownSizeProblem) {
      setSummary(null)
      setError(knownSizeProblem)
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

    let remoteLimit = bucketLimit
    const bucketResult = await supabase.storage.getBucket(ASSET_BUCKET)
    if (!bucketResult.error) {
      remoteLimit = bucketResult.data?.file_size_limit ?? null
      setBucketLimit(remoteLimit)
    }
    const remoteSizeProblem = sizeProblemFor(fileList, remoteLimit)
    if (remoteSizeProblem) {
      setSummary(null)
      setError(remoteSizeProblem)
      setPending(false)
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
        if (uploadError) throw new Error(storageSizeMessage(uploadError.message, { name: file.name, size: file.size }))
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
      </label>
      {locked ? (
        <>
          <input type="hidden" name="category" value={locked.id} />
          <p className="text-sm text-muted">保存到 {categoryPathName(locked)}</p>
        </>
      ) : (
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
      )}
      {invalidCategory ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-danger">
          没有这个分类。请重新选择。
        </p>
      ) : null}
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
