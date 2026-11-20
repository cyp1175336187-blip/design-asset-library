import { UploadForm } from '@/app/(shell)/upload/upload-form'

export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <section className="max-w-xl">
      <h1 className="text-xl font-semibold">上传文件</h1>
      <p className="mt-2 text-sm text-neutral-600">
        可以选择一个文件，也可以一次选择多个文件。同一次选择会保存为同一条资产，不会各自变成独立资产。请不要选择文件夹；拖入文件夹会被拒绝，里面的文件不会上传。
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        支持 otf、ttf、svg、psd、fig、figma，以及 png、jpg、jpeg、webp。设计源文件作为主文件，位图作为预览；只上传 svg 时，svg 同时作为预览和主文件。标题默认使用主文件名，标签按文件名生成，上传后可以修改。同名文件或不支持的格式会阻止本次上传。
      </p>
      <UploadForm />
    </section>
  )
}
