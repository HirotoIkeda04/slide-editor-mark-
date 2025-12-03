import type { Item, ItemType, TableItem, ImageItem, TextItem, SlideItem } from '../types'

// Generate unique ID
const generateId = (): string => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create new item
export const createItem = (
  name: string,
  type: ItemType,
  data: Partial<Omit<Item, 'id' | 'name' | 'type' | 'createdAt' | 'updatedAt'>>
): Item => {
  const now = new Date().toISOString()
  const baseItem = {
    id: generateId(),
    name,
    type,
    createdAt: now,
    updatedAt: now
  }

  switch (type) {
    case 'table':
      return {
        ...baseItem,
        type: 'table',
        data: (data as Partial<TableItem>).data || [['']],
        headers: (data as Partial<TableItem>).headers
      } as TableItem

    case 'image':
      return {
        ...baseItem,
        type: 'image',
        dataUrl: (data as Partial<ImageItem>).dataUrl || '',
        alt: (data as Partial<ImageItem>).alt
      } as ImageItem

    case 'text':
      return {
        ...baseItem,
        type: 'text',
        content: (data as Partial<TextItem>).content || ''
      } as TextItem

    case 'slide':
      return {
        ...baseItem,
        type: 'slide',
        content: (data as Partial<SlideItem>).content || ''
      } as SlideItem

    default:
      throw new Error(`Unknown item type: ${type}`)
  }
}

// Update existing item
export const updateItem = (
  items: Item[],
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'createdAt'>>
): Item[] => {
  return items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString()
      } as Item
    }
    return item
  })
}

// Delete item
export const deleteItem = (items: Item[], itemId: string): Item[] => {
  return items.filter(item => item.id !== itemId)
}

// Get item by ID
export const getItemById = (items: Item[], itemId: string): Item | undefined => {
  return items.find(item => item.id === itemId)
}

// Get item by name
export const getItemByName = (items: Item[], name: string): Item | undefined => {
  return items.find(item => item.name === name)
}

// Search items by name
export const searchItems = (items: Item[], query: string): Item[] => {
  const lowerQuery = query.toLowerCase()
  return items.filter(item => item.name.toLowerCase().includes(lowerQuery))
}

// Filter items by type
export const filterItemsByType = (items: Item[], type: ItemType): Item[] => {
  return items.filter(item => item.type === type)
}

// Check if item name is unique
export const isNameUnique = (items: Item[], name: string, excludeId?: string): boolean => {
  return !items.some(item => item.name === name && item.id !== excludeId)
}

// Convert table to Markdown (or chart marker for chart display formats)
export const tableToMarkdown = (table: TableItem): string => {
  const { data, headers, displayFormat, hiddenRows = [], hiddenColumns = [] } = table
  if (!data || data.length === 0) return ''

  // グラフ形式の場合、特殊なマーカーを返す
  // このマーカーはPreviewコンポーネントで検出され、TableChartコンポーネントに置き換えられる
  if (displayFormat && displayFormat !== 'table') {
    return `<table-chart id="${table.id}" name="${table.name}" format="${displayFormat}"></table-chart>`
  }

  let markdown = ''
  
  // 非表示列を除外した列インデックス
  const visibleColumnIndices = (headers && headers.length > 0 ? headers : data[0] || [])
    .map((_, i) => i)
    .filter(i => !hiddenColumns.includes(i))
  
  // 列数を決定（表示される列のみ）
  const colCount = visibleColumnIndices.length
  if (colCount === 0) return ''

  // Add headers if exists
  if (headers && headers.length > 0) {
    const headerRow = visibleColumnIndices.map(i => headers[i] || '')
    markdown += '| ' + headerRow.join(' | ') + ' |\n'
    markdown += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n'
  } else {
    // ヘッダーがない場合、最初の行をヘッダーとして扱う
    if (data.length > 0 && !hiddenRows.includes(0)) {
      const firstRow = visibleColumnIndices.map(i => data[0][i] || '')
      markdown += '| ' + firstRow.join(' | ') + ' |\n'
      markdown += '| ' + firstRow.map(() => '---').join(' | ') + ' |\n'
    }
  }

  // Add data rows (非表示行を除外)
  const startRow = headers && headers.length > 0 ? 0 : 1 // ヘッダーがない場合は最初の行をスキップ
  for (let i = startRow; i < data.length; i++) {
    // 非表示行をスキップ
    if (hiddenRows.includes(i)) continue
    
    const row = data[i] || []
    const rowCells = visibleColumnIndices.map(colIdx => row[colIdx] || '')
    markdown += '| ' + rowCells.join(' | ') + ' |\n'
  }

  return markdown.trim()
}

// Convert image to Markdown
export const imageToMarkdown = (image: ImageItem): string => {
  console.log('[imageToMarkdown] Image item:', { name: image.name, hasDataUrl: !!image.dataUrl, dataUrlLength: image.dataUrl?.length })
  if (!image.dataUrl || image.dataUrl.trim() === '') {
    const alt = image.alt || image.name
    console.warn('[imageToMarkdown] No dataUrl for image:', alt)
    return `⚠️ Image "${alt}" has no data URL`
  }
  const alt = image.alt || image.name
  const markdown = `![${alt}](${image.dataUrl})`
  console.log('[imageToMarkdown] Generated markdown length:', markdown.length)
  return markdown
}

// Convert text to Markdown (as-is)
export const textToMarkdown = (text: TextItem): string => {
  return text.content
}

// Convert slide to Markdown (as-is)
export const slideToMarkdown = (slide: SlideItem): string => {
  return slide.content
}

// Convert item to Markdown
export const itemToMarkdown = (item: Item): string => {
  switch (item.type) {
    case 'table':
      return tableToMarkdown(item)
    case 'image':
      return imageToMarkdown(item)
    case 'text':
      return textToMarkdown(item)
    case 'slide':
      return slideToMarkdown(item)
    default:
      return ''
  }
}

