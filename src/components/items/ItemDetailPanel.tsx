import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import './Items.css'
import type { Item, ItemType, TableItem, ImageItem, TextItem, PictoItem, EulerItem, ImageDisplayMode, CellDataType, CellFormat, TableDisplayFormat, GraphCategory, TableChartConfig, TreeData, TreeSettings } from '../../types'
import { createDefaultTreeData, DEFAULT_TREE_SETTINGS } from '../../types'
import { NEW_ITEM_ID } from '../../types'
import { cropImage } from '../../utils/imageProcessing'
import { 
  getCellKey, 
  parseCellValue, 
  formatCellValue, 
  validateCellValue, 
  inferCellDataType,
  getDefaultCellFormat,
  parseMarkdownTable,
  getFilledRange,
  getCellBorderPositionWithDashed,
  isCellHidden,
  type FilledRange
} from '../../utils/tableUtils'
import { FormulaEvaluator, evaluateColumnFormula } from '../../utils/formulaEvaluator'
import { FloatingNavBar } from '../floatingNavBar/FloatingNavBar'
import { PictoEditor } from '../picto/PictoEditor'
import { EulerEditor, EulerIcon } from '../euler'
import { GraphCategoryChips, GraphTypeCarousel, GraphSettingsPanel, GraphTypeModal, GraphTypeHoverSelector } from '../graph'
import { TreeInput, TreeSettingsPanel } from '../tree'
import { isTreeInputChart } from '../../constants/graphConfigs'
import { DEFAULT_CANVAS_SIZE } from '../../constants/pictoConfigs'
import { DEFAULT_EULER_CANVAS_SIZE } from '../../constants/eulerConfigs'
import '../graph/GraphPanel.css'

const MAIN_SLIDE_ITEM_ID = 'main-slide'

// Excel風グリッドサイズ（26行×26列 = A-Z列）
const GRID_ROWS = 26
const GRID_COLS = 26

interface ItemDetailPanelProps {
  item: Item | null
  onEdit: (item: Item) => void
  onUpdateItem?: (itemId: string, updates: Partial<Item>) => void
  // 新しいアイテム作成用のプロパティ
  onCreateItem?: (itemData: Partial<Item>) => void
  existingNames?: string[]
  // テーブル用: 外部からMarkdownインポートを開くトリガー
  markdownImportTrigger?: number
}

