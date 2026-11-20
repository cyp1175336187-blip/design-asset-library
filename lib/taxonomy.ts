export type Category = {
  id: string
  name: string
  children?: Category[]
}

export type TaxonomySection = {
  id: string
  name: string
  categories: Category[]
}

export const taxonomy: TaxonomySection[] = [
  {
    id: 'design',
    name: '设计类别',
    categories: [
      { id: 'font-design', name: '字体设计' },
      { id: 'logo-design', name: 'Logo 设计' },
      { id: 'poster-design', name: '海报设计' },
      { id: 'cover-design', name: '封面设计' },
      { id: 'banner-design', name: 'Banner 设计' },
      { id: 'ui-design', name: '界面设计' },
    ],
  },
  {
    id: 'tools',
    name: '工具类别',
    categories: [
      { id: 'software', name: '软件类' },
      { id: 'plugins', name: '插件类' },
      {
        id: 'utilities',
        name: '工具类',
        children: [
          { id: 'canvas', name: '画布' },
          { id: 'image-effects', name: '图片在线效果' },
          { id: 'poster-generator', name: '海报生成器' },
        ],
      },
    ],
  },
]

function walk(categories: Category[], visit: (category: Category) => void) {
  for (const category of categories) {
    visit(category)
    if (category.children) {
      walk(category.children, visit)
    }
  }
}

export function allCategories(): Category[] {
  const list: Category[] = []
  for (const section of taxonomy) {
    walk(section.categories, (category) => {
      list.push(category)
    })
  }
  return list
}

export function findCategory(id: string): Category | undefined {
  return findCategoryContext(id)?.category
}

export type CategoryLocation = {
  section: TaxonomySection
  ancestors: Category[]
  category: Category
}

export function findCategoryContext(id: string): CategoryLocation | null {
  for (const section of taxonomy) {
    const match = findInCategories(section.categories, [], id)
    if (match) return { section, ancestors: match.ancestors, category: match.category }
  }
  return null
}

export function categoryPathName(category: Category) {
  const context = findCategoryContext(category.id)
  if (!context || context.ancestors.length === 0) return category.name
  return `${context.ancestors.map((item) => item.name).join(' / ')} / ${category.name}`
}

function findInCategories(
  categories: Category[],
  ancestors: Category[],
  id: string,
): { ancestors: Category[]; category: Category } | null {
  for (const category of categories) {
    if (category.id === id) return { ancestors, category }
    if (category.children?.length) {
      const nested = findInCategories(category.children, ancestors.concat(category), id)
      if (nested) return nested
    }
  }
  return null
}

export function categoryMatchIds(id: string): Set<string> | null {
  const category = findCategory(id)
  if (!category) {
    return null
  }
  const ids = new Set<string>()
  walk([category], (node) => {
    ids.add(node.id)
  })
  return ids
}
