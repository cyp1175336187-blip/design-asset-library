import { categoryMatchIds } from '@/lib/taxonomy'

export type Asset = {
  id: string
  title: string
  description: string
  tags: string[]
  categoryId: string
  intro: string
  platforms: string[]
  version: string
  updatedAt: string
  preview: string
  notes: string
  install: string
}

export const mockAssets: Asset[] = [
  {
    id: 'source-han-sans',
    title: '思源黑体样本',
    description: '一套用于界面和海报的黑体字体样本。',
    tags: ['黑体', '中文', '开源'],
    categoryId: 'font-design',
    intro: '展示思源黑体在标题和正文中的字重对比，方便挑选界面字体。',
    platforms: ['macOS', 'Windows', 'Web'],
    version: '1.2.0',
    updatedAt: '2026-02-18',
    preview: '黑体字形预览',
    notes: '示例资产，未包含可下载字体文件。',
    install: '将字体文件安装到系统字体目录后，重新打开设计软件即可选用。',
  },
  {
    id: 'kai-display',
    title: '展示楷体',
    description: '适合封面标题的楷体风格字体。',
    tags: ['楷体', '标题'],
    categoryId: 'font-design',
    intro: '偏标题使用的楷体，笔画清晰，适合封面和海报主标题。',
    platforms: ['macOS', 'Windows'],
    version: '0.9.1',
    updatedAt: '2026-01-09',
    preview: '楷体标题预览',
    notes: '仅提供样式说明，不含商用授权文件。',
    install: '解压后双击字体文件，按系统提示安装。',
  },
  {
    id: 'mark-grid',
    title: '网格标志模板',
    description: '基于网格的 Logo 起稿模板。',
    tags: ['Logo', '几何'],
    categoryId: 'logo-design',
    intro: '用统一网格约束图形比例，适合从草图开始做标志。',
    platforms: ['Figma', 'Illustrator'],
    version: '2.0.0',
    updatedAt: '2026-03-02',
    preview: '网格标志预览',
    notes: '模板中的图形可替换，网格层建议保留到定稿前。',
    install: '在设计软件中打开源文件，复制画板到当前项目。',
  },
  {
    id: 'spring-poster',
    title: '春季活动海报',
    description: '竖版活动海报版式，含标题、时间和地点。',
    tags: ['海报', '活动'],
    categoryId: 'poster-design',
    intro: '一张可替换文案的竖版活动海报，用于线下张贴或社交发布。',
    platforms: ['Photoshop', 'Figma'],
    version: '1.0.3',
    updatedAt: '2026-03-21',
    preview: '竖版海报预览',
    notes: '出血位已留出，打印前请核对实际纸张尺寸。',
    install: '打开源文件后替换文字和主视觉，再导出 PDF 或 PNG。',
  },
  {
    id: 'album-cover',
    title: '专辑封面版式',
    description: '方形封面的图文排版示例。',
    tags: ['封面', '方形'],
    categoryId: 'cover-design',
    intro: '方形封面骨架，区分主图、标题和辅文的位置。',
    platforms: ['Photoshop', 'Figma'],
    version: '1.1.0',
    updatedAt: '2025-12-11',
    preview: '方形封面预览',
    notes: '示例图片为占位色块，替换时注意主体不要贴边。',
    install: '将封面源文件放入项目，按平台要求导出 1:1 图片。',
  },
  {
    id: 'shop-banner',
    title: '店铺横幅',
    description: '电商首页横幅尺寸示例。',
    tags: ['Banner', '电商'],
    categoryId: 'banner-design',
    intro: '适配常见店铺首页宽度的横幅，包含主标题和行动按钮位置。',
    platforms: ['Figma', 'Web'],
    version: '3.0.1',
    updatedAt: '2026-04-02',
    preview: '横幅尺寸预览',
    notes: '同时给了桌面和窄屏两种画板。',
    install: '按目标渠道的像素尺寸导出，并压缩后再上传到店铺后台。',
  },
  {
    id: 'dashboard-kit',
    title: '后台界面套件',
    description: '常见后台列表与表单界面。',
    tags: ['界面', '组件'],
    categoryId: 'ui-design',
    intro: '包含列表、筛选条和表单的后台界面样例，用于对齐布局。',
    platforms: ['Figma', 'Web'],
    version: '1.4.2',
    updatedAt: '2026-04-19',
    preview: '后台界面预览',
    notes: '组件未绑定真实数据，只展示结构。',
    install: '在 Figma 中启用该库，或按标注在前端页面中复刻间距。',
  },
  {
    id: 'blank-canvas',
    title: '空白画布',
    description: '可设定宽高的空白画布入口。',
    tags: ['画布', '尺寸'],
    categoryId: 'canvas',
    intro: '从指定宽高开始一张空白画布，适合临时拼贴素材。',
    platforms: ['Web'],
    version: '0.3.0',
    updatedAt: '2026-05-06',
    preview: '空白画布预览',
    notes: '当前只展示入口说明，不会创建真实画布文件。',
    install: '在工具页选择尺寸后进入编辑。本页按钮为占位。',
  },
  {
    id: 'duotone',
    title: '双色调效果',
    description: '为图片套用双色调预览。',
    tags: ['图片', '滤镜'],
    categoryId: 'image-effects',
    intro: '用两种颜色替换图片高光和阴影，便于快速看效果。',
    platforms: ['Web'],
    version: '0.8.0',
    updatedAt: '2026-05-14',
    preview: '双色调预览',
    notes: '示例不处理上传图片，只保留效果说明。',
    install: '打开效果页，选择高光色和阴影色后导出。',
  },
  {
    id: 'event-poster-gen',
    title: '活动海报生成',
    description: '按标题和日期生成活动海报草稿。',
    tags: ['海报', '生成'],
    categoryId: 'poster-generator',
    intro: '输入活动名称、日期和地点，生成一张可继续修改的海报草稿。',
    platforms: ['Web'],
    version: '0.5.2',
    updatedAt: '2026-06-01',
    preview: '生成海报预览',
    notes: '生成结果为示意，不会调用外部服务。',
    install: '填写字段后点击生成。下载按钮目前不可用。',
  },
]

export function getAsset(id: string): Asset | undefined {
  return mockAssets.find((asset) => asset.id === id)
}

export function filterAssets(options: { categoryId?: string; query?: string }): Asset[] {
  const categoryId = options.categoryId?.trim()
  const query = options.query?.trim().toLowerCase()
  let assets = mockAssets

  if (categoryId) {
    const ids = categoryMatchIds(categoryId)
    if (!ids) {
      return []
    }
    assets = assets.filter((asset) => ids.has(asset.categoryId))
  }

  if (query) {
    assets = assets.filter((asset) => {
      const haystack = [asset.title, asset.description, ...asset.tags].join('\n').toLowerCase()
      return haystack.includes(query)
    })
  }

  return assets
}