export const ItemDetailPanel = ({ 
  item, 
  onEdit, 
  onUpdateItem,
  onCreateItem,
  existingNames = [],
  markdownImportTrigger = 0,
}: ItemDetailPanelProps) => {
  const [, setDisplayMode] = useState<ImageDisplayMode>('contain')
  
  // 作成モード用の状態
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState<ItemType>('table')
  const [createNameError, setCreateNameError] = useState('')

  // Table specific state
  const [tableData, setTableData] = useState<string[][]>([['', ''], ['', ''], ['', '']])
  const [tableHeaders, setTableHeaders] = useState<string[]>(['', ''])
  const [useHeaders, setUseHeaders] = useState(false)
  const [cellTypes, setCellTypes] = useState<Record<string, CellDataType>>({})
  const [cellFormats, setCellFormats] = useState<Record<string, CellFormat>>({})
  const [mergedCells, setMergedCells] = useState<Array<{ row: number; col: number; rowSpan: number; colSpan: number }>>([])
  const [showFormatDialog, setShowFormatDialog] = useState(false)
  const [formatDialogCell, setFormatDialogCell] = useState<{ row: number; col: number } | null>(null)
  const [formatDialogColumn, setFormatDialogColumn] = useState<number | null>(null)
  const [formatDialogDataType, setFormatDialogDataType] = useState<CellDataType>('text')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [typeDropdownColumn, setTypeDropdownColumn] = useState<number | null>(null)
  const [tableDisplayFormat, setTableDisplayFormat] = useState<TableDisplayFormat>('table')
  const [hiddenRows, setHiddenRows] = useState<number[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<number[]>([])
  const tableScrollViewportRef = useRef<HTMLDivElement | null>(null)
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<{ column: number; direction: 'asc' | 'desc' } | null>(null)
  
  // Filter state
  const [filterConfig, setFilterConfig] = useState<Array<{
    column: number
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty'
    value?: string
  }>>([])
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  
  // Graph panel state
  const [graphCategory, setGraphCategory] = useState<GraphCategory>('all')
  const [showGraphTypeModal, setShowGraphTypeModal] = useState(false)
  const [chartConfig, setChartConfig] = useState<TableChartConfig>({})
  
  // Tree input state (for hierarchy charts)
  const [treeData, setTreeData] = useState<TreeData | undefined>(undefined)
  const [treeSettings, setTreeSettings] = useState<TreeSettings | undefined>(undefined)
  
  // View mode state (Notion-style table/tree view switcher)
  type ViewMode = 'table' | 'tree'
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  
  // Markdown import state
  const [showMarkdownImport, setShowMarkdownImport] = useState(false)
  const [markdownInput, setMarkdownInput] = useState('')
  const [markdownImportError, setMarkdownImportError] = useState('')
  
  // Image specific state
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [imageDisplayMode, setImageDisplayMode] = useState<ImageDisplayMode>('contain')
  const [showCropTool, setShowCropTool] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  
  // Text specific state
  const [textContent, setTextContent] = useState('')
  
  // Context menu state for Notion-style table
  const [contextMenu, setContextMenu] = useState<{
    type: 'row' | 'column' | 'cell'
    index: number
    cellRow?: number
    cellCol?: number
    x: number
    y: number
  } | null>(null)

  // ホバー時の追加ボタン状態
  const [hoverAddButton, setHoverAddButton] = useState<{
    type: 'row' | 'column'
    index: number
    position: 'before' | 'after'  // before = 上/左, after = 下/右
    top: number
    left: number
  } | null>(null)

  // Selected cell state for formula bar
  const [selectedCell, setSelectedCell] = useState<{
    row: number
    col: number
    isHeader: boolean
  } | null>(null)
  
  // Cell range selection for merging
  const [cellRangeSelection, setCellRangeSelection] = useState<{
    start: { row: number; col: number } | null
    end: { row: number; col: number } | null
  }>({ start: null, end: null })
  const [isDragging, setIsDragging] = useState(false)

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<number[]>([])
  const [resizing, setResizing] = useState<{
    colIndex: number
    startX: number
    startWidth: number
  } | null>(null)

  // Drag & drop reorder state
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null)
  const [draggedRow, setDraggedRow] = useState<number | null>(null)
  const [dropTargetColumn, setDropTargetColumn] = useState<number | null>(null)
  const [dropTargetRow, setDropTargetRow] = useState<number | null>(null)

  const COLUMN_BASE_WIDTH = 60
  const MIN_COLUMN_WIDTH = 60
  const ROW_HEADER_WIDTH = 40

  // 実データのみを表示（フィルター・ソート適用）
  const displayData = useMemo(() => {
    let result = tableData
    
    // フィルターを適用
    if (filterConfig.length > 0) {
      result = result.filter((row) => {
        return filterConfig.every(filter => {
          const cellValue = row[filter.column] || ''
          
          switch (filter.operator) {
            case 'equals':
              return cellValue === filter.value
            case 'contains':
              return cellValue.toLowerCase().includes((filter.value || '').toLowerCase())
            case 'gt': {
              const num = parseFloat(cellValue.replace(/[,¥$€£%]/g, ''))
              const filterNum = parseFloat((filter.value || '0').replace(/[,¥$€£%]/g, ''))
              return !isNaN(num) && !isNaN(filterNum) && num > filterNum
            }
            case 'lt': {
              const num = parseFloat(cellValue.replace(/[,¥$€£%]/g, ''))
              const filterNum = parseFloat((filter.value || '0').replace(/[,¥$€£%]/g, ''))
              return !isNaN(num) && !isNaN(filterNum) && num < filterNum
            }
            case 'isEmpty':
              return !cellValue || cellValue.trim() === ''
            case 'isNotEmpty':
              return cellValue && cellValue.trim() !== ''
            default:
              return true
          }
        })
      })
    }
    
    // ソートを適用
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.column] || ''
        const bVal = b[sortConfig.column] || ''
        
        // 数値として比較を試みる
        const aNum = parseFloat(aVal.replace(/[,¥$€£%]/g, ''))
        const bNum = parseFloat(bVal.replace(/[,¥$€£%]/g, ''))
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum
        }
        
        // 文字列として比較
        const comparison = aVal.localeCompare(bVal, 'ja')
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }
    
    return result
  }, [tableData, sortConfig, filterConfig])

  // 実ヘッダーのみを表示
  const displayHeaders = useMemo(() => {
    return tableHeaders
  }, [tableHeaders])

  // 入力済みセルの範囲を計算（スライドに表示される範囲）
  const filledRange = useMemo((): FilledRange | null => {
    return getFilledRange(tableData, hiddenRows, [])
  }, [tableData, hiddenRows])

  const colCount = displayData[0]?.length || 2
  
  // Get column width (from state or default)
  const getColumnWidth = useCallback((colIndex: number): number => {
    return columnWidths[colIndex] ?? COLUMN_BASE_WIDTH
  }, [columnWidths])
  
  // Calculate total table width based on column widths
  const tableContentWidth = useMemo(() => {
    const dataColumnsWidth = Array.from({ length: colCount }, (_, i) => getColumnWidth(i)).reduce((sum, w) => sum + w, 0)
    return ROW_HEADER_WIDTH + dataColumnsWidth + COLUMN_BASE_WIDTH  // +COLUMN_BASE_WIDTH for add property column
  }, [colCount, getColumnWidth])
  const tableWidthPx = `${tableContentWidth}px`

  const normalizeFullWidthNumberCharacters = (input: string): string => {
    if (!input) return input
    return input
      .replace(/[\uFF10-\uFF19]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xff10 + 0x30))
      .replace(/\uFF0E/g, '.')
      .replace(/\uFF0C/g, ',')
      .replace(/\uFF0D/g, '-')
      .replace(/\u30FC/g, '-')  // 長音符（ー）も半角マイナスに変換
      .replace(/\uFF0B/g, '+')
      .replace(/\uFF05/g, '%')
  }

  // アイテムが変更されたら編集状態を初期化
  useEffect(() => {
    if (item) {
      initializeEditState(item)
      if (item.type === 'image') {
        const imageItem = item as ImageItem
        setDisplayMode(imageItem.displayMode || 'contain')
      }
    }
  }, [item?.id])

  // 外部からMarkdownインポートを開くトリガー
  useEffect(() => {
    if (markdownImportTrigger > 0 && item?.type === 'table') {
      setShowMarkdownImport(true)
      setMarkdownInput('')
      setMarkdownImportError('')
    }
  }, [markdownImportTrigger])

  // コンテキストメニューを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        const target = e.target as HTMLElement
        if (!target.closest('.table-context-menu')) {
          setContextMenu(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenu])

  // データ型ドロップダウンを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownColumn !== null) {
        const target = e.target as HTMLElement
        if (!target.closest('.table-type-dropdown-menu') && !target.closest('.header-type-dropdown')) {
          setTypeDropdownColumn(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [typeDropdownColumn])
  
  // ドラッグ終了のグローバルリスナー
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [isDragging])
  
  // データ型ドロップダウンを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTypeDropdown) {
        const target = e.target as HTMLElement
        if (!target.closest('.table-type-dropdown')) {
          setShowTypeDropdown(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTypeDropdown])

  const initializeEditState = (currentItem: Item) => {
    switch (currentItem.type) {
      case 'table':
        const tableItem = currentItem as TableItem
        setTableData(tableItem.data || [['', ''], ['', ''], ['', '']])
        setTableHeaders(tableItem.headers || [])
        setUseHeaders(!!tableItem.headers)
        setCellTypes(tableItem.cellTypes || {})
        setCellFormats(tableItem.cellFormats || {})
        setMergedCells(tableItem.mergedCells || [])
        setTableDisplayFormat(tableItem.displayFormat || 'table')
        setHiddenRows(tableItem.hiddenRows || [])
        setChartConfig(tableItem.chartConfig || {})
        setTreeData(tableItem.treeData)
        setTreeSettings(tableItem.treeSettings)
        setValidationErrors({})
        break
      case 'image':
        const imageItem = currentItem as ImageItem
        setImageDataUrl(imageItem.dataUrl)
        setImageAlt(imageItem.alt || '')
        setImageDisplayMode(imageItem.displayMode || 'contain')
        setShowCropTool(false)
        setCrop(undefined)
        setCompletedCrop(undefined)
        break
      case 'text':
        const textItem = currentItem as TextItem
        setTextContent(textItem.content || '')
        break
    }
  }


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const newDataUrl = reader.result as string
      setImageDataUrl(newDataUrl)
      setShowCropTool(false)
      setCrop(undefined)
      setCompletedCrop(undefined)
      
      // 即座に保存
      if (item && item.type === 'image' && onUpdateItem) {
        onUpdateItem(item.id, { dataUrl: newDataUrl } as Partial<ImageItem>)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleApplyCrop = async () => {
    if (!completedCrop || !imageRef.current || !imageDataUrl || !item || !onUpdateItem) return

    try {
      const croppedDataUrl = await cropImage(imageDataUrl, completedCrop)
      setImageDataUrl(croppedDataUrl)
      setShowCropTool(false)
      setCrop(undefined)
      setCompletedCrop(undefined)
      
      // 即座に保存
      if (item.type === 'image') {
        onUpdateItem(item.id, { dataUrl: croppedDataUrl } as Partial<ImageItem>)
      }
    } catch (error) {
      console.error('Failed to crop image:', error)
      alert('Failed to crop image. Please try again.')
    }
  }

  const handleCancelCrop = () => {
    setShowCropTool(false)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  // セルの値を取得（数式評価を含む）
  const getCellDisplayValue = (rowIndex: number, colIndex: number): string => {
    const cellKey = getCellKey(rowIndex, colIndex)
    const rawValue = tableData[rowIndex]?.[colIndex] || ''
    const cellType = cellTypes[cellKey] || 'text'
    
    // 数式型の列の場合、列の数式を評価
    if (cellType === 'formula') {
      const format = cellFormats[cellKey]
      const formula = format?.formula
      if (formula) {
        try {
          const result = evaluateColumnFormula(
            formula,
            rowIndex,
            tableHeaders,
            tableData[rowIndex] || []
          )
          if (typeof result === 'number') {
            return String(result)
          }
          return String(result)
        } catch (error) {
          return '#ERROR!'
        }
      }
      return ''
    }
    
    // 旧式の数式（=で始まる）の場合、評価を実行
    if (rawValue.trim().startsWith('=')) {
      try {
        const evaluator = new FormulaEvaluator(
          tableData,
          cellTypes,
          (row: number, col: number) => {
            const val = tableData[row]?.[col] || ''
            const key = getCellKey(row, col)
            const type = cellTypes[key] || 'text'
            return { value: val, type }
          }
        )
        const result = evaluator.evaluate(rawValue)
        if (result === null || result === undefined) return ''
        if (typeof result === 'string' && result.startsWith('#')) {
          return result // エラー値
        }
        // 数値の場合はフォーマットを適用
        const format = cellFormats[cellKey]
        if (cellType === 'number' && typeof result === 'number') {
          return formatCellValue(result, cellType, format)
        }
        return String(result)
      } catch (error) {
        return '#ERROR!'
      }
    }
    
    // 通常の値の場合、データ型に応じてフォーマット
    const format = cellFormats[cellKey]
    
    if (cellType === 'text' || !rawValue) {
      return rawValue
    }
    
    // パースしてフォーマット
    const parsedValue = parseCellValue(rawValue, cellType)
    if (parsedValue === null || parsedValue === undefined || parsedValue === '') {
      return ''
    }
    
    return formatCellValue(parsedValue, cellType, format)
  }

  const handleTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!item || !onUpdateItem) return
    const normalizedValue = normalizeFullWidthNumberCharacters(value)
    const cellKey = getCellKey(rowIndex, colIndex)
    const cellType = cellTypes[cellKey] || 'text'
    
    // バリデーション
    if (normalizedValue && !validateCellValue(normalizedValue, cellType)) {
      setValidationErrors(prev => ({
        ...prev,
        [cellKey]: `無効な${cellType === 'number' ? '数値' : cellType === 'date' ? '日付' : cellType === 'percentage' ? 'パーセント' : '通貨'}です`
      }))
      return
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[cellKey]
        return newErrors
      })
    }
    
    // 実データの行数・列数を必要に応じて拡張
    let newData = tableData.map(row => [...row])
    const currentRows = newData.length
    const currentCols = newData[0]?.length || 0
    
    // 行を拡張（必要な場合）
    if (rowIndex >= currentRows) {
      const colsToUse = Math.max(currentCols, colIndex + 1)
      for (let r = currentRows; r <= rowIndex; r++) {
        newData.push(Array(colsToUse).fill(''))
      }
    }
    
    // 列を拡張（必要な場合）
    if (colIndex >= currentCols) {
      newData = newData.map(row => {
        const newRow = [...row]
        for (let c = row.length; c <= colIndex; c++) {
          newRow.push('')
        }
        return newRow
      })
    }
    
    newData[rowIndex][colIndex] = normalizedValue
    
    // ヘッダーも拡張（必要な場合）
    let newHeaders = [...tableHeaders]
    if (colIndex >= newHeaders.length) {
      for (let c = newHeaders.length; c <= colIndex; c++) {
        newHeaders.push('')
      }
    }
    
    // データ型の自動推測（値が入力された場合）
    let updatedCellTypes = { ...cellTypes }
    let updatedCellFormats = { ...cellFormats }
    
    if (normalizedValue && !cellTypes[cellKey]) {
      const inferredType = inferCellDataType(normalizedValue)
      updatedCellTypes[cellKey] = inferredType
      
      // デフォルトフォーマットを設定
      if (inferredType !== 'text') {
        updatedCellFormats[cellKey] = getDefaultCellFormat(inferredType)
      }
    }
    
    setTableData(newData)
    setTableHeaders(newHeaders)
    setCellTypes(updatedCellTypes)
    setCellFormats(updatedCellFormats)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes: updatedCellTypes,
        cellFormats: updatedCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  const handleTableHeaderChange = (colIndex: number, value: string) => {
    if (!item || !onUpdateItem) return
    const normalizedValue = normalizeFullWidthNumberCharacters(value)
    
    // ヘッダーを拡張（必要な場合）
    let newHeaders = [...tableHeaders]
    if (colIndex >= newHeaders.length) {
      for (let c = newHeaders.length; c <= colIndex; c++) {
        newHeaders.push('')
      }
    }
    newHeaders[colIndex] = normalizedValue
    
    // データの列も拡張（必要な場合）
    let newData = tableData
    const currentCols = tableData[0]?.length || 0
    if (colIndex >= currentCols) {
      newData = tableData.map(row => {
        const newRow = [...row]
        for (let c = row.length; c <= colIndex; c++) {
          newRow.push('')
        }
        return newRow
      })
      setTableData(newData)
    }
    
    setTableHeaders(newHeaders)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  const addTableRow = () => {
    if (!item || !onUpdateItem) return
    const colCount = tableData[0]?.length || 2
    const newData = [...tableData, Array(colCount).fill('')]
    setTableData(newData)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? tableHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  const addTableColumn = () => {
    if (!item || !onUpdateItem) return
    const newData = tableData.map(row => [...row, ''])
    const newHeaders = [...tableHeaders, '']
    setTableData(newData)
    setTableHeaders(newHeaders)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  const removeTableRow = (index: number) => {
    if (!item || !onUpdateItem) return
    if (tableData.length <= 1) return
    const newData = tableData.filter((_, i) => i !== index)
    
    // 削除された行のセルタイプとフォーマットも削除
    const newCellTypes: Record<string, CellDataType> = {}
    const newCellFormats: Record<string, CellFormat> = {}
    Object.keys(cellTypes).forEach(key => {
      const parsed = key.split('-')
      const row = parseInt(parsed[0], 10)
      if (row !== index && row < index) {
        newCellTypes[key] = cellTypes[key]
      } else if (row > index) {
        // 行番号を1つ減らす
        const col = parseInt(parsed[1], 10)
        newCellTypes[getCellKey(row - 1, col)] = cellTypes[key]
      }
    })
    Object.keys(cellFormats).forEach(key => {
      const parsed = key.split('-')
      const row = parseInt(parsed[0], 10)
      if (row !== index && row < index) {
        newCellFormats[key] = cellFormats[key]
      } else if (row > index) {
        const col = parseInt(parsed[1], 10)
        newCellFormats[getCellKey(row - 1, col)] = cellFormats[key]
      }
    })
    
    setTableData(newData)
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? tableHeaders : undefined,
        cellTypes: newCellTypes,
        cellFormats: newCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  const removeTableColumn = (index: number) => {
    if (!item || !onUpdateItem) return
    if (tableData[0]?.length <= 1) return
    const newData = tableData.map(row => row.filter((_, i) => i !== index))
    const newHeaders = tableHeaders.filter((_, i) => i !== index)
    
    // 削除された列のセルタイプとフォーマットも削除
    const newCellTypes: Record<string, CellDataType> = {}
    const newCellFormats: Record<string, CellFormat> = {}
    Object.keys(cellTypes).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col !== index && col < index) {
        newCellTypes[key] = cellTypes[key]
      } else if (col > index) {
        // 列番号を1つ減らす
        const row = parseInt(parsed[0], 10)
        newCellTypes[getCellKey(row, col - 1)] = cellTypes[key]
      }
    })
    Object.keys(cellFormats).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col !== index && col < index) {
        newCellFormats[key] = cellFormats[key]
      } else if (col > index) {
        const row = parseInt(parsed[0], 10)
        newCellFormats[getCellKey(row, col - 1)] = cellFormats[key]
      }
    })
    
    setTableData(newData)
    setTableHeaders(newHeaders)
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes: newCellTypes,
        cellFormats: newCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 行を上に挿入
  const insertRowAbove = (index: number) => {
    if (!item || !onUpdateItem) return
    const colCount = tableData[0]?.length || 2
    const newRow = Array(colCount).fill('')
    const newData = [...tableData.slice(0, index), newRow, ...tableData.slice(index)]
    setTableData(newData)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? tableHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 行を下に挿入
  const insertRowBelow = (index: number) => {
    if (!item || !onUpdateItem) return
    const colCount = tableData[0]?.length || 2
    const newRow = Array(colCount).fill('')
    const newData = [...tableData.slice(0, index + 1), newRow, ...tableData.slice(index + 1)]
    setTableData(newData)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? tableHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 行を複製
  const duplicateRow = (index: number) => {
    if (!item || !onUpdateItem) return
    const duplicatedRow = [...tableData[index]]
    const newData = [...tableData.slice(0, index + 1), duplicatedRow, ...tableData.slice(index + 1)]
    
    // 複製された行のセルタイプとフォーマットも複製
    const newCellTypes = { ...cellTypes }
    const newCellFormats = { ...cellFormats }
    const colCount = tableData[0]?.length || 0
    for (let col = 0; col < colCount; col++) {
      const sourceKey = getCellKey(index, col)
      const targetKey = getCellKey(index + 1, col)
      if (cellTypes[sourceKey]) {
        newCellTypes[targetKey] = cellTypes[sourceKey]
      }
      if (cellFormats[sourceKey]) {
        newCellFormats[targetKey] = cellFormats[sourceKey]
      }
    }
    
    setTableData(newData)
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? tableHeaders : undefined,
        cellTypes: newCellTypes,
        cellFormats: newCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 行のコンテンツをクリア
  const clearRowContents = (index: number) => {
    if (!item || !onUpdateItem) return
    const newData = [...tableData]
    newData[index] = newData[index].map(() => '')
    setTableData(newData)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? tableHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 列を左に挿入
  const insertColumnLeft = (index: number) => {
    if (!item || !onUpdateItem) return
    const newData = tableData.map(row => [...row.slice(0, index), '', ...row.slice(index)])
    const newHeaders = [...tableHeaders.slice(0, index), '', ...tableHeaders.slice(index)]
    
    // 列の挿入に伴い、セルタイプとフォーマットのキーを更新
    const newCellTypes: Record<string, CellDataType> = {}
    const newCellFormats: Record<string, CellFormat> = {}
    Object.keys(cellTypes).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col < index) {
        newCellTypes[key] = cellTypes[key]
      } else {
        const row = parseInt(parsed[0], 10)
        newCellTypes[getCellKey(row, col + 1)] = cellTypes[key]
      }
    })
    Object.keys(cellFormats).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col < index) {
        newCellFormats[key] = cellFormats[key]
      } else {
        const row = parseInt(parsed[0], 10)
        newCellFormats[getCellKey(row, col + 1)] = cellFormats[key]
      }
    })
    
    setTableData(newData)
    setTableHeaders(newHeaders)
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes: newCellTypes,
        cellFormats: newCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 列を右に挿入
  const insertColumnRight = (index: number) => {
    if (!item || !onUpdateItem) return
    const newData = tableData.map(row => [...row.slice(0, index + 1), '', ...row.slice(index + 1)])
    const newHeaders = [...tableHeaders.slice(0, index + 1), '', ...tableHeaders.slice(index + 1)]
    
    // 列の挿入に伴い、セルタイプとフォーマットのキーを更新
    const newCellTypes: Record<string, CellDataType> = {}
    const newCellFormats: Record<string, CellFormat> = {}
    Object.keys(cellTypes).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col <= index) {
        newCellTypes[key] = cellTypes[key]
      } else {
        const row = parseInt(parsed[0], 10)
        newCellTypes[getCellKey(row, col + 1)] = cellTypes[key]
      }
    })
    Object.keys(cellFormats).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col <= index) {
        newCellFormats[key] = cellFormats[key]
      } else {
        const row = parseInt(parsed[0], 10)
        newCellFormats[getCellKey(row, col + 1)] = cellFormats[key]
      }
    })
    
    setTableData(newData)
    setTableHeaders(newHeaders)
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes: newCellTypes,
        cellFormats: newCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 列を複製
  const duplicateColumn = (index: number) => {
    if (!item || !onUpdateItem) return
    const newData = tableData.map(row => [...row.slice(0, index + 1), row[index], ...row.slice(index + 1)])
    const newHeaders = [...tableHeaders.slice(0, index + 1), tableHeaders[index], ...tableHeaders.slice(index + 1)]
    
    // 複製された列のセルタイプとフォーマットも複製
    const newCellTypes: Record<string, CellDataType> = {}
    const newCellFormats: Record<string, CellFormat> = {}
    Object.keys(cellTypes).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col <= index) {
        newCellTypes[key] = cellTypes[key]
      } else {
        const row = parseInt(parsed[0], 10)
        newCellTypes[getCellKey(row, col + 1)] = cellTypes[key]
      }
      // 複製元の列のセルタイプを複製先にも設定
      if (col === index) {
        const row = parseInt(parsed[0], 10)
        newCellTypes[getCellKey(row, index + 1)] = cellTypes[key]
      }
    })
    Object.keys(cellFormats).forEach(key => {
      const parsed = key.split('-')
      const col = parseInt(parsed[1], 10)
      if (col <= index) {
        newCellFormats[key] = cellFormats[key]
      } else {
        const row = parseInt(parsed[0], 10)
        newCellFormats[getCellKey(row, col + 1)] = cellFormats[key]
      }
      // 複製元の列のフォーマットを複製先にも設定
      if (col === index) {
        const row = parseInt(parsed[0], 10)
        newCellFormats[getCellKey(row, index + 1)] = cellFormats[key]
      }
    })
    
    setTableData(newData)
    setTableHeaders(newHeaders)
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes: newCellTypes,
        cellFormats: newCellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 列のコンテンツをクリア
  const clearColumnContents = (index: number) => {
    if (!item || !onUpdateItem) return
    const newData = tableData.map(row => {
      const newRow = [...row]
      newRow[index] = ''
      return newRow
    })
    const newHeaders = [...tableHeaders]
    if (useHeaders) {
      newHeaders[index] = ''
    }
    setTableData(newData)
    setTableHeaders(newHeaders)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: newData,
        headers: useHeaders ? newHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // 行の非表示/表示を切り替え
  const toggleRowVisibility = (index: number) => {
    if (!item || !onUpdateItem) return
    const newHiddenRows = hiddenRows.includes(index)
      ? hiddenRows.filter(i => i !== index)
      : [...hiddenRows, index]
    setHiddenRows(newHiddenRows)
    setContextMenu(null)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, { hiddenRows: newHiddenRows } as Partial<TableItem>)
    }
  }

  // すべての非表示行を表示
  const showAllRows = () => {
    if (!item || !onUpdateItem) return
    setHiddenRows([])
    if (item.type === 'table') {
      onUpdateItem(item.id, { hiddenRows: [] } as Partial<TableItem>)
    }
  }

  // すべての非表示列を表示
  const showAllColumns = () => {
    if (!item || !onUpdateItem) return
    setHiddenColumns([])
    // hiddenColumns is currently local state only - not persisted to TableItem
  }

  // グリップアイコンのクリックハンドラ
  const handleGripClick = (e: React.MouseEvent, type: 'row' | 'column', index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({
      type,
      index,
      x: rect.left,
      y: rect.bottom + 4
    })
  }

  // ===== Column Resize Handlers =====
  const handleResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    const startWidth = columnWidths[colIndex] ?? COLUMN_BASE_WIDTH
    setResizing({
      colIndex,
      startX: e.clientX,
      startWidth
    })
    document.body.classList.add('column-resizing')
  }

  useEffect(() => {
    if (!resizing) return

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizing.startX
      const newWidth = Math.max(MIN_COLUMN_WIDTH, resizing.startWidth + deltaX)
      setColumnWidths(prev => {
        const updated = [...prev]
        // Ensure array has enough elements
        while (updated.length <= resizing.colIndex) {
          updated.push(COLUMN_BASE_WIDTH)
        }
        updated[resizing.colIndex] = newWidth
        return updated
      })
    }

    const handleResizeEnd = () => {
      setResizing(null)
      document.body.classList.remove('column-resizing')
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [resizing])

  // ===== Column Drag & Drop Handlers =====
  const handleColumnDragStart = (e: React.DragEvent, colIndex: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `column:${colIndex}`)
    setDraggedColumn(colIndex)
  }

  const handleColumnDragOver = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault()
    if (draggedColumn === null || draggedColumn === colIndex) return
    setDropTargetColumn(colIndex)
  }

  const handleColumnDragLeave = () => {
    setDropTargetColumn(null)
  }

  const handleColumnDrop = (e: React.DragEvent, targetColIndex: number) => {
    e.preventDefault()
    if (draggedColumn === null || draggedColumn === targetColIndex) {
      setDraggedColumn(null)
      setDropTargetColumn(null)
      return
    }

    // Reorder columns in data
    const newTableData = tableData.map(row => {
      const newRow = [...row]
      const [removed] = newRow.splice(draggedColumn, 1)
      newRow.splice(targetColIndex, 0, removed)
      return newRow
    })

    // Reorder headers
    const newHeaders = [...tableHeaders]
    const [removedHeader] = newHeaders.splice(draggedColumn, 1)
    newHeaders.splice(targetColIndex, 0, removedHeader)

    // Reorder column widths
    const newColumnWidths = [...columnWidths]
    while (newColumnWidths.length < Math.max(draggedColumn, targetColIndex) + 1) {
      newColumnWidths.push(COLUMN_BASE_WIDTH)
    }
    const [removedWidth] = newColumnWidths.splice(draggedColumn, 1)
    newColumnWidths.splice(targetColIndex, 0, removedWidth)

    setTableData(newTableData)
    setTableHeaders(newHeaders)
    setColumnWidths(newColumnWidths)
    setDraggedColumn(null)
    setDropTargetColumn(null)

    // Update item
    if (item && onUpdateItem) {
      onUpdateItem(item.id, {
        data: newTableData,
        headers: useHeaders ? newHeaders : undefined
      } as Partial<TableItem>)
    }
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
    setDropTargetColumn(null)
  }

  // ===== Row Drag & Drop Handlers =====
  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `row:${rowIndex}`)
    setDraggedRow(rowIndex)
  }

  const handleRowDragOver = (e: React.DragEvent, rowIndex: number) => {
    e.preventDefault()
    if (draggedRow === null || draggedRow === rowIndex) return
    setDropTargetRow(rowIndex)
  }

  const handleRowDragLeave = () => {
    setDropTargetRow(null)
  }

  const handleRowDrop = (e: React.DragEvent, targetRowIndex: number) => {
    e.preventDefault()
    if (draggedRow === null || draggedRow === targetRowIndex) {
      setDraggedRow(null)
      setDropTargetRow(null)
      return
    }

    // Reorder rows in data
    const newTableData = [...tableData]
    const [removedRow] = newTableData.splice(draggedRow, 1)
    newTableData.splice(targetRowIndex, 0, removedRow)

    setTableData(newTableData)
    setDraggedRow(null)
    setDropTargetRow(null)

    // Update item
    if (item && onUpdateItem) {
      onUpdateItem(item.id, {
        data: newTableData
      } as Partial<TableItem>)
    }
  }

  const handleRowDragEnd = () => {
    setDraggedRow(null)
    setDropTargetRow(null)
  }

