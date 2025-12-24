/**
 * Chart Utilities
 * 
 * グラフ設定に関するユーティリティ関数
 */

import type { CellFormat, CellDataType, TableItem, ChartSeries, SeriesStack, ChartYAxisConfig } from '../types'

/**
 * セルフォーマットから単位を自動推測する
 * 
 * 推測ルール:
 * - currency + currencySymbol: '¥' → 円, '$' → ドル, '€' → ユーロ
 * - currency + currencyScale: 'thousand' → 千円, 'million' → 百万円
 * - percentage → %
 * - number → (なし)
 */
export const inferUnitFromFormat = (format: CellFormat | undefined): string => {
  if (!format) return ''
  
  const { type, currencySymbol, currencyScale } = format
  
  if (type === 'percentage') {
    return '%'
  }
  
  if (type === 'currency') {
    let baseUnit = ''
    
    // 通貨記号から基本単位を決定
    switch (currencySymbol) {
      case '¥':
        baseUnit = '円'
        break
      case '$':
        baseUnit = 'ドル'
        break
      case '€':
        baseUnit = 'ユーロ'
        break
      default:
        baseUnit = currencySymbol || '円'
    }
    
    // スケールから接頭辞を決定
    switch (currencyScale) {
      case 'thousand':
        return `千${baseUnit}`
      case 'million':
        return `百万${baseUnit}`
      case 'billion':
        return `十億${baseUnit}`
      default:
        return baseUnit
    }
  }
  
  return ''
}

/**
 * テーブルの列インデックスからセルフォーマットを取得する
 */
export const getColumnFormat = (table: TableItem, columnIndex: number): CellFormat | undefined => {
  const cellFormats = table.cellFormats || {}
  
  // 最初のデータ行（行1）のフォーマットを取得
  const cellKey = `1-${columnIndex}`
  return cellFormats[cellKey]
}

/**
 * テーブルの列からデータ型を取得する
 */
export const getColumnDataType = (table: TableItem, columnIndex: number): CellDataType => {
  const format = getColumnFormat(table, columnIndex)
  return format?.type || 'text'
}

/**
 * Y軸の系列から単位を自動推測する
 * 複数系列がある場合は最初の系列の単位を使用
 */
export const inferAxisUnit = (table: TableItem, stacks: SeriesStack[]): string => {
  // 全系列のカラムを収集
  const columns: number[] = []
  for (const stack of stacks) {
    for (const series of stack) {
      columns.push(series.column)
    }
  }
  
  if (columns.length === 0) return ''
  
  // 最初の系列の単位を取得
  const firstFormat = getColumnFormat(table, columns[0])
  return inferUnitFromFormat(firstFormat)
}

/**
 * 列インデックスから列名を取得する
 */
export const getColumnName = (table: TableItem, columnIndex: number): string => {
  const headers = table.headers || []
  const firstRow = table.data[0] || []
  
  return headers[columnIndex] || firstRow[columnIndex] || `列 ${columnIndex + 1}`
}

/**
 * カテゴリ型の列のみをフィルタリング
 */
export const getCategoryColumns = (table: TableItem): { index: number; name: string }[] => {
  const firstRow = table.data[0] || []
  const headers = table.headers || []
  const cellFormats = table.cellFormats || {}
  
  return firstRow.map((_, index) => {
    const cellKey = `1-${index}`
    const format = cellFormats[cellKey]
    const type = format?.type || 'text'
    
    // text, date, category はカテゴリ型として扱う
    const isCategoryType = type === 'text' || type === 'date' || type === 'category'
    
    return {
      index,
      name: headers[index] || firstRow[index] || `列 ${index + 1}`,
      isCategoryType,
    }
  }).filter(col => col.isCategoryType)
}

/**
 * 数値型の列のみをフィルタリング
 */
