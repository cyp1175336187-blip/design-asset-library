import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { storageObjectPath } from './storage.ts'
import {
  acceptAttribute,
  classifySelectedFiles,
  classifySelection,
  dataTransferHasDirectory,
  DIRECTORY_UPLOAD_ERROR,
  MAX_UPLOAD_FILES,
  filesToRetry,
  partialUploadMessage,
  planAssets,
  selectionError,
  selectionSummary,
} from './uploads.ts'

function many(count: number) {
  return Array.from({ length: count }, (_, index) => ({ relativePath: `file-${index}.otf` }))
}

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

describe('single and multiple files', () => {
  it('saves one design file as one asset named from that file', () => {
    const result = classifySelection([{ relativePath: 'Brand Display.otf', mime: '' }])
    assert.equal(selectionError(result), null)
    assert.equal(result.accepted.length, 1)
    assert.equal(result.title, 'Brand Display')
    assert.equal(result.primary?.originalName, 'Brand Display.otf')
    assert.equal(result.primary?.role, 'source')
    assert.equal(result.primary?.mime, 'font/otf')
    assert.equal(result.preview, null)
    assert.equal(selectionSummary(result), '这个文件会保存为同一条资产「Brand Display」。主文件：Brand Display.otf。没有单独的预览图。')
    assert.ok(result.tags.includes('Brand'))
    assert.ok(result.tags.includes('otf'))
  })

  it('uses a lone image as both the primary file and the preview', () => {
    const png = classifySelection([{ relativePath: 'shot.png', mime: 'image/png' }])
    assert.equal(png.primary?.role, 'preview')
    assert.equal(png.preview?.originalName, 'shot.png')
    assert.equal(png.primary?.mime, 'image/png')
    assert.equal(selectionSummary(png), '这个文件会保存为同一条资产「shot」，并作为预览图。')

    const jpeg = classifySelection([{ relativePath: 'shot.jpeg' }])
    assert.equal(jpeg.preview?.mime, 'image/jpeg')
    assert.equal(jpeg.primary?.role, 'preview')
  })

  it('keeps several selected files on one asset and prefers the design source', () => {
    const result = classifySelectedFiles([
      { name: 'cover.png', mime: 'image/png' },
      { name: 'Brand.otf', mime: 'application/octet-stream' },
      { name: 'extra.ttf', mime: 'font/ttf' },
    ])
    assert.equal(selectionError(result), null)
    assert.equal(result.accepted.length, 3)
    assert.equal(result.title, 'Brand')
    assert.equal(result.primary?.originalName, 'Brand.otf')
    assert.equal(result.primary?.role, 'source')
    assert.equal(result.primary?.mime, 'font/otf')
    assert.equal(result.preview?.originalName, 'cover.png')
    assert.equal(result.preview?.role, 'preview')
    assert.equal(result.accepted.find((file) => file.originalName === 'extra.ttf')?.role, 'source')
    assert.deepEqual(
      result.accepted.map((file) => storageObjectPath('user', 'asset', file.relativePath)),
      ['user/asset/cover.png', 'user/asset/Brand.otf', 'user/asset/extra.ttf'],
    )
    assert.equal(selectionSummary(result), '这 3 个文件会保存为同一条资产「Brand」。主文件：Brand.otf。预览：cover.png。')
  })

  it('keeps svg as the preview when a design source is selected with it', () => {
    const result = classifySelection([{ relativePath: 'mark.svg' }, { relativePath: 'layout.fig' }])
    assert.equal(result.title, 'layout')
    assert.equal(result.primary?.originalName, 'layout.fig')
    assert.equal(result.primary?.role, 'source')
    assert.equal(result.preview?.originalName, 'mark.svg')
    assert.equal(result.accepted.find((file) => file.extension === 'svg')?.role, 'source')
  })

  it('uses a lone svg as the preview and the primary file', () => {
    const result = classifySelection([{ relativePath: 'mark.svg', mime: 'image/svg+xml' }])
    assert.equal(result.primary?.role, 'preview')
    assert.equal(result.preview?.relativePath, 'mark.svg')
    assert.equal(result.primary?.mime, 'image/svg+xml')
  })
})