// 追加ボタンを非表示にするハンドラ
  const handleHeaderCellMouseLeave = () => {
    setHoverAddButton(null)
  }

// 追加ボタンクリックハンドラ
  const handleHoverAddButtonClick = () => {
    if (!hoverAddButton) return

    if (hoverAddButton.type === 'row') {
      if (hoverAddButton.position === 'before') {
        insertRowAbove(hoverAddButton.index)
      } else {
        insertRowBelow(hoverAddButton.index)
      }
    } else {
      if (hoverAddButton.position === 'before') {
        insertColumnLeft(hoverAddButton.index)
      } else {
        insertColumnRight(hoverAddButton.index)
      }
    }
    setHoverAddButton(null)
  }

// テーブルコンテナのマウスムーブハンドラ（境界線基準で検出）
  const handleTableContainerMouseMove = (e: React.MouseEvent) => {
    if (!tableRef.current) return

    const table = tableRef.current
    const mouseX = e.clientX
    const mouseY = e.clientY

    // 行番号セルを取得
    const rowNumberCells = table.querySelectorAll('td.table-row-number')
    const colHeaderCells = table.querySelectorAll('th.table-col-header')

    // 境界検出のしきい値（ピクセル）
    const threshold = 12

    let newState: typeof hoverAddButton = null

    // === 行の境界線を収集して検出 ===
    // 境界線の位置とボタン表示用のX座標を取得
    let rowHeaderLeft = 0
    let rowHeaderWidth = 0
    const rowBoundaries: { y: number; rowIndex: number; position: 'before' | 'after' }[] = []
    
    rowNumberCells.forEach((cell, index) => {
      const rect = cell.getBoundingClientRect()
      if (index === 0) {
        rowHeaderLeft = rect.left
        rowHeaderWidth = rect.width
        // 最初の行の上端（行0の前に挿入）
        rowBoundaries.push({ y: rect.top, rowIndex: 0, position: 'before' })
      }
      // 各行の下端（行indexの後に挿入）
      rowBoundaries.push({ y: rect.bottom, rowIndex: index, position: 'after' })
    })

    // マウスが行番号セルのX範囲内にあるかチェック
    if (rowNumberCells.length > 0 && mouseX >= rowHeaderLeft - threshold && mouseX <= rowHeaderLeft + rowHeaderWidth + threshold) {
      // 各境界線との距離をチェック
      for (const boundary of rowBoundaries) {
        if (Math.abs(mouseY - boundary.y) <= threshold) {
          newState = {
            type: 'row',
            index: boundary.rowIndex,
            position: boundary.position,
            top: boundary.y,
            left: rowHeaderLeft + rowHeaderWidth / 2
          }
          break
        }
      }
    }

    // === 列の境界線を収集して検出 ===
    if (!newState) {
      let colHeaderTop = 0
      let colHeaderHeight = 0
      const colBoundaries: { x: number; colIndex: number; position: 'before' | 'after' }[] = []
      
      colHeaderCells.forEach((cell, index) => {
        const rect = cell.getBoundingClientRect()
        if (index === 0) {
          colHeaderTop = rect.top
          colHeaderHeight = rect.height
          // 最初の列の左端（列0の前に挿入）
          colBoundaries.push({ x: rect.left, colIndex: 0, position: 'before' })
        }
        // 各列の右端（列indexの後に挿入）
        colBoundaries.push({ x: rect.right, colIndex: index, position: 'after' })
      })

      // マウスが列ヘッダーセルのY範囲内にあるかチェック
      if (colHeaderCells.length > 0 && mouseY >= colHeaderTop - threshold && mouseY <= colHeaderTop + colHeaderHeight + threshold) {
        // 各境界線との距離をチェック
        for (const boundary of colBoundaries) {
          if (Math.abs(mouseX - boundary.x) <= threshold) {
            newState = {
              type: 'column',
              index: boundary.colIndex,
              position: boundary.position,
              top: colHeaderTop + colHeaderHeight / 2,
              left: boundary.x
            }
            break
          }
        }
      }
    }
    
    // 状態が変わった場合のみ更新（不要な再レンダリングを防ぐ）
    const stateChanged = 
      (newState === null && hoverAddButton !== null) ||
      (newState !== null && hoverAddButton === null) ||
      (newState !== null && hoverAddButton !== null && (
        newState.type !== hoverAddButton.type ||
        newState.index !== hoverAddButton.index ||
        newState.position !== hoverAddButton.position
      ))
    
    if (stateChanged) {
      setHoverAddButton(newState)
    }
  }

  // 行削除（メニューから）
  const handleDeleteRow = (index: number) => {
    removeTableRow(index)
    setContextMenu(null)
  }

  // 列削除（メニューから）
  const handleDeleteColumn = (index: number) => {
    removeTableColumn(index)
    setContextMenu(null)
  }

  // セル選択ハンドラ
  const handleCellSelect = (row: number, col: number, isHeader: boolean = false) => {
    setSelectedCell({ row, col, isHeader })
  }

  // 数式バーからの値変更ハンドラ
  const handleFormulaBarChange = (value: string) => {
    if (!selectedCell || !item || !onUpdateItem) return
    
    if (selectedCell.isHeader) {
      // ヘッダーセルの場合
      const newHeaders = [...tableHeaders]
      newHeaders[selectedCell.col] = value
      setTableHeaders(newHeaders)
      
      if (item.type === 'table') {
        onUpdateItem(item.id, {
          data: tableData,
          headers: useHeaders ? newHeaders : undefined,
          cellTypes,
          cellFormats,
          mergedCells
        } as Partial<TableItem>)
      }
    } else {
      // データセルの場合
      handleTableCellChange(selectedCell.row, selectedCell.col, value)
    }
  }

  // データ型のアイコンとラベルを取得
  const getDataTypeInfo = (type: CellDataType): { icon: string; label: string } => {
    switch (type) {
      case 'text': return { icon: 'notes', label: 'テキスト' }
      case 'number': return { icon: 'tag', label: '数値' }
      case 'date': return { icon: 'calendar_today', label: '日付' }
      case 'percentage': return { icon: 'percent', label: 'パーセント' }
      case 'currency': return { icon: 'currency_yen', label: '通貨' }
      case 'category': return { icon: 'sell', label: 'カテゴリ' }
      case 'formula': return { icon: 'function', label: '数式' }
      case 'checkbox': return { icon: 'check_box', label: 'チェックボックス' }
      default: return { icon: 'notes', label: 'テキスト' }
    }
  }

  // 列の軸割り当てを取得（Phase 2: ヘッダーバッジ用）
  const getColumnAxisBadge = (colIndex: number): { label: string; color: string } | null => {
    // グラフ形式が表の場合はバッジなし
    if (tableDisplayFormat === 'table') return null
    
    // X軸
    if (chartConfig.xAxisColumn === colIndex) {
      return { label: 'X', color: '#3b82f6' }  // blue
    }
    
    // Z軸
    if (chartConfig.zColumn === colIndex) {
      const usage = chartConfig.zUsage || 'size'
      return { label: `Z:${usage === 'size' ? 'サイズ' : usage === 'color' ? '色' : 'グループ'}`, color: '#8b5cf6' }  // purple
    }
    
    // Y2軸（右）
    if (chartConfig.yAxisRightColumns?.includes(colIndex)) {
      // 系列設定があればタイプを表示
      const seriesConfig = chartConfig.seriesConfigs?.find(sc => sc.column === colIndex)
      const typeLabel = seriesConfig?.displayType === 'line' ? '線' : seriesConfig?.displayType === 'area' ? '面' : '棒'
      return { label: `Y2:${typeLabel}`, color: '#f97316' }  // orange
    }
    
    // Y軸（左）
    if (chartConfig.yAxisColumns?.includes(colIndex)) {
      // 系列設定があればタイプを表示
      const seriesConfig = chartConfig.seriesConfigs?.find(sc => sc.column === colIndex)
      const typeLabel = seriesConfig?.displayType === 'line' ? '線' : seriesConfig?.displayType === 'area' ? '面' : '棒'
      return { label: `Y:${typeLabel}`, color: '#10b981' }  // green
    }
    
    return null
  }

  // 選択中のセルの値を取得（生の値、数式バー用）
  const getSelectedCellValue = (): string => {
    if (!selectedCell) return ''
    
    if (selectedCell.isHeader) {
      return tableHeaders[selectedCell.col] || ''
    } else {
      // 数式の場合は生の値を返す（数式バーで編集可能にするため）
      const rawValue = tableData[selectedCell.row]?.[selectedCell.col] || ''
      return rawValue
    }
  }
  
  // セルのデータ型を設定
  const handleSetCellType = (rowIndex: number, colIndex: number, type: CellDataType) => {
    if (!item || !onUpdateItem) return
    const cellKey = getCellKey(rowIndex, colIndex)
    const newCellTypes = { ...cellTypes, [cellKey]: type }
    setCellTypes(newCellTypes)
    
    // デフォルトフォーマットを設定
    if (type !== 'text') {
      const newCellFormats = { ...cellFormats, [cellKey]: getDefaultCellFormat(type) }
      setCellFormats(newCellFormats)
      
      if (item.type === 'table') {
        onUpdateItem(item.id, {
          cellTypes: newCellTypes,
          cellFormats: newCellFormats
        } as Partial<TableItem>)
      }
    } else {
      if (item.type === 'table') {
        onUpdateItem(item.id, {
          cellTypes: newCellTypes
        } as Partial<TableItem>)
      }
    }
  }
  
  // セルのフォーマットを設定
  const handleSetCellFormat = (rowIndex: number, colIndex: number, format: CellFormat) => {
    if (!item || !onUpdateItem) return
    const cellKey = getCellKey(rowIndex, colIndex)
    const newCellFormats = { ...cellFormats, [cellKey]: format }
    setCellFormats(newCellFormats)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        cellFormats: newCellFormats
      } as Partial<TableItem>)
    }
  }
  
  // 列全体のフォーマットを設定
  const handleSetColumnFormat = (colIndex: number, format: CellFormat) => {
    if (!item || !onUpdateItem) return
    const newCellFormats = { ...cellFormats }
    
    // 列全体のすべてのセルにフォーマットを適用
    for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      const cellKey = getCellKey(rowIndex, colIndex)
      newCellFormats[cellKey] = format
    }
    
    setCellFormats(newCellFormats)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        cellFormats: newCellFormats
      } as Partial<TableItem>)
    }
  }
  
  // 列全体のデータ型を設定
  const handleSetColumnType = (colIndex: number, newType: CellDataType) => {
    if (!item || !onUpdateItem) return
    const newCellTypes = { ...cellTypes }
    const newCellFormats = { ...cellFormats }
    
    // 列全体のすべてのセルにデータ型とデフォルトフォーマットを適用
    for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      const cellKey = getCellKey(rowIndex, colIndex)
      newCellTypes[cellKey] = newType
      if (newType !== 'text') {
        newCellFormats[cellKey] = getDefaultCellFormat(newType)
      }
    }
    
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    setFormatDialogDataType(newType)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        cellTypes: newCellTypes,
        cellFormats: newCellFormats
      } as Partial<TableItem>)
    }
  }
  
  // 列全体のデータ型を自動推測
  const handleInferColumnType = (colIndex: number) => {
    if (!item || !onUpdateItem) return
    const newCellTypes = { ...cellTypes }
    const newCellFormats = { ...cellFormats }
    
    // 列全体のセルのデータ型を自動推測
    for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      const cellKey = getCellKey(rowIndex, colIndex)
      const value = tableData[rowIndex]?.[colIndex] || ''
      if (value) {
        newCellTypes[cellKey] = inferCellDataType(value)
        // デフォルトフォーマットも設定
        const inferredType = newCellTypes[cellKey]
        if (inferredType !== 'text') {
          newCellFormats[cellKey] = getDefaultCellFormat(inferredType)
        }
      }
    }
    
    setCellTypes(newCellTypes)
    setCellFormats(newCellFormats)
    
    // 列の最初のセルの型をダイアログの選択状態に反映
    const firstCellKey = getCellKey(0, colIndex)
    const firstCellType = newCellTypes[firstCellKey] || 'text'
    setFormatDialogDataType(firstCellType)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, { 
        cellTypes: newCellTypes,
        cellFormats: newCellFormats
      } as Partial<TableItem>)
    }
  }
  
  // セル結合
  const handleMergeCells = (startRow: number, startCol: number, endRow: number, endCol: number) => {
    if (!item || !onUpdateItem) return
    
    const rowSpan = endRow - startRow + 1
    const colSpan = endCol - startCol + 1
    
    if (rowSpan === 1 && colSpan === 1) return
    
    const newMergedCells = [...mergedCells, {
      row: startRow,
      col: startCol,
      rowSpan,
      colSpan
    }]
    
    setMergedCells(newMergedCells)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        mergedCells: newMergedCells
      } as Partial<TableItem>)
    }
  }
  
  // セル結合解除
  const handleUnmergeCell = (row: number, col: number) => {
    if (!item || !onUpdateItem) return
    
    const newMergedCells = mergedCells.filter(merged => 
      !(merged.row === row && merged.col === col)
    )
    
    setMergedCells(newMergedCells)
    
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        mergedCells: newMergedCells
      } as Partial<TableItem>)
    }
  }
  
  // セルが結合されているかチェック
  const isCellMerged = (row: number, col: number): { row: number; col: number; rowSpan: number; colSpan: number } | null => {
    return mergedCells.find(merged => {
      return row >= merged.row && row < merged.row + merged.rowSpan &&
             col >= merged.col && col < merged.col + merged.colSpan
    }) || null
  }
  
  // セルが結合の開始セルかチェック
  const isMergeStartCell = (row: number, col: number): boolean => {
    return mergedCells.some(merged => merged.row === row && merged.col === col)
  }

  const handleUseHeadersChange = (checked: boolean) => {
    if (!item || !onUpdateItem) return
    setUseHeaders(checked)
    
    // 即座に保存
    if (item.type === 'table') {
      onUpdateItem(item.id, {
        data: tableData,
        headers: checked ? tableHeaders : undefined,
        cellTypes,
        cellFormats,
        mergedCells
      } as Partial<TableItem>)
    }
  }

  // Markdownテーブルからインポート
  const handleMarkdownImport = () => {
    if (!item || !onUpdateItem || item.type !== 'table') return
    
    const parsed = parseMarkdownTable(markdownInput)
    
    if (!parsed) {
      setMarkdownImportError('有効なMarkdownテーブルが見つかりません。| で区切られた形式で入力してください。')
      return
    }
    
    // パースに成功した場合、データを適用
    const newData = parsed.data.length > 0 ? parsed.data : [['', '']]
    const newHeaders = parsed.hasHeaders ? parsed.headers : []
    const newUseHeaders = parsed.hasHeaders
    
    // 列数を揃える
    const colCount = parsed.hasHeaders ? parsed.headers.length : (parsed.data[0]?.length || 2)
    const normalizedHeaders = [...newHeaders]
    while (normalizedHeaders.length < colCount) {
      normalizedHeaders.push('')
    }
    
    // データがない場合は空行を1つ追加
    const normalizedData = newData.length > 0 ? newData : [Array(colCount).fill('')]
    
    // 状態を更新
    setTableData(normalizedData)
    setTableHeaders(normalizedHeaders)
    setUseHeaders(newUseHeaders)
    // セルタイプとフォーマットをリセット
    setCellTypes({})
    setCellFormats({})
    setMergedCells([])
    setHiddenRows([])
    setHiddenColumns([])
    
    // 保存
    onUpdateItem(item.id, {
      data: normalizedData,
      headers: newUseHeaders ? normalizedHeaders : undefined,
      cellTypes: {},
      cellFormats: {},
      mergedCells: [],
      hiddenRows: []
    } as Partial<TableItem>)
    
    // ダイアログを閉じる
    setShowMarkdownImport(false)
    setMarkdownInput('')
    setMarkdownImportError('')
  }

  const handleTextContentChange = (value: string) => {
    setTextContent(value)
  }

  const handleTextContentBlur = () => {
    if (!item || !onUpdateItem) return
    if (item.type === 'text' && textContent.trim() !== (item as TextItem).content) {
      onUpdateItem(item.id, { content: textContent } as Partial<TextItem>)
    }
  }

  const handleImageAltChange = (value: string) => {
    setImageAlt(value)
  }

  const handleImageAltBlur = () => {
    if (!item || !onUpdateItem) return
    if (item.type === 'image') {
      const imageItem = item as ImageItem
      if (imageAlt !== (imageItem.alt || '')) {
        onUpdateItem(item.id, { alt: imageAlt } as Partial<ImageItem>)
      }
    }
  }

  const handleImageDisplayModeChange = (mode: ImageDisplayMode) => {
    if (!item || !onUpdateItem) return
    setImageDisplayMode(mode)
    
    // 即座に保存
    if (item.type === 'image') {
      setDisplayMode(mode)
      onUpdateItem(item.id, { displayMode: mode } as Partial<ImageItem>)
    }
  }

  // 作成モードのバリデーション
  const validateCreateName = (value: string): boolean => {
    if (!value.trim()) {
      setCreateNameError('名前を入力してください')
      return false
    }
    const isDuplicate = existingNames.some(n => n === value)
    if (isDuplicate) {
      setCreateNameError('この名前は既に使用されています')
      return false
    }
    setCreateNameError('')
    return true
  }

  // 作成モードの保存ハンドラー
  const handleCreate = () => {
    if (!onCreateItem) return
    if (!validateCreateName(createName)) return

    const baseItem: Partial<Item> = {
      name: createName.trim(),
      type: createType
    }

    // 空のデフォルト値で作成し、実際の編集は追加後に行う
    let itemData: Partial<Item>
    switch (createType) {
      case 'table':
        itemData = {
          ...baseItem,
          data: [['', ''], ['', ''], ['', '']],  // デフォルトの空テーブル（3行2列）
          headers: undefined
        } as Partial<TableItem>
        break
      case 'image':
        itemData = {
          ...baseItem,
          dataUrl: '',
          alt: '',
          displayMode: imageDisplayMode
        } as Partial<ImageItem>
        break
      case 'text':
        itemData = {
          ...baseItem,
          content: ''
        } as Partial<TextItem>
        break
      case 'picto':
        itemData = {
          ...baseItem,
          elements: [],
          connectors: [],
          groups: [],
          comments: [],
          canvasSize: DEFAULT_CANVAS_SIZE
        } as Partial<PictoItem>
        break
      case 'euler':
        itemData = {
          ...baseItem,
          circles: [],
          elements: [],
          canvasSize: DEFAULT_EULER_CANVAS_SIZE
        } as Partial<EulerItem>
        break
      default:
        return
    }

    onCreateItem(itemData)
    // 状態をリセット
    setCreateName('')
    setCreateType('table')
    setTableData([['', ''], ['', ''], ['', '']])
    setTableHeaders(['', ''])
    setUseHeaders(false)
    setImageDataUrl('')
    setImageAlt('')
    setTextContent('')
  }


  // 新しいアイテム（type: 'new'）選択時のUI
  if (item?.type === 'new') {
    return (
      <div className="item-detail-panel">
        <div className="item-create-form">
          <div className="item-create-header">
            <h2>新しいアイテム</h2>
          </div>

          <div className="item-create-content">
            {/* 名前入力 */}
            <div className="item-create-field">
              <label htmlFor="create-item-name">名前 *</label>
              <input
                id="create-item-name"
                type="text"
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value)
                  validateCreateName(e.target.value)
                }}
                placeholder="アイテム名を入力"
                className={createNameError ? 'error' : ''}
                autoFocus
              />
              {createNameError && <div className="item-create-error">{createNameError}</div>}
            </div>

            {/* タイプ選択 */}
            <div className="item-create-field">
              <label>タイプ *</label>
              <div className="item-type-selector">
                <button
                  className={`item-type-button ${createType === 'table' ? 'active' : ''}`}
                  onClick={() => setCreateType('table')}
                >
                  <span className="material-icons">table_chart</span>
                  Table
                </button>
                <button
                  className={`item-type-button ${createType === 'text' ? 'active' : ''}`}
                  onClick={() => setCreateType('text')}
                >
                  <span className="material-icons">notes</span>
                  Text
                </button>
                <button
                  className={`item-type-button ${createType === 'image' ? 'active' : ''}`}
                  onClick={() => setCreateType('image')}
                >
                  <span className="material-icons">image</span>
                  Image
                </button>
                <button
                  className={`item-type-button ${createType === 'picto' ? 'active' : ''}`}
                  onClick={() => setCreateType('picto')}
                >
                  <span className="material-icons">schema</span>
                  Pictogram
                </button>
                <button
                  className={`item-type-button ${createType === 'euler' ? 'active' : ''}`}
                  onClick={() => setCreateType('euler')}
                >
                  <EulerIcon size={24} />
                  Euler
                </button>
              </div>
              <div className="item-create-action">
                <button onClick={handleCreate} className="modal-button primary">
                  作成
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="item-detail-panel empty">
        <div className="item-detail-empty">
          <span className="material-icons">inventory_2</span>
          <p>Select an item to view details</p>
        </div>
      </div>
    )
  }

  // メインスライドの場合はエディタにフォーカス
  if (item.id === MAIN_SLIDE_ITEM_ID) {
    return (
      <div className="item-detail-panel">
        <div className="item-detail-content">
          <div className="item-detail-preview">
            <p>This is the main slide content. Edit it in the editor.</p>
            <button
              className="item-detail-action-button edit"
              onClick={() => onEdit(item)}
              style={{ marginTop: '1rem' }}
            >
              <span className="material-icons">edit</span>
              Focus Editor
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getEditUI = () => {
    switch (item.type) {
      case 'table':
        const tableEditorContent = (
          <div className="table-editor-container">
            {/* フローティングツールバー（overflow コンテナの外） */}
            <div className="table-toolbar-floating">
              <GraphTypeHoverSelector
                currentFormat={tableDisplayFormat}
                onFormatChange={handleGraphFormatChange}
              />
              <GraphSettingsPanel
                table={item as TableItem}
                onUpdateTable={handleUpdateTableItem}
                selectedCategory={graphCategory}
                onCategoryChange={setGraphCategory}
                mode="inline"
              />
            </div>
            
          <div className="table-editor-wrapper">
          <div className="table-editor-modern">
              {/* ツールバー行（ビュータブのみ） */}
              <div className="table-toolbar-row">
                {/* 左側：ビュー切り替えタブ */}
                <div className="notion-view-tabs">
                  <button
                    className={`notion-view-tab ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                    type="button"
                  >
                    <span className="material-icons">table_chart</span>
                    <span>Table</span>
                  </button>
                  {isTreeInputChart(tableDisplayFormat) && (
                    <button
                      className={`notion-view-tab ${viewMode === 'tree' ? 'active' : ''}`}
                      onClick={() => setViewMode('tree')}
                      type="button"
                    >
                      <span className="material-icons">account_tree</span>
                      <span>Tree</span>
                    </button>
                  )}
                </div>
              </div>
              
            {/* ビューモードに応じたUI切り替え */}
            {viewMode === 'tree' && isTreeInputChart(tableDisplayFormat) ? (
              /* ツリー入力UI（サンキー、ツリーマップ等） */
              <TreeInput
                treeData={treeData}
                treeSettings={treeSettings}
                onTreeDataChange={handleTreeDataChange}
                onTreeSettingsChange={handleTreeSettingsChange}
              />
            ) : (
              /* スプレッドシート入力UI（デフォルト） */
              <>
            {/* フィルターバー */}
            <div className="table-filter-bar">
              <button 
                className={`table-filter-toggle ${filterConfig.length > 0 ? 'active' : ''}`}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <span className="material-icons">filter_list</span>
                <span>フィルター</span>
                {filterConfig.length > 0 && (
                  <span className="filter-count">{filterConfig.length}</span>
                )}
              </button>
              
              {filterConfig.length > 0 && (
                <button 
                  className="table-filter-clear"
                  onClick={() => setFilterConfig([])}
                >
                  <span className="material-icons">close</span>
                  クリア
                </button>
              )}
              
              {showFilterDropdown && (
                <div className="table-filter-dropdown">
                  <div className="filter-dropdown-header">フィルター条件を追加</div>
                  {filterConfig.map((filter, idx) => (
                    <div key={idx} className="filter-condition">
                      <select
                        value={filter.column}
                        onChange={(e) => {
                          const newFilters = [...filterConfig]
                          newFilters[idx] = { ...filter, column: parseInt(e.target.value) }
                          setFilterConfig(newFilters)
                        }}
                      >
                        {tableHeaders.map((header, colIdx) => (
                          <option key={colIdx} value={colIdx}>{header || `列 ${colIdx + 1}`}</option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => {
                          const newFilters = [...filterConfig]
                          newFilters[idx] = { ...filter, operator: e.target.value as typeof filter.operator }
                          setFilterConfig(newFilters)
                        }}
                      >
                        <option value="contains">含む</option>
                        <option value="equals">等しい</option>
                        <option value="gt">より大きい</option>
                        <option value="lt">より小さい</option>
                        <option value="isEmpty">空</option>
                        <option value="isNotEmpty">空でない</option>
                      </select>
                      {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                        <input
                          type="text"
                          value={filter.value || ''}
                          onChange={(e) => {
                            const newFilters = [...filterConfig]
                            newFilters[idx] = { ...filter, value: e.target.value }
                            setFilterConfig(newFilters)
                          }}
                          placeholder="値..."
                        />
                      )}
                      <button
                        className="filter-remove-btn"
                        onClick={() => {
                          const newFilters = filterConfig.filter((_, i) => i !== idx)
                          setFilterConfig(newFilters)
                        }}
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  ))}
                  <button
                    className="filter-add-btn"
                    onClick={() => {
                      setFilterConfig([...filterConfig, { column: 0, operator: 'contains', value: '' }])
                    }}
                  >
                    <span className="material-icons">add</span>
                    条件を追加
                  </button>
                </div>
              )}
            </div>
            
            {/* スプレッドシート風テーブル */}
            <div className="table-scroll-container">
              <div className="table-scroll-viewport" ref={tableScrollViewportRef}>
            <div className="table-spreadsheet-grid">
              {/* テーブル本体 */}
              <div 
                className="table-spreadsheet-container"
                onMouseMove={handleTableContainerMouseMove}
                onMouseLeave={handleHeaderCellMouseLeave}
              >
                <table ref={tableRef} className="table-spreadsheet notion-table" style={{ width: tableWidthPx, minWidth: tableWidthPx }}>
                  <thead>
                    {/* Notion風プロパティヘッダー（列名+データ型アイコン） */}
                    <tr className="table-col-headers notion-property-headers">
                      <th className="table-corner notion-corner"></th>
                      {(displayData[0] || []).map((_, colIndex) => {
                        // 列のデータ型を取得（最初のセルのデータ型）
                        const firstCellKey = getCellKey(0, colIndex)
                        const colType = cellTypes[firstCellKey] || 'text'
                        // 軸割り当てバッジを取得
                        const axisBadge = getColumnAxisBadge(colIndex)
                        // プロパティ名（ヘッダーから取得、なければデフォルト）
                        const propertyName = useHeaders && displayHeaders[colIndex] 
                          ? displayHeaders[colIndex] 
                          : `列 ${colIndex + 1}`
                        // データ型のアイコン
                        const typeInfo = getDataTypeInfo(colType)
                        const isColumnDragging = draggedColumn === colIndex
                        const isColumnDropTarget = dropTargetColumn === colIndex
                        return (
                          <th
                            key={colIndex}
                            className={`table-col-header notion-property-header ${selectedCell?.isHeader && selectedCell?.col === colIndex ? 'table-cell-selected' : ''} ${isColumnDragging ? 'dragging' : ''} ${isColumnDropTarget ? (draggedColumn !== null && draggedColumn < colIndex ? 'drop-target-left' : 'drop-target-right') : ''}`}
                            style={{ width: getColumnWidth(colIndex), minWidth: getColumnWidth(colIndex) }}
                            onDragOver={(e) => handleColumnDragOver(e, colIndex)}
                            onDragLeave={handleColumnDragLeave}
                            onDrop={(e) => handleColumnDrop(e, colIndex)}
                          >
                            {/* wrapper div でフレックスレイアウト */}
                            <div className="notion-header-wrapper">
                              {/* 段1: ドラッグハンドル + 軸ラベル */}
                              <div className="notion-header-row-1">
                                <button
                                  className="table-grip-icon column-grip"
                                  draggable
                                  onClick={(e) => handleGripClick(e, 'column', colIndex)}
                                  onDragStart={(e) => handleColumnDragStart(e, colIndex)}
                                  onDragEnd={handleColumnDragEnd}
                                  title="ドラッグで列を移動、クリックでオプション"
                                >
                                  <span className="material-icons">drag_indicator</span>
                                </button>
                                {/* 軸割り当てバッジ */}
                                {axisBadge && (
                                  <span
                                    className="table-axis-badge"
                                    style={{
                                      display: 'inline-block',
                                      padding: '1px 4px',
                                      fontSize: 9,
                                      fontWeight: 600,
                                      borderRadius: 3,
                                      backgroundColor: axisBadge.color,
                                      color: '#fff',
                                    }}
                                    title={`軸設定: ${axisBadge.label}`}
                                  >
                                    {axisBadge.label}
                                  </span>
                                )}
                              </div>
                              {/* 段2: データ型ドロップダウン + プロパティ名 + ソートアイコン */}
                              <div className="notion-header-row-2">
                                <button
                                  className="header-type-dropdown"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setTypeDropdownColumn(typeDropdownColumn === colIndex ? null : colIndex)
                                  }}
                                  title={`データ型: ${typeInfo.label}`}
                                >
                                  <span className="material-icons">{typeInfo.icon}</span>
                                </button>
                                {useHeaders ? (
                                  <input
                                    type="text"
                                    value={displayHeaders[colIndex] || ''}
                                    onChange={(e) => handleTableHeaderChange(colIndex, e.target.value)}
                                    onFocus={() => handleCellSelect(-1, colIndex, true)}
                                    placeholder={`プロパティ ${colIndex + 1}`}
                                    className="notion-property-input"
                                  />
                                ) : (
                                  <span className="notion-property-name">{propertyName}</span>
                                )}
                                {/* ソートアイコン */}
                                <button
                                  className={`header-sort-button ${sortConfig?.column === colIndex ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (sortConfig?.column === colIndex) {
                                      if (sortConfig.direction === 'asc') {
                                        setSortConfig({ column: colIndex, direction: 'desc' })
                                      } else {
                                        setSortConfig(null) // ソート解除
                                      }
                                    } else {
                                      setSortConfig({ column: colIndex, direction: 'asc' })
                                    }
                                  }}
                                  title={sortConfig?.column === colIndex 
                                    ? (sortConfig.direction === 'asc' ? '降順にソート' : 'ソート解除') 
                                    : '昇順にソート'
                                  }
                                >
                                  <span className="material-icons">
                                    {sortConfig?.column === colIndex 
                                      ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward')
                                      : 'swap_vert'
                                    }
                                  </span>
                                </button>
                              </div>
                              {/* 段3: 単位・桁・小数点（数値型のみ） */}
                              {(colType === 'number' || colType === 'currency' || colType === 'percentage') && (
                                <div className="notion-header-row-3">
                                  <select
                                    className="header-unit-select"
                                    value={cellFormats[firstCellKey]?.unit || ''}
                                    onChange={(e) => handleSetColumnFormat(colIndex, {
                                      ...cellFormats[firstCellKey],
                                      type: colType,
                                      unit: e.target.value
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="">-</option>
                                    <option value="円">円</option>
                                    <option value="人">人</option>
                                    <option value="件">件</option>
                                    <option value="%">%</option>
                                    <option value="kg">kg</option>
                                    <option value="km">km</option>
                                    <option value="個">個</option>
                                    <option value="台">台</option>
                                  </select>
                                  <select
                                    className="header-scale-select"
                                    value={cellFormats[firstCellKey]?.scale || 'none'}
                                    onChange={(e) => handleSetColumnFormat(colIndex, {
                                      ...cellFormats[firstCellKey],
                                      type: colType,
                                      scale: e.target.value as 'none' | 'thousand' | 'million' | 'billion'
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="none">-</option>
                                    <option value="thousand">千</option>
                                    <option value="million">百万</option>
                                    <option value="billion">十億</option>
                                  </select>
                                  <input
                                    type="number"
                                    className="header-decimal-input"
                                    min="0"
                                    max="10"
                                    placeholder="0"
                                    value={cellFormats[firstCellKey]?.decimalPlaces ?? 0}
                                    onChange={(e) => handleSetColumnFormat(colIndex, {
                                      ...cellFormats[firstCellKey],
                                      type: colType,
                                      decimalPlaces: parseInt(e.target.value) || 0
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                            {/* リサイズハンドル */}
                            <div
                              className="column-resize-handle"
                              onMouseDown={(e) => handleResizeStart(e, colIndex)}
                            />
                          </th>
                        )
                      })}
                      {/* Notion風プロパティ追加ボタン */}
                      <th className="notion-add-property-header">
                        <button onClick={addTableColumn} className="notion-add-property-btn">
                          <span className="material-icons">add</span>
                          <span>プロパティを追加</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* データ行 */}
                    {displayData.map((row, rowIndex) => {
                      const isRowHidden = hiddenRows.includes(rowIndex)
                      const isRowDragging = draggedRow === rowIndex
                      const isRowDropTarget = dropTargetRow === rowIndex
                      return (
                      <tr 
                        key={rowIndex} 
                        className={`table-data-row notion-data-row ${isRowHidden ? 'hidden-cell' : ''} ${isRowDragging ? 'dragging' : ''} ${isRowDropTarget ? (draggedRow !== null && draggedRow < rowIndex ? 'drop-target-above' : 'drop-target-below') : ''}`}
                        onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                        onDragLeave={handleRowDragLeave}
                        onDrop={(e) => handleRowDrop(e, rowIndex)}
                      >
                        <td className={`table-row-number notion-row-handle ${isRowHidden ? 'hidden-cell' : ''}`}>
                          <button
                            className="table-grip-icon row-grip notion-row-grip"
                            draggable
                            onClick={(e) => handleGripClick(e, 'row', rowIndex)}
                            onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                            onDragEnd={handleRowDragEnd}
                            title="ドラッグで行を移動、クリックでオプション"
                          >
                            <span className="material-icons">drag_indicator</span>
                          </button>
                        </td>
                        {row.map((cell, colIndex) => {
                          const merged = isCellMerged(rowIndex, colIndex)
                          const isStartCell = isMergeStartCell(rowIndex, colIndex)
                          const cellKey = getCellKey(rowIndex, colIndex)
                          const cellType = cellTypes[cellKey] || 'text'
                          const hasError = validationErrors[cellKey]
                          const displayValue = getCellDisplayValue(rowIndex, colIndex)
                          // セル単位で非表示判定（行が非表示ならこのセルは非表示）
                          const isCellHiddenFlag = isCellHidden(rowIndex, colIndex, hiddenRows, [])
                          
                          // 表示範囲の境界位置を計算（点線判定付き）
                          const borderPos = getCellBorderPositionWithDashed(rowIndex, colIndex, filledRange, hiddenRows, [])
                          // ヘッダーがある場合、最初のデータ行の上枠線は不要（ヘッダー行が上端）
                          const showTopBorder = borderPos.top.show && !useHeaders
                          const borderClasses = [
                            showTopBorder ? (borderPos.top.dashed ? 'display-range-border-top-dashed' : 'display-range-border-top') : '',
                            borderPos.right.show ? (borderPos.right.dashed ? 'display-range-border-right-dashed' : 'display-range-border-right') : '',
                            borderPos.bottom.show ? (borderPos.bottom.dashed ? 'display-range-border-bottom-dashed' : 'display-range-border-bottom') : '',
                            borderPos.left.show ? (borderPos.left.dashed ? 'display-range-border-left-dashed' : 'display-range-border-left') : ''
                          ].filter(Boolean).join(' ')
                          
                          // 結合セルの場合、開始セル以外は非表示
                          if (merged && !isStartCell) {
                            return null
                          }
                          
                          return (
                          <td 
                            key={colIndex} 
                              className={`table-data-cell ${selectedCell && !selectedCell.isHeader && selectedCell.row === rowIndex && selectedCell.col === colIndex ? 'table-cell-selected' : ''} ${hasError ? 'table-cell-error' : ''} ${isCellHiddenFlag ? 'hidden-cell' : ''} ${borderClasses} ${cellRangeSelection.start && cellRangeSelection.end && (
                                (rowIndex >= Math.min(cellRangeSelection.start.row, cellRangeSelection.end.row) && 
                                 rowIndex <= Math.max(cellRangeSelection.start.row, cellRangeSelection.end.row) &&
                                 colIndex >= Math.min(cellRangeSelection.start.col, cellRangeSelection.end.col) &&
                                 colIndex <= Math.max(cellRangeSelection.start.col, cellRangeSelection.end.col))
                              ) ? 'table-cell-range-selected' : ''}`}
                              style={{ width: getColumnWidth(colIndex), minWidth: getColumnWidth(colIndex) }}
                              rowSpan={merged ? merged.rowSpan : undefined}
                              colSpan={merged ? merged.colSpan : undefined}
                              onMouseDown={(e) => {
                                // セル入力フィールドのクリックは無視
                                if ((e.target as HTMLElement).tagName === 'INPUT') return
                                
                                // Shiftキーが押されている場合、範囲選択のみ（ドラッグ開始なし）
                                if (e.shiftKey && cellRangeSelection.start) {
                                  e.preventDefault()
                                  setCellRangeSelection({
                                    start: cellRangeSelection.start,
                                    end: { row: rowIndex, col: colIndex }
                                  })
                                  return
                                }
                                
                                // 通常のマウスダウン：ドラッグ選択を開始
                                e.preventDefault()
                                setIsDragging(true)
                                setCellRangeSelection({ 
                                  start: { row: rowIndex, col: colIndex }, 
                                  end: { row: rowIndex, col: colIndex } 
                                })
                              }}
                              onMouseEnter={() => {
                                if (isDragging && cellRangeSelection.start) {
                                  setCellRangeSelection({ ...cellRangeSelection, end: { row: rowIndex, col: colIndex } })
                                }
                              }}
                              onMouseUp={() => {
                                if (isDragging) {
                                  setIsDragging(false)
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                const rect = e.currentTarget.getBoundingClientRect()
                                setContextMenu({
                                  type: 'cell',
                                  index: 0,
                                  cellRow: rowIndex,
                                  cellCol: colIndex,
                                  x: rect.right,
                                  y: rect.top
                                })
                              }}
                            >
                              <div 
                                className="table-cell-wrapper"
                                onMouseDown={(e) => {
                                  // input要素のクリックは無視
                                  if ((e.target as HTMLElement).tagName === 'INPUT') return
                                  
                                  // Shiftキーが押されている場合、範囲選択のみ（ドラッグ開始なし）
                                  if (e.shiftKey && cellRangeSelection.start) {
                                    e.preventDefault()
                                    setCellRangeSelection({
                                      start: cellRangeSelection.start,
                                      end: { row: rowIndex, col: colIndex }
                                    })
                                    return
                                  }
                                  
                                  // 通常のマウスダウン：ドラッグ選択を開始
                                  e.preventDefault()
                                  setIsDragging(true)
                                  setCellRangeSelection({ 
                                    start: { row: rowIndex, col: colIndex }, 
                                    end: { row: rowIndex, col: colIndex } 
                                  })
                                }}
                                onMouseEnter={() => {
                                  if (isDragging && cellRangeSelection.start) {
                                    setCellRangeSelection({ ...cellRangeSelection, end: { row: rowIndex, col: colIndex } })
                                  }
                                }}
                                onMouseUp={() => {
                                  if (isDragging) {
                                    setIsDragging(false)
                                  }
                                }}
                          >
                            {/* チェックボックス型の場合は特別なUI */}
                            {cellType === 'checkbox' ? (
                              <button
                                className={`table-checkbox ${cell === 'true' ? 'checked' : ''}`}
                                onClick={() => handleTableCellChange(rowIndex, colIndex, cell === 'true' ? 'false' : 'true')}
                                onFocus={() => handleCellSelect(rowIndex, colIndex, false)}
                              >
                                <span className="material-icons">
                                  {cell === 'true' ? 'check_box' : 'check_box_outline_blank'}
                                </span>
                              </button>
                            ) : cellType === 'formula' ? (
                              /* 数式型の場合は読み取り専用で結果を表示 */
                              <div className="table-formula-cell">
                                <span className="table-formula-result">{displayValue}</span>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => handleTableCellChange(rowIndex, colIndex, e.target.value)}
                                  onFocus={() => handleCellSelect(rowIndex, colIndex, false)}
                                  placeholder=""
                                  className={`table-input ${cellType !== 'text' ? `table-input-${cellType}` : ''} ${cell && cell.trim().startsWith('=') ? 'table-input-formula' : ''}`}
                                />
                                {cell && cellType !== 'text' && !cell.trim().startsWith('=') && (
                                  <span className="table-cell-formatted-value" title={displayValue}>
                                    {displayValue}
                                  </span>
                                )}
                                {cell && cell.trim().startsWith('=') && (
                                  <span className="table-cell-formula-result" title={displayValue}>
                                    {displayValue}
                                  </span>
                                )}
                              </>
                            )}
                            {hasError && (
                              <span className="table-cell-error-icon" title={hasError}>
                                <span className="material-icons">error</span>
                              </span>
                            )}
                          </div>
                          </td>
                          )
                        })}
                        {/* プロパティ追加列のセル（空） */}
                        <td className="notion-add-property-cell"></td>
                      </tr>
                    )})}
                    {/* Notion風新規行追加ボタン */}
                    <tr className="notion-add-record-row">
                      <td colSpan={(displayData[0]?.length || 2) + 2} className="notion-add-record-cell">
                        <button onClick={addTableRow} className="notion-add-record-btn">
                          <span className="material-icons">add</span>
                          <span>新規行</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
                </div>
              </div>
            </div>

            {/* フォーマット設定ダイアログ */}
            {showFormatDialog && (formatDialogCell || formatDialogColumn !== null) && (
              <div className="table-format-dialog-overlay" onClick={() => {
                setShowFormatDialog(false)
                setFormatDialogCell(null)
                setFormatDialogColumn(null)
              }}>
                <div className="table-format-dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="table-format-dialog-header">
                    <h3>{formatDialogColumn !== null ? '列の設定' : 'セルのフォーマット設定'}</h3>
                    <button className="table-format-dialog-close" onClick={() => {
                      setShowFormatDialog(false)
                      setFormatDialogCell(null)
                      setFormatDialogColumn(null)
                    }}>
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  <div className="table-format-dialog-content">
                    {(() => {
                      // 列全体の設定の場合
                      if (formatDialogColumn !== null) {
                        const currentFormat = cellFormats[getCellKey(0, formatDialogColumn)] || getDefaultCellFormat(formatDialogDataType)
                        
                        return (
                          <>
                            {/* データ型選択セクション */}
                            <div className="table-format-section">
                              <label className="table-format-section-label">データ型</label>
                              
                              {/* データ型自動推測ボタン */}
                              <button
                                className="table-auto-infer-button"
                                onClick={() => handleInferColumnType(formatDialogColumn)}
                              >
                                <span className="material-icons">auto_awesome</span>
                                <span>データ型を自動推測</span>
                              </button>
                              
                              <div className="table-datatype-selector">
                                {(['text', 'number', 'date', 'percentage', 'currency', 'category'] as CellDataType[]).map((type) => {
                                  const typeInfo = getDataTypeInfo(type)
                                  return (
                                    <button
                                      key={type}
                                      className={`table-datatype-button ${formatDialogDataType === type ? 'active' : ''}`}
                                      onClick={() => handleSetColumnType(formatDialogColumn, type)}
                                    >
                                      <span className="table-datatype-icon material-icons">
                                        {typeInfo.icon}
                                      </span>
                                      <span className="table-datatype-label">
                                        {typeInfo.label}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            
                            {/* フォーマット詳細セクション（テキストとカテゴリは表示しない） */}
                            {formatDialogDataType !== 'text' && formatDialogDataType !== 'category' && (
                              <>
                                <div className="table-format-divider"></div>
                                <div className="table-format-section">
                                  <label className="table-format-section-label">フォーマット詳細</label>
                                  {formatDialogDataType === 'number' ? (
                                    <>
                                      <label>小数点桁数</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={currentFormat.decimalPlaces ?? 2}
                                        onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                          ...currentFormat,
                                          decimalPlaces: parseInt(e.target.value) || 0
                                        })}
                                      />
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={currentFormat.useThousandsSeparator ?? true}
                                          onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                            ...currentFormat,
                                            useThousandsSeparator: e.target.checked
                                          })}
                                        />
                                        千の位区切りを使用
                                      </label>
                                    </>
                                  ) : formatDialogDataType === 'date' ? (
                                    <>
                                      <label>日付フォーマット</label>
                                      <select
                                        value={currentFormat.dateFormat || 'YYYY-MM-DD'}
                                        onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                          ...currentFormat,
                                          dateFormat: e.target.value
                                        })}
                                      >
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                      </select>
                                    </>
                                  ) : formatDialogDataType === 'currency' ? (
                                    <>
                                      <label>通貨記号</label>
                                      <select
                                        value={currentFormat.currencySymbol || '¥'}
                                        onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                          ...currentFormat,
                                          currencySymbol: e.target.value
                                        })}
                                      >
                                        <option value="¥">¥ (円)</option>
                                        <option value="$">$ (ドル)</option>
                                        <option value="€">€ (ユーロ)</option>
                                        <option value="£">£ (ポンド)</option>
                                      </select>
                                      <label>表示単位</label>
                                      <select
                                        value={currentFormat.currencyScale || 'none'}
                                        onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                          ...currentFormat,
                                          currencyScale: e.target.value as 'none' | 'thousand' | 'million' | 'billion'
                                        })}
                                      >
                                        <option value="none">なし</option>
                                        <option value="thousand">千</option>
                                        <option value="million">百万</option>
                                        <option value="billion">十億</option>
                                      </select>
                                      <label>小数点桁数</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={currentFormat.decimalPlaces ?? 2}
                                        onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                          ...currentFormat,
                                          decimalPlaces: parseInt(e.target.value) || 0
                                        })}
                                      />
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={currentFormat.useThousandsSeparator ?? true}
                                          onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                            ...currentFormat,
                                            useThousandsSeparator: e.target.checked
                                          })}
                                        />
                                        千の位区切りを使用
                                      </label>
                                    </>
                                  ) : formatDialogDataType === 'percentage' ? (
                                    <>
                                      <label>小数点桁数</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={currentFormat.percentageDecimalPlaces ?? 2}
                                        onChange={(e) => handleSetColumnFormat(formatDialogColumn, {
                                          ...currentFormat,
                                          percentageDecimalPlaces: parseInt(e.target.value) || 0
                                        })}
                                      />
                                    </>
                                  ) : null}
                                </div>
                              </>
                            )}
                          </>
                        )
                      }
                      
                      // 単一セルのフォーマット設定の場合
                      if (!formatDialogCell) return null
                      const cellKey = getCellKey(formatDialogCell.row, formatDialogCell.col)
                      const cellType = cellTypes[cellKey] || 'text'
                      const currentFormat = cellFormats[cellKey] || getDefaultCellFormat(cellType)
                      
                      if (cellType === 'number') {
                        return (
                          <>
                            <label>小数点桁数</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={currentFormat.decimalPlaces ?? 2}
                              onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                ...currentFormat,
                                decimalPlaces: parseInt(e.target.value) || 0
                              })}
                            />
                            <label>
                              <input
                                type="checkbox"
                                checked={currentFormat.useThousandsSeparator ?? true}
                                onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                  ...currentFormat,
                                  useThousandsSeparator: e.target.checked
                                })}
                              />
                              千の位区切りを使用
                            </label>
                          </>
                        )
                      } else if (cellType === 'date') {
                        return (
                          <>
                            <label>日付フォーマット</label>
                            <select
                              value={currentFormat.dateFormat || 'YYYY-MM-DD'}
                              onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                ...currentFormat,
                                dateFormat: e.target.value
                              })}
                            >
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            </select>
                          </>
                        )
                      } else if (cellType === 'currency') {
                        return (
                          <>
                            <label>通貨記号</label>
                            <select
                              value={currentFormat.currencySymbol || '¥'}
                              onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                ...currentFormat,
                                currencySymbol: e.target.value
                              })}
                            >
                              <option value="¥">¥ (円)</option>
                              <option value="$">$ (ドル)</option>
                              <option value="€">€ (ユーロ)</option>
                              <option value="£">£ (ポンド)</option>
                            </select>
                            <label>表示単位</label>
                            <select
                              value={currentFormat.currencyScale || 'none'}
                              onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                ...currentFormat,
                                currencyScale: e.target.value as 'none' | 'thousand' | 'million' | 'billion'
                              })}
                            >
                              <option value="none">なし</option>
                              <option value="thousand">千</option>
                              <option value="million">百万</option>
                              <option value="billion">十億</option>
                            </select>
                            <label>小数点桁数</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={currentFormat.decimalPlaces ?? 2}
                              onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                ...currentFormat,
                                decimalPlaces: parseInt(e.target.value) || 0
                              })}
                            />
                            <label>
                              <input
                                type="checkbox"
                                checked={currentFormat.useThousandsSeparator ?? true}
                                onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                  ...currentFormat,
                                  useThousandsSeparator: e.target.checked
                                })}
                              />
                              千の位区切りを使用
                            </label>
                          </>
                        )
                      } else if (cellType === 'percentage') {
                        return (
                          <>
                            <label>小数点桁数</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={currentFormat.percentageDecimalPlaces ?? 2}
                              onChange={(e) => handleSetCellFormat(formatDialogCell.row, formatDialogCell.col, {
                                ...currentFormat,
                                percentageDecimalPlaces: parseInt(e.target.value) || 0
                              })}
                            />
                          </>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Markdownインポートダイアログ */}
            {showMarkdownImport && (
              <div className="table-markdown-import-overlay" onClick={() => setShowMarkdownImport(false)}>
                <div className="table-markdown-import-dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="table-markdown-import-header">
                    <h3>Markdownからインポート</h3>
                    <button
                      className="table-markdown-import-close"
                      onClick={() => setShowMarkdownImport(false)}
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  <div className="table-markdown-import-content">
                    <p className="table-markdown-import-hint">
                      Markdownテーブル形式のテキストを貼り付けてください。<br />
                      例: <code>| 列1 | 列2 |</code>
                    </p>
                    <textarea
                      className="table-markdown-import-textarea"
                      value={markdownInput}
                      onChange={(e) => {
                        setMarkdownInput(e.target.value)
                        setMarkdownImportError('')
                      }}
                      placeholder={`| 変数 | Model 1 | Model 2 |\n|-----|:---:|:---:|\n| データ1 | .036** | — |\n| データ2 | .160 | .126 |`}
                      rows={10}
                    />
                    {markdownImportError && (
                      <div className="table-markdown-import-error">
                        <span className="material-icons">error</span>
                        {markdownImportError}
                      </div>
                    )}
                  </div>
                  <div className="table-markdown-import-footer">
                    <button
                      className="table-markdown-import-cancel"
                      onClick={() => setShowMarkdownImport(false)}
                    >
                      キャンセル
                    </button>
                    <button
                      className="table-markdown-import-submit"
                      onClick={handleMarkdownImport}
                      disabled={!markdownInput.trim()}
                    >
                      インポート
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* コンテキストメニュー */}
            {contextMenu && (
              <div 
                className="table-context-menu"
                style={{ 
                  position: 'fixed',
                  left: contextMenu.x,
                  top: contextMenu.y,
                  zIndex: 1000
                }}
              >
                {contextMenu.type === 'cell' && contextMenu.cellRow !== undefined && contextMenu.cellCol !== undefined ? (
                  <>
                    {isMergeStartCell(contextMenu.cellRow, contextMenu.cellCol) ? (
                      <button 
                        className="table-context-menu-item" 
                        onClick={() => {
                          handleUnmergeCell(contextMenu.cellRow!, contextMenu.cellCol!)
                          setContextMenu(null)
                        }}
                      >
                        <span className="material-icons">call_split</span>
                        セル結合を解除
                      </button>
                    ) : (
                      <button 
                        className="table-context-menu-item" 
                        onClick={() => {
                          // 選択範囲を結合（簡易版：単一セルから開始）
                          const merged = isCellMerged(contextMenu.cellRow!, contextMenu.cellCol!)
                          if (merged) {
                            handleMergeCells(merged.row, merged.col, merged.row + merged.rowSpan - 1, merged.col + merged.colSpan - 1)
                          } else {
                            handleMergeCells(contextMenu.cellRow!, contextMenu.cellCol!, contextMenu.cellRow!, contextMenu.cellCol!)
                          }
                          setContextMenu(null)
                        }}
                      >
                        <span className="material-icons">merge_type</span>
                        セルを結合
                      </button>
                    )}
                    <div className="table-context-menu-divider" />
                    <div className="table-context-menu-submenu">
                      <span className="table-context-menu-label">データ型を設定:</span>
                      {(['text', 'number', 'date', 'percentage', 'currency', 'category'] as CellDataType[]).map((type) => {
                        const typeInfo = getDataTypeInfo(type)
                        return (
                          <button
                            key={type}
                            className={`table-context-menu-item ${cellTypes[getCellKey(contextMenu.cellRow!, contextMenu.cellCol!)] === type ? 'active' : ''}`}
                            onClick={() => {
                              handleSetCellType(contextMenu.cellRow!, contextMenu.cellCol!, type)
                              setContextMenu(null)
                            }}
                          >
                            {typeInfo.label}
                          </button>
                        )
                      })}
                    </div>
                    <div className="table-context-menu-divider" />
                    <button 
                      className="table-context-menu-item" 
                      onClick={() => {
                        setFormatDialogCell({ row: contextMenu.cellRow!, col: contextMenu.cellCol! })
                        setFormatDialogColumn(null)
                        setShowFormatDialog(true)
                        setContextMenu(null)
                      }}
                    >
                      <span className="material-icons">settings</span>
                      セルのフォーマット設定
                    </button>
                  </>
                ) : contextMenu.type === 'row' ? (
                  <>
                    <button className="table-context-menu-item" onClick={() => duplicateRow(contextMenu.index)}>
                      <span className="material-icons">content_copy</span>
                      複製
                    </button>
                    <button className="table-context-menu-item" onClick={() => clearRowContents(contextMenu.index)}>
                      <span className="material-icons">backspace</span>
                      コンテンツをクリア
                    </button>
                    <div className="table-context-menu-divider" />
                    <button className="table-context-menu-item" onClick={() => toggleRowVisibility(contextMenu.index)}>
                      <span className="material-icons">{hiddenRows.includes(contextMenu.index) ? 'visibility' : 'visibility_off'}</span>
                      {hiddenRows.includes(contextMenu.index) ? '行を表示' : '行を非表示'}
                    </button>
                    {hiddenRows.length > 0 && (
                      <button className="table-context-menu-item" onClick={showAllRows}>
                        <span className="material-icons">visibility</span>
                        すべての行を表示
                      </button>
                    )}
                    {tableData.length > 1 && (
                      <>
                        <div className="table-context-menu-divider" />
                        <button className="table-context-menu-item danger" onClick={() => handleDeleteRow(contextMenu.index)}>
                          <span className="material-icons">delete</span>
                          削除
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button className="table-context-menu-item" onClick={() => duplicateColumn(contextMenu.index)}>
                      <span className="material-icons">content_copy</span>
                      複製
                    </button>
                    <button className="table-context-menu-item" onClick={() => clearColumnContents(contextMenu.index)}>
                      <span className="material-icons">backspace</span>
                      コンテンツをクリア
                    </button>
                    {tableData[0]?.length > 1 && (
                      <>
                        <div className="table-context-menu-divider" />
                        <button className="table-context-menu-item danger" onClick={() => handleDeleteColumn(contextMenu.index)}>
                          <span className="material-icons">delete</span>
                          削除
                        </button>
                      </>
                    )}
                    <div className="table-context-menu-divider" />
                    <button 
                      className="table-context-menu-item" 
                      onClick={() => {
                        setFormatDialogCell(null)
                        setFormatDialogColumn(contextMenu.index)
                        // 列の最初のセルのデータ型を初期値として設定
                        const firstCellKey = getCellKey(0, contextMenu.index)
                        const currentType = cellTypes[firstCellKey] || 'text'
                        setFormatDialogDataType(currentType)
                        setShowFormatDialog(true)
                        setContextMenu(null)
                      }}
                    >
                      <span className="material-icons">settings</span>
                      列の設定
                    </button>
                  </>
                )}
              </div>
            )}

            {/* データ型ドロップダウン */}
            {typeDropdownColumn !== null && (
              <div 
                className="table-type-dropdown-menu"
                style={{ 
                  position: 'fixed',
                  left: (() => {
                    const header = document.querySelector(`.notion-property-header:nth-child(${typeDropdownColumn + 2})`)
                    return header ? header.getBoundingClientRect().left : 0
                  })(),
                  top: (() => {
                    const header = document.querySelector(`.notion-property-header:nth-child(${typeDropdownColumn + 2})`)
                    return header ? header.getBoundingClientRect().top + 40 : 0
                  })(),
                  zIndex: 1001
                }}
              >
                <div className="table-type-dropdown-header">データ型を選択</div>
                {(['text', 'number', 'date', 'percentage', 'currency', 'category', 'formula', 'checkbox'] as CellDataType[]).map((type) => {
                  const typeInfo = getDataTypeInfo(type)
                  const firstCellKey = getCellKey(0, typeDropdownColumn)
                  const currentType = cellTypes[firstCellKey] || 'text'
                  return (
                    <button
                      key={type}
                      className={`table-type-dropdown-item ${currentType === type ? 'active' : ''}`}
                      onClick={() => {
                        handleSetColumnType(typeDropdownColumn, type)
                        if (type !== 'formula') {
                          setTypeDropdownColumn(null)
                        }
                      }}
                    >
                      <span className="material-icons">{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </button>
                  )
                })}
                {/* 数式型の場合、数式入力フィールドを表示 */}
                {(() => {
                  const firstCellKey = getCellKey(0, typeDropdownColumn)
                  const currentType = cellTypes[firstCellKey] || 'text'
                  if (currentType === 'formula') {
                    const currentFormula = cellFormats[firstCellKey]?.formula || ''
                    return (
                      <div className="formula-input-section">
                        <div className="formula-input-label">数式</div>
                        <input
                          type="text"
                          className="formula-input-field"
                          value={currentFormula}
                          onChange={(e) => {
                            handleSetColumnFormat(typeDropdownColumn, {
                              ...cellFormats[firstCellKey],
                              type: 'formula',
                              formula: e.target.value
                            })
                          }}
                          placeholder="prop('列名') * 2"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="formula-input-hint">
                          例: prop("数値") * 2, prop("価格") + prop("税")
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )}
            </>
            )}
            
            {/* グラフタイプ選択モーダル */}
            <GraphTypeModal
              isOpen={showGraphTypeModal}
              currentFormat={tableDisplayFormat}
              onFormatChange={handleGraphFormatChange}
              onClose={() => setShowGraphTypeModal(false)}
            />
          </div>
          </div>
          </div>
        )
        
        return tableEditorContent

      case 'image':
        return (
          <div className="item-detail-edit-content">
            <div className="item-detail-edit-field">
              <label>Image *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`item-image-upload-button ${imageDataUrl ? 'item-image-change-button' : ''}`}
              >
                <span className="material-icons">upload</span>
                {imageDataUrl ? 'Change Image' : 'Upload Image'}
              </button>
              
              {imageDataUrl && !showCropTool && (
                  <div className="item-image-preview">
                    <img src={imageDataUrl} alt="Preview" />
                  </div>
              )}

              {imageDataUrl && showCropTool && (
                <div className="item-image-crop-container">
                  <ReactCrop
                    crop={crop}
                    onChange={c => setCrop(c)}
                    onComplete={c => setCompletedCrop(c)}
                  >
                    <img
                      ref={imageRef}
                      src={imageDataUrl}
                      alt="Crop preview"
                      style={{ maxWidth: '100%' }}
                    />
                  </ReactCrop>
                  <div className="item-image-crop-actions">
                    <button onClick={handleCancelCrop} className="item-detail-action-button secondary">
                      Cancel
                    </button>
                    <button onClick={handleApplyCrop} className="item-detail-action-button primary">
                      Apply Crop
                    </button>
                  </div>
                </div>
              )}

              <label htmlFor="image-alt-edit">Alt Text</label>
              <input
                id="image-alt-edit"
                type="text"
                value={imageAlt}
                onChange={(e) => handleImageAltChange(e.target.value)}
                onBlur={handleImageAltBlur}
                placeholder="Enter alt text (optional)"
              />
            </div>
          </div>
        )
      
      case 'text':
        return (
          <div className="item-detail-edit-content">
            <div className="item-detail-edit-field">
              <label htmlFor="text-content-edit">Content *</label>
              <textarea
                id="text-content-edit"
                value={textContent}
                onChange={(e) => handleTextContentChange(e.target.value)}
                onBlur={handleTextContentBlur}
                placeholder="Enter text content..."
                rows={10}
              />
          </div>
          </div>
        )
      
      case 'picto':
        return (
          <PictoEditor
            item={item as PictoItem}
            onUpdateItem={(updates) => {
              if (onUpdateItem) {
                onUpdateItem(item.id, updates as Partial<Item>)
              }
            }}
          />
        )
      
      case 'euler':
        return (
          <EulerEditor
            item={item as EulerItem}
            onUpdateItem={(updates) => {
              if (onUpdateItem) {
                onUpdateItem(item.id, updates as Partial<Item>)
              }
            }}
          />
        )
      
      default:
        return null
    }
  }

  // Table用の操作ハンドラ
  const handleTableOperation = (operation: string, ...args: unknown[]) => {
    switch (operation) {
      case 'addRow':
        addTableRow()
        break
      case 'deleteRow':
        if (selectedCell && !selectedCell.isHeader) {
          removeTableRow(selectedCell.row)
        }
        break
      case 'addColumn':
        addTableColumn()
        break
      case 'deleteColumn':
        if (selectedCell) {
          removeTableColumn(selectedCell.col)
        }
        break
      case 'mergeCells':
        if (cellRangeSelection.start && cellRangeSelection.end) {
          const minRow = Math.min(cellRangeSelection.start.row, cellRangeSelection.end.row)
          const maxRow = Math.max(cellRangeSelection.start.row, cellRangeSelection.end.row)
          const minCol = Math.min(cellRangeSelection.start.col, cellRangeSelection.end.col)
          const maxCol = Math.max(cellRangeSelection.start.col, cellRangeSelection.end.col)
          handleMergeCells(minRow, minCol, maxRow, maxCol)
          setCellRangeSelection({ start: null, end: null })
        }
        break
      case 'unmergeCells':
        if (selectedCell && !selectedCell.isHeader) {
          handleUnmergeCell(selectedCell.row, selectedCell.col)
        }
        break
      case 'formatCells':
        if (selectedCell && !selectedCell.isHeader) {
          setFormatDialogCell({ row: selectedCell.row, col: selectedCell.col })
          setShowFormatDialog(true)
        }
        break
      case 'setDisplayFormat':
        const format = args[0] as TableDisplayFormat
        if (format && item && item.type === 'table' && onUpdateItem) {
          setTableDisplayFormat(format)
          onUpdateItem(item.id, { displayFormat: format } as Partial<TableItem>)
        }
        break
      case 'showAllRows':
        showAllRows()
        break
      case 'showAllColumns':
        showAllColumns()
        break
      case 'toggleHeaders':
        handleUseHeadersChange(!useHeaders)
        break
      case 'openMarkdownImport':
        setShowMarkdownImport(true)
        setMarkdownInput('')
        setMarkdownImportError('')
        break
    }
  }

  // Image用の操作ハンドラ
  const handleImageOperation = (operation: string, ...args: unknown[]) => {
    switch (operation) {
      case 'toggleCrop':
        setShowCropTool(!showCropTool)
        break
      case 'setDisplayMode':
        if (args[0] === 'contain' || args[0] === 'cover') {
          handleImageDisplayModeChange(args[0])
        }
        break
    }
  }

  // グラフタイプを変更
  const handleGraphFormatChange = useCallback((format: TableDisplayFormat) => {
    setTableDisplayFormat(format)
    // ツリー系チャートに変更した場合はツリービューをデフォルトに
    if (isTreeInputChart(format)) {
      setViewMode('tree')
    } else {
      setViewMode('table')
    }
    if (item && item.type === 'table' && onUpdateItem) {
      onUpdateItem(item.id, { displayFormat: format } as Partial<TableItem>)
    }
  }, [item, onUpdateItem])

  // チャート設定を更新
  const handleChartConfigChange = useCallback((updates: Partial<TableChartConfig>) => {
    const newConfig = { ...chartConfig, ...updates }
    setChartConfig(newConfig)
    if (item && item.type === 'table' && onUpdateItem) {
      onUpdateItem(item.id, { chartConfig: newConfig } as Partial<TableItem>)
    }
  }, [item, chartConfig, onUpdateItem])

  // ツリーデータを更新
  const handleTreeDataChange = useCallback((newTreeData: TreeData) => {
    setTreeData(newTreeData)
    if (item && item.type === 'table' && onUpdateItem) {
      onUpdateItem(item.id, { treeData: newTreeData } as Partial<TableItem>)
    }
  }, [item, onUpdateItem])

  // ツリー設定を更新
  const handleTreeSettingsChange = useCallback((newTreeSettings: TreeSettings) => {
    setTreeSettings(newTreeSettings)
    if (item && item.type === 'table' && onUpdateItem) {
      onUpdateItem(item.id, { treeSettings: newTreeSettings } as Partial<TableItem>)
    }
  }, [item, onUpdateItem])

  // テーブルアイテムの更新ハンドラ（GraphSettingsPanel用）
  const handleUpdateTableItem = useCallback((updates: Partial<TableItem>) => {
    if (updates.displayFormat) {
      setTableDisplayFormat(updates.displayFormat)
    }
    if (updates.chartConfig) {
      setChartConfig(updates.chartConfig)
    }
    if (item && item.type === 'table' && onUpdateItem) {
      onUpdateItem(item.id, updates)
    }
  }, [item, onUpdateItem])

  // セル選択状態からFloatingNavBar用の情報を取得
  const getTableState = () => {
    const hasSelection = !!selectedCell
    const canMerge = cellRangeSelection.start && cellRangeSelection.end && 
      (cellRangeSelection.start.row !== cellRangeSelection.end.row || 
       cellRangeSelection.start.col !== cellRangeSelection.end.col)
    const canUnmerge = selectedCell && !selectedCell.isHeader && 
      isMergeStartCell(selectedCell.row, selectedCell.col)
    return { 
      hasSelection, 
      canMerge: !!canMerge, 
      canUnmerge: !!canUnmerge, 
      displayFormat: tableDisplayFormat,
      hiddenRowsCount: hiddenRows.length,
      hiddenColumnsCount: 0,
      useHeaders
    }
  }

  // Image状態を取得
  const getImageState = () => {
    return {
      displayMode: imageDisplayMode,
      isCropping: showCropTool
    }
  }

  return (
    <div className="item-detail-panel" style={{ position: 'relative' }}>
      {/* Content */}
      <div className="item-detail-content">
        <div className="item-detail-edit">
          {getEditUI()}
        </div>
      </div>


      {/* Floating Bottom Navigation Bar */}
      {item.type === 'table' && (
        <div
          className="pointer-events-none"
          style={{ 
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40
          }}
        >
          <div className="pointer-events-auto">
            <FloatingNavBar
              itemType="table"
              onTableOperation={handleTableOperation}
              tableState={getTableState()}
            />
          </div>
        </div>
      )}
      {item.type === 'image' && (
        <div
          className="pointer-events-none"
          style={{ 
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40
          }}
        >
          <div className="pointer-events-auto">
            <FloatingNavBar
              itemType="image"
              onImageOperation={handleImageOperation}
              imageState={getImageState()}
            />
          </div>
        </div>
      )}

    </div>
  )
}