export const getNumericColumns = (table: TableItem): { index: number; name: string }[] => {
  const firstRow = table.data[0] || []
  const headers = table.headers || []
  const cellFormats = table.cellFormats || {}
  
  return firstRow.map((_, index) => {
    const cellKey = `1-${index}`
    const format = cellFormats[cellKey]
    const type = format?.type || 'text'
    
    // number, percentage, currency は数値型として扱う
    const isNumericType = type === 'number' || type === 'percentage' || type === 'currency'
    
    return {
      index,
      name: headers[index] || firstRow[index] || `列 ${index + 1}`,
      isNumericType,
    }
  }).filter(col => col.isNumericType)
}

/**
 * 新しい系列IDを生成
 */
export const generateSeriesId = (): string => {
  return crypto.randomUUID()
}

/**
 * デフォルトのチャートカラーパレット
 */
export const DEFAULT_CHART_COLORS = [
  '#5b8def',  // Blue
  '#50c878',  // Green
  '#f4a460',  // Orange
  '#e85d75',  // Red
  '#9b59b6',  // Purple
  '#00bcd4',  // Cyan
  '#ff9800',  // Amber
  '#795548',  // Brown
]

/**
 * 次の利用可能な色を取得
 */
export const getNextAvailableColor = (usedColors: string[]): string => {
  for (const color of DEFAULT_CHART_COLORS) {
    if (!usedColors.includes(color)) {
      return color
    }
  }
  // 全て使用済みの場合は最初の色を返す
  return DEFAULT_CHART_COLORS[0]
}

/**
 * 新しい系列を作成
 */
export const createSeries = (
  column: number,
  type: 'bar' | 'line' | 'area' = 'bar',
  usedColors: string[] = []
): ChartSeries => {
  return {
    id: generateSeriesId(),
    column,
    type,
    color: getNextAvailableColor(usedColors),
    smoothing: type !== 'bar',
  }
}

/**
 * デフォルトのY軸設定を作成
 */
export const createDefaultYAxisConfig = (): ChartYAxisConfig => {
  return {
    stacks: [],
    scale: { min: 'auto', max: 'auto' },
    unit: '',
  }
}

/**
 * 既存のchartConfigから新しいY軸設定にマイグレーション
 */
export const migrateToYAxisConfig = (
  table: TableItem,
  yAxisColumns: number[],
  yAxisRightColumns: number[],
  stacked: 'off' | 'on' | 'percent' | undefined,
  seriesConfigs: { column: number; displayType: 'bar' | 'line' | 'area' }[]
): { yAxisConfig: ChartYAxisConfig; y2AxisConfig: ChartYAxisConfig } => {
  const usedColors: string[] = []
  
  // Y軸の系列を作成
  const yStacks: SeriesStack[] = []
  
  if (stacked === 'on' || stacked === 'percent') {
    // 積み上げモード: 全系列を1つのスタックに
    const stack: SeriesStack = yAxisColumns.map(col => {
      const config = seriesConfigs.find(sc => sc.column === col)
      const series = createSeries(col, config?.displayType || 'bar', usedColors)
      usedColors.push(series.color)
      return series
    })
    if (stack.length > 0) {
      yStacks.push(stack)
    }
  } else {
    // 並列モード: 各系列を別スタックに
    for (const col of yAxisColumns) {
      const config = seriesConfigs.find(sc => sc.column === col)
      const series = createSeries(col, config?.displayType || 'bar', usedColors)
      usedColors.push(series.color)
      yStacks.push([series])
    }
  }
  
  // Y2軸の系列を作成
  const y2Stacks: SeriesStack[] = []
  for (const col of yAxisRightColumns) {
    const config = seriesConfigs.find(sc => sc.column === col)
    const series = createSeries(col, config?.displayType || 'line', usedColors)
    usedColors.push(series.color)
    y2Stacks.push([series])
  }
  
  return {
    yAxisConfig: {
      stacks: yStacks,
      scale: { min: 'auto', max: 'auto' },
      unit: inferAxisUnit(table, yStacks),
    },
    y2AxisConfig: {
      stacks: y2Stacks,
      scale: { min: 'auto', max: 'auto' },
      unit: inferAxisUnit(table, y2Stacks),
    },
  }
}