describe('poster assets', () => {
  it('creates one asset and cover for each of three images', () => {
    const result = classifySelection([
      { relativePath: '海报一.jpg', mime: 'image/jpeg' },
      { relativePath: '海报二.jpeg' },
      { relativePath: '海报三.png', mime: 'image/png' },
    ])
    assert.equal(selectionError(result), null)
    const plans = planAssets(result)
    assert.equal(plans.length, 3)
    assert.deepEqual(
      plans.map((plan) => plan.primary.originalName),
      ['海报一.jpg', '海报二.jpeg', '海报三.png'],
    )
    for (const plan of plans) {
      assert.equal(plan.accepted.length, 1)
      assert.equal(plan.preview?.relativePath, plan.primary.relativePath)
      assert.equal(plan.primary.role, 'preview')
    }
    assert.match(selectionSummary(result) ?? '', /将创建 3 条资产/)
    assert.equal(planAssets(classifySelection([{ relativePath: 'a.webp' }, { relativePath: 'b.webp' }])).length, 2)
    assert.deepEqual(
      plans.map((plan) => plan.accepted.map((file) => file.relativePath)),
      [['海报一.jpg'], ['海报二.jpeg'], ['海报三.png']],
    )
    const requests = plans.map((plan) => ({
      category: 'poster-design',
      title: plan.title,
      files: plan.accepted.map((file) => file.relativePath),
    }))
    assert.deepEqual(
      requests.map((request) => request.category),
      ['poster-design', 'poster-design', 'poster-design'],
    )
  })

  it('keeps a design source and its preview on one asset', () => {
    const result = classifySelection([{ relativePath: '海报.psd' }, { relativePath: '海报.jpg' }])
    const plans = planAssets(result)
    assert.equal(plans.length, 1)
    assert.equal(plans[0]?.primary.originalName, '海报.psd')
    assert.equal(plans[0]?.preview?.originalName, '海报.jpg')
    assert.match(selectionSummary(result) ?? '', /同一条资产/)
  })

  it('reports created assets and keeps only failed files for retry', () => {
    assert.deepEqual(filesToRetry(['海报一.jpg', '海报二.jpg', '海报三.jpg'], ['海报二.jpg']), ['海报二.jpg'])
    const message = partialUploadMessage(2, [{ name: '海报二.jpg', message: '超过了允许的大小。' }])
    assert.match(message ?? '', /已创建 2 条资产/)
    assert.match(message ?? '', /海报二\.jpg/)
    assert.match(message ?? '', /重新上传/)
    assert.match(partialUploadMessage(0, [{ name: '海报一.jpg', message: '上传失败' }]) ?? '', /没有创建资产/)
  })
})

describe('folder rejection', () => {
  it('rejects a nested path instead of flattening it', () => {
    const result = classifySelection([{ relativePath: 'Icons/a.otf' }])
    assert.equal(result.accepted.length, 0)
    assert.equal(result.primary, null)
    assert.equal(selectionError(result), DIRECTORY_UPLOAD_ERROR)
  })

  it('rejects windows separators and parent traversal', () => {
    assert.equal(selectionError(classifySelection([{ relativePath: 'Icons\\a.otf' }])), DIRECTORY_UPLOAD_ERROR)
    const traversal = classifySelection([{ relativePath: 'Icons/../secret.otf' }])
    assert.equal(traversal.accepted.length, 0)
    assert.equal(selectionError(traversal), DIRECTORY_UPLOAD_ERROR)
  })

  it('rejects an expanded directory drop even when file names are flat', () => {
    const result = classifySelectedFiles([
      { name: 'a.otf', webkitRelativePath: 'Icons/a.otf', mime: 'font/otf' },
      { name: 'b.png', webkitRelativePath: 'Icons/b.png', mime: 'image/png' },
    ])
    assert.equal(result.accepted.length, 0)
    assert.equal(selectionError(result), DIRECTORY_UPLOAD_ERROR)
  })

  it('prefers the folder error when a batch also contains an unsupported file', () => {
    const result = classifySelection([{ relativePath: 'notes.txt' }, { relativePath: 'Folder/a.otf' }])
    assert.equal(selectionError(result), DIRECTORY_UPLOAD_ERROR)
  })

  it('detects a directory entry without reading its children', () => {
    assert.equal(
      dataTransferHasDirectory({
        items: [{ kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true }) }],
        files: [],
      }),
      true,
    )
    assert.equal(
      dataTransferHasDirectory({
        items: [{ kind: 'file', webkitGetAsEntry: () => ({ isDirectory: false }) }],
        files: [{ webkitRelativePath: 'Icons/a.otf' }],
      }),
      true,
    )
    assert.equal(
      dataTransferHasDirectory({
        items: [{ kind: 'file', webkitGetAsEntry: () => ({ isDirectory: false }) }],
        files: [{ webkitRelativePath: '' }],
      }),
      false,
    )
    assert.equal(
      dataTransferHasDirectory({
        items: [{ kind: 'string' }],
        files: [{ webkitRelativePath: 'plain.otf' }],
      }),
      false,
    )
  })
})

