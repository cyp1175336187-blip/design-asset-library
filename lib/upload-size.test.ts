import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { uploadHref } from './browse.ts'
import {
  effectiveUploadLimit,
  formatByteSize,
  storageSizeMessage,
  uploadSizeError,
} from './upload-size.ts'

const MB = 1024 * 1024

describe('upload size', () => {
  it('does not invent a limit when the bucket limit is empty', () => {
    assert.equal(effectiveUploadLimit(null, null), null)
    assert.equal(effectiveUploadLimit(undefined, ''), null)
    assert.equal(uploadSizeError([{ name: 'large.psd', size: 80 * MB }], null), null)
  })

  it('uses the smaller of the bucket limit and the configured limit', () => {
    assert.equal(effectiveUploadLimit(50 * MB, 10 * MB), 10 * MB)
    assert.equal(effectiveUploadLimit(null, String(50 * MB)), 50 * MB)
    assert.equal(effectiveUploadLimit(50 * MB, null), 50 * MB)
  })

  it('names each file that exceeds a known limit and does not start the upload', () => {
    const message = uploadSizeError(
      [
        { name: 'PDP-1080x1080-03-CHUPb1f1.psd', size: 80 * MB },
        { name: 'PDP-1080x1080-03-CHUPb1f1.jpg', size: 2 * MB },
        { name: 'other.psd', size: 51 * MB },
      ],
      50 * MB,
    )
    assert.match(message ?? '', /PDP-1080x1080-03-CHUPb1f1\.psd/)
    assert.match(message ?? '', /other\.psd/)
    assert.doesNotMatch(message ?? '', /CHUPb1f1\.jpg/)
    assert.match(message ?? '', /50 MB/)
    assert.match(message ?? '', /不会开始上传/)
  })

  it('turns the storage refusal into a Chinese message for the file being uploaded', () => {
    const message = storageSizeMessage('The object exceeded the maximum allowed size', {
      name: 'PDP-1080x1080-03-CHUPb1f1.psd',
      size: 80 * MB,
    })
    assert.match(message, /PDP-1080x1080-03-CHUPb1f1\.psd/)
    assert.match(message, /80 MB/)
    assert.match(message, /全局文件大小限制/)
    assert.doesNotMatch(message, /maximum allowed size/)
  })

  it('keeps a limit stated by storage', () => {
    const message = storageSizeMessage('The object exceeded the maximum allowed size in your global settings (50 MB)', {
      name: 'poster.psd',
      size: 80 * MB,
    })
    assert.match(message, /50 MB/)
    assert.match(message, /poster\.psd/)
  })

  it('formats whole megabytes without a trailing decimal', () => {
    assert.equal(formatByteSize(50 * MB), '50 MB')
  })
})

describe('upload category link', () => {
  it('carries a real category and drops an unknown one', () => {
    assert.equal(uploadHref('banner-design'), '/upload?category=banner-design')
    assert.equal(uploadHref('canvas'), '/upload?category=canvas')
    assert.equal(uploadHref('missing'), '/upload')
    assert.equal(uploadHref(null), '/upload')
  })
})

describe('upload page copy', () => {
  it('keeps one short explanation and the size check', () => {
    const page = readFileSync(new URL('../app/(shell)/upload/page.tsx', import.meta.url), 'utf8')
    const form = readFileSync(new URL('../app/(shell)/upload/upload-form.tsx', import.meta.url), 'utf8')
    assert.match(page, /同一条资产/)
    assert.match(page, /拖入文件夹会被拒绝/)
    assert.doesNotMatch(page, /设计源文件作为主文件/)
    assert.match(form, /uploadSizeError/)
    assert.match(form, /storageSizeMessage/)
    assert.match(form, /type="hidden"/)
    assert.doesNotMatch(form, /webkitdirectory/)
  })
})
