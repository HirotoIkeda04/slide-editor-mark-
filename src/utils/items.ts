import type { Item, ItemType, TableItem, ImageItem, TextItem, SlideItem, PictoItem, EulerItem, NewItem } from '../types'
import { NEW_ITEM_ID } from '../types'
import { DEFAULT_CANVAS_SIZE } from '../constants/pictoConfigs'
import { DEFAULT_EULER_CANVAS_SIZE } from '../constants/eulerConfigs'
import { getFilledRange, isCellHidden } from './tableUtils'

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

    case 'picto':
      return {
        ...baseItem,
        type: 'picto',
        elements: (data as Partial<PictoItem>).elements || [],
        connectors: (data as Partial<PictoItem>).connectors || [],
        groups: (data as Partial<PictoItem>).groups || [],
        comments: (data as Partial<PictoItem>).comments || [],
        canvasSize: (data as Partial<PictoItem>).canvasSize || DEFAULT_CANVAS_SIZE
      } as PictoItem

    case 'euler':
      return {
        ...baseItem,
        type: 'euler',
        circles: (data as Partial<EulerItem>).circles || [],
        elements: (data as Partial<EulerItem>).elements || [],
        canvasSize: (data as Partial<EulerItem>).canvasSize || DEFAULT_EULER_CANVAS_SIZE
      } as EulerItem

    case 'new':
      return {
        ...baseItem,
        id: NEW_ITEM_ID,
        type: 'new'
      } as NewItem

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

// Generate unique item name with incrementing number
// e.g., "Table" -> "Table 1", "Table 2", ...
export const generateUniqueItemName = (baseName: string, existingNames: string[]): string => {
  // Pattern to match "BaseName N" format
  const pattern = new RegExp(`^${baseName}\\s+(\\d+)$`)
  
  let maxNumber = 0
  for (const name of existingNames) {
    const match = name.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNumber) {
        maxNumber = num
      }
    }
  }
  
  return `${baseName} ${maxNumber + 1}`
}

// Convert table to Markdown (or chart marker for chart display formats)
// 入力済みセル範囲のみを表示（非表示行/列を除く）
export const tableToMarkdown = (table: TableItem): string => {
  const { data, headers, displayFormat, hiddenRows = [], hiddenColumns = [] } = table
  if (!data || data.length === 0) return ''

  // グラフ形式の場合、特殊なマーカーを返す
  // このマーカーはPreviewコンポーネントで検出され、TableChartコンポーネントに置き換えられる
  if (displayFormat && displayFormat !== 'table') {
    return `<table-chart id="${table.id}" name="${table.name}" format="${displayFormat}"></table-chart>`
  }

  // 入力済みセル範囲を計算
  const filledRange = getFilledRange(data, hiddenRows, hiddenColumns)
  if (!filledRange) {
    // データがない場合は空文字を返す
    return ''
  }

  let markdown = ''
  
  // 入力済み範囲内かつ非表示でない列インデックス
  // セル単位で判定：列が非表示なら、その列のすべてのセルが非表示
  const visibleColumnIndices: number[] = []
  for (let col = filledRange.minCol; col <= filledRange.maxCol; col++) {
    // 任意の行（0行目）で列の非表示をチェック
    if (!isCellHidden(0, col, hiddenRows, hiddenColumns)) {
      visibleColumnIndices.push(col)
    }
  }
  
  // 列数を決定（表示される列のみ）
  const colCount = visibleColumnIndices.length
  if (colCount === 0) return ''

  // 入力済み範囲内かつ非表示でない行インデックス
  // セル単位で判定：行が非表示なら、その行のすべてのセルが非表示
  const visibleRowIndices: number[] = []
  for (let row = filledRange.minRow; row <= filledRange.maxRow; row++) {
    // 任意の列（0列目）で行の非表示をチェック
    if (!isCellHidden(row, 0, hiddenRows, hiddenColumns)) {
      visibleRowIndices.push(row)
    }
  }
  
  if (visibleRowIndices.length === 0) return ''

  // Add headers if exists
  if (headers && headers.length > 0) {
    const headerRow = visibleColumnIndices.map(i => headers[i] || '')
    markdown += '| ' + headerRow.join(' | ') + ' |\n'
    markdown += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n'
    
    // すべてのデータ行を追加
    for (const rowIdx of visibleRowIndices) {
      const row = data[rowIdx] || []
      const rowCells = visibleColumnIndices.map(colIdx => row[colIdx] || '')
      markdown += '| ' + rowCells.join(' | ') + ' |\n'
    }
  } else {
    // ヘッダーがない場合、最初の表示行をヘッダーとして扱う
    if (visibleRowIndices.length > 0) {
      const firstRowIdx = visibleRowIndices[0]
      const firstRow = visibleColumnIndices.map(i => data[firstRowIdx][i] || '')
      markdown += '| ' + firstRow.join(' | ') + ' |\n'
      markdown += '| ' + firstRow.map(() => '---').join(' | ') + ' |\n'
      
      // 残りのデータ行を追加（最初の行をスキップ）
      for (let i = 1; i < visibleRowIndices.length; i++) {
        const rowIdx = visibleRowIndices[i]
        const row = data[rowIdx] || []
        const rowCells = visibleColumnIndices.map(colIdx => row[colIdx] || '')
        markdown += '| ' + rowCells.join(' | ') + ' |\n'
      }
    }
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

// Convert picto to marker (will be rendered by PictoRenderer)
export const pictoToMarkdown = (picto: PictoItem): string => {
  return `<picto-diagram id="${picto.id}" name="${picto.name}"></picto-diagram>`
}

// Convert euler to marker (will be rendered by EulerRenderer)
export const eulerToMarkdown = (euler: EulerItem): string => {
  return `<euler-diagram id="${euler.id}" name="${euler.name}"></euler-diagram>`
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
    case 'picto':
      return pictoToMarkdown(item)
    case 'euler':
      return eulerToMarkdown(item)
    default:
      return ''
  }
}

