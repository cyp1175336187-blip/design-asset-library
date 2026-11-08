import { UploadForm } from '@/app/(shell)/upload/upload-form'

export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <section className="max-w-xl">
      <h1 className="text-xl font-semibold">上传文件夹</h1>
      <p className="mt-2 text-sm text-neutral-600">一次选择一个文件夹。支持 otf、ttf、svg、psd、fig、figma，以及 png、jpg、webp 预览图。标签会先按文件名生成，上传后可以修改。</p>
      <UploadForm />
    </section>
  )
}
