import { Suspense } from 'react'
import { UploadForm } from '@/app/(shell)/upload/upload-form'
import { parseByteLimit } from '@/lib/upload-size'

export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-3xl pb-12">
      <p className="text-xs text-muted">上传</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-tight">上传文件</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        jpg、jpeg、png、webp 会各自成为一条资产。同时选了 psd、fig 等源文件时，这些文件仍保存为同一条资产。拖入文件夹会被拒绝。
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">加载上传表单…</p>}>
        <UploadForm configuredMaxBytes={parseByteLimit(process.env.MAX_UPLOAD_BYTES)} />
      </Suspense>
    </section>
  )
}