describe('selection guards', () => {
  it('rejects an empty selection', () => {
    assert.equal(selectionError(classifySelection([])), '请选择一个或多个文件。')
    assert.equal(selectionError(classifySelectedFiles([])), '请选择一个或多个文件。')
  })

  it('rejects unsupported files in an otherwise valid selection', () => {
    const result = classifySelection([{ relativePath: 'a.otf' }, { relativePath: 'notes.txt' }])
    assert.equal(result.accepted.length, 0)
    assert.match(selectionError(result) ?? '', /不支持的文件：notes\.txt/)
    assert.match(selectionError(result) ?? '', /jpeg/)
  })

  it('rejects duplicate file names', () => {
    const result = classifySelection([{ relativePath: ' a.otf ' }, { relativePath: 'a.otf' }])
    assert.match(selectionError(result) ?? '', /文件名重复：a\.otf/)
    assert.equal(result.accepted.length, 0)
  })

  it('rejects a file name that normalizes away', () => {
    assert.match(selectionError(classifySelection([{ relativePath: '..' }])) ?? '', /文件名无效/)
    assert.match(selectionError(classifySelection([{ relativePath: '   ' }])) ?? '', /文件名无效/)
  })

  it('accepts 200 files and rejects 201', () => {
    assert.equal(selectionError(classifySelection(many(MAX_UPLOAD_FILES))), null)
    const overflow = classifySelection(many(MAX_UPLOAD_FILES + 1))
    assert.equal(overflow.accepted.length, 0)
    assert.match(selectionError(overflow) ?? '', /一次最多上传 200 个文件/)
  })

  it('keeps a multi-dot title and allows spaces in a file name', () => {
    const result = classifySelection([{ relativePath: 'my.font.otf' }, { relativePath: 'my font preview.png' }])
    assert.equal(result.title, 'my.font')
    assert.equal(result.preview?.originalName, 'my font preview.png')
  })
})

describe('upload surfaces', () => {
  it('offers individual files and does not enable a folder picker', () => {
    const form = source('../app/(shell)/upload/upload-form.tsx')
    const page = source('../app/(shell)/upload/page.tsx')
    const route = source('../app/api/upload/route.ts')
    const readme = source('../README.md')
    const library = source('./uploads.ts')

    assert.match(form, /planAssets/)
    assert.match(form, /filesToRetry/)
    assert.match(form, /multiple/)
    assert.match(form, /onDragOverCapture/)
    assert.match(form, /onDropCapture/)
    assert.match(form, /dataTransferHasDirectory/)
    assert.match(form, /new DataTransfer/)
    assert.doesNotMatch(form, /webkitdirectory/)
    assert.doesNotMatch(form, /directory\s*[:=]/)
    assert.doesNotMatch(form, /createReader|readEntries/)
    assert.doesNotMatch(form, /classifyFolder|folderError/)

    assert.match(page, /同一条资产/)
    assert.match(page, /拖入文件夹会被拒绝/)
    assert.doesNotMatch(page, /上传文件夹|一次选择一个文件夹/)

    assert.match(route, /classifySelection/)
    assert.match(route, /selectionError/)
    assert.doesNotMatch(route, /classifyFolder|folderError/)

    assert.match(readme, /每张图片各自成为一条资产/)
    assert.match(readme, /仍保存为\*\*一条\*\*资产/)
    assert.match(readme, /不会递归上传/)
    assert.doesNotMatch(readme, /选择\*\*一个\*\*文件夹/)

    assert.doesNotMatch(library, /classifyFolder|folderError|MAX_FOLDER_FILES|webkitdirectory/)
    assert.match(acceptAttribute(), /\.otf/)
    assert.match(acceptAttribute(), /\.jpeg/)
    assert.doesNotMatch(acceptAttribute(), /directory/)
  })
})
