import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { categoryPathName, findCategory, findCategoryContext } from './taxonomy.ts'

describe('taxonomy', () => {
  it('keeps nested categories addressable', () => {
    const context = findCategoryContext('canvas')
    assert.equal(context?.category.name, '画布')
    assert.deepEqual(
      context?.ancestors.map((item) => item.id),
      ['utilities'],
    )
    assert.equal(context?.section.id, 'tools')
    assert.equal(findCategory('canvas')?.name, '画布')
    assert.equal(categoryPathName(context!.category), '工具类 / 画布')
  })

  it('returns no context for an unknown id', () => {
    assert.equal(findCategory('missing'), undefined)
    assert.equal(findCategoryContext('missing'), null)
  })
})
