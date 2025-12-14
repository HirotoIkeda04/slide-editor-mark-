import type { CellDataType, CellFormat } from '../types'

/**
 * セルのキーを生成（row-col形式）
 */
export function getCellKey(row: number, col: number): string {
  return `${row}-${col}`
}

/**
 * セルキーを解析（row-col形式からrowとcolを取得）
 */
export function parseCellKey(key: string): { row: number; col: number } | null {
  const parts = key.split('-')
  if (parts.length !== 2) return null
  const row = parseInt(parts[0], 10)
  const col = parseInt(parts[1], 10)
  if (isNaN(row) || isNaN(col)) return null
  return { row, col }
}

/**
 * セルの値をデータ型に応じてパース
 */
export function parseCellValue(value: string, type: CellDataType): any {
  if (!value || value.trim() === '') {
    return type === 'text' ? '' : null
  }

  switch (type) {
    case 'text':
      return value
    case 'number':
      // 数値として解析（カンマ区切りを除去）
      const numValue = value.replace(/,/g, '')
      const parsed = parseFloat(numValue)
      return isNaN(parsed) ? null : parsed
    case 'date':
      // 日付として解析
      const dateValue = new Date(value)
      return isNaN(dateValue.getTime()) ? null : dateValue
    case 'percentage':
      // パーセントとして解析（%記号を除去）
      const percentValue = value.replace(/%/g, '').trim()
      const parsedPercent = parseFloat(percentValue)
      return isNaN(parsedPercent) ? null : parsedPercent / 100
    case 'currency':
      // 通貨記号を除去して数値として解析
      const currencyValue = value.replace(/[^\d.,-]/g, '').replace(/,/g, '')
      const parsedCurrency = parseFloat(currencyValue)
      return isNaN(parsedCurrency) ? null : parsedCurrency
    default:
      return value
  }
}

/**
 * セルの値をデータ型に応じてフォーマット
 */
export function formatCellValue(value: any, type: CellDataType, format?: CellFormat): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  switch (type) {
    case 'text':
      return String(value)
    case 'number': {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(numValue)) return String(value)
      
      const decimalPlaces = format?.decimalPlaces ?? 2
      const useThousandsSeparator = format?.useThousandsSeparator ?? true
      
      let formatted = numValue.toFixed(decimalPlaces)
      if (useThousandsSeparator) {
        const parts = formatted.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        formatted = parts.join('.')
      }
      return formatted
    }
    case 'date': {
      const dateValue = value instanceof Date ? value : new Date(value)
      if (isNaN(dateValue.getTime())) return String(value)
      
      const dateFormat = format?.dateFormat || 'YYYY-MM-DD'
      return formatDate(dateValue, dateFormat)
    }
    case 'percentage': {
      const percentValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(percentValue)) return String(value)
      
      const decimalPlaces = format?.percentageDecimalPlaces ?? 2
      return (percentValue * 100).toFixed(decimalPlaces) + '%'
    }
    case 'currency': {
      const currencyValue = typeof value === 'number' ? value : parseFloat(String(value))
      if (isNaN(currencyValue)) return String(value)
      
      const currencySymbol = format?.currencySymbol || '¥'
      const decimalPlaces = format?.decimalPlaces ?? 2
      const useThousandsSeparator = format?.useThousandsSeparator ?? true
      const currencyScale = format?.currencyScale || 'none'
      
      // スケールに応じて値を調整
      let scaledValue = Math.abs(currencyValue)
      let scaleSuffix = ''
      
      switch (currencyScale) {
        case 'thousand':
          scaledValue = scaledValue / 1000
          scaleSuffix = '千'
          break
        case 'million':
          scaledValue = scaledValue / 1000000
          scaleSuffix = '百万'
          break
        case 'billion':
          scaledValue = scaledValue / 1000000000
          scaleSuffix = '十億'
          break
        default:
          // 'none': そのまま
          break
      }
      
      let formatted = scaledValue.toFixed(decimalPlaces)
      if (useThousandsSeparator && currencyScale === 'none') {
        const parts = formatted.split('.')
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        formatted = parts.join('.')
      }
      
      return (currencyValue < 0 ? '-' : '') + currencySymbol + formatted + scaleSuffix
    }
    default:
      return String(value)
  }
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('YY', String(year).slice(-2))
    .replace('M', String(date.getMonth() + 1))
    .replace('D', String(date.getDate()))
}

/**
 * セルの値をデータ型に応じてバリデーション
 */
export function validateCellValue(value: string, type: CellDataType): boolean {
  if (!value || value.trim() === '') {
    return true // 空の値は許可
  }

  switch (type) {
    case 'text':
      return true // テキストは常に有効
    case 'number': {
      const numValue = value.replace(/,/g, '')
      return !isNaN(parseFloat(numValue))
    }
    case 'date': {
      const dateValue = new Date(value)
      return !isNaN(dateValue.getTime())
    }
    case 'percentage': {
      const percentValue = value.replace(/%/g, '').trim()
      const parsed = parseFloat(percentValue)
      return !isNaN(parsed) && parsed >= 0 && parsed <= 100
    }
    case 'currency': {
      const currencyValue = value.replace(/[^\d.,-]/g, '').replace(/,/g, '')
      return !isNaN(parseFloat(currencyValue))
    }
    default:
      return true
  }
}

/**
 * デフォルトのセルフォーマットを取得
 */
export function getDefaultCellFormat(type: CellDataType): CellFormat {
  switch (type) {
    case 'number':
      return {
        type: 'number',
        decimalPlaces: 2,
        useThousandsSeparator: true
      }
    case 'date':
      return {
        type: 'date',
        dateFormat: 'YYYY-MM-DD'
      }
    case 'percentage':
      return {
        type: 'percentage',
        percentageDecimalPlaces: 2
      }
    case 'currency':
      return {
        type: 'currency',
        currencySymbol: '¥',
        currencyScale: 'none',
        decimalPlaces: 2,
        useThousandsSeparator: true
      }
    default:
      return { type }
  }
}

/**
 * セルのデータ型を推測
 */
export function inferCellDataType(value: string): CellDataType {
  if (!value || value.trim() === '') {
    return 'text'
  }

  // パーセント記号がある場合
  if (value.includes('%')) {
    return 'percentage'
  }

  // 通貨記号がある場合
  if (/^[\$¥€£]/.test(value.trim())) {
    return 'currency'
  }

  // 日付形式の可能性をチェック
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{4}\/\d{2}\/\d{2}$/ // YYYY/MM/DD
  ]
  if (datePatterns.some(pattern => pattern.test(value))) {
    const dateValue = new Date(value)
    if (!isNaN(dateValue.getTime())) {
      return 'date'
    }
  }

  // 数値として解析可能かチェック
  const numValue = value.replace(/,/g, '')
  if (!isNaN(parseFloat(numValue)) && isFinite(parseFloat(numValue))) {
    return 'number'
  }

  return 'text'
}

// ============================================
// Markdownテーブルパース機能
// ============================================

/**
 * パースされたMarkdownテーブルの結果
 */
export interface ParsedMarkdownTable {
  headers: string[]
  data: string[][]
  hasHeaders: boolean
}

/**
 * 行がMarkdownテーブルのセパレータ行かどうかを判定
 * セパレータ行は --- や :---: のようなパターンで構成される
 */
function isSeparatorRow(cells: string[]): boolean {
  if (cells.length === 0) return false
  
  // すべてのセルがセパレータパターンにマッチするかチェック
  const separatorPattern = /^:?-+:?$/
  return cells.every(cell => {
    const trimmed = cell.trim()
    return trimmed === '' || separatorPattern.test(trimmed)
  })
}

/**
 * Markdownテーブル行をセルに分割
 */
function parseTableRow(line: string): string[] {
  // 行の前後の | を除去してから分割
  let trimmed = line.trim()
  
  // 先頭の | を除去
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.substring(1)
  }
  // 末尾の | を除去
  if (trimmed.endsWith('|')) {
    trimmed = trimmed.substring(0, trimmed.length - 1)
  }
  
  // | で分割し、各セルをトリム
  return trimmed.split('|').map(cell => cell.trim())
}

/**
 * Markdownテーブル形式のテキストを解析してTableItem用のデータに変換
 * 
 * @param text - Markdownテーブル形式のテキスト
 * @returns パース結果、または無効な場合はnull
 * 
 * @example
 * const result = parseMarkdownTable(`
 * | 変数 | Model 1 | Model 2 |
 * |-----|:---:|:---:|
 * | データ1 | .036** | — |
 * | データ2 | .160 | .126 |
 * `)
 * // result = {
 * //   headers: ['変数', 'Model 1', 'Model 2'],
 * //   data: [['データ1', '.036**', '—'], ['データ2', '.160', '.126']],
 * //   hasHeaders: true
 * // }
 */
export function parseMarkdownTable(text: string): ParsedMarkdownTable | null {
  if (!text || text.trim() === '') {
    return null
  }
  
  // 行に分割し、空行を除去
  const lines = text.split('\n').filter(line => line.trim() !== '')
  
  if (lines.length === 0) {
    return null
  }
  
  // テーブル行（|を含む行）のみをフィルタ
  const tableLines = lines.filter(line => line.includes('|'))
  
  if (tableLines.length === 0) {
    return null
  }
  
  // 各行をセルに分割
  const rows = tableLines.map(line => parseTableRow(line))
  
  if (rows.length === 0) {
    return null
  }
  
  // 列数を最初の行から決定
  const colCount = rows[0].length
  
  if (colCount === 0) {
    return null
  }
  
  // 2行目がセパレータ行かどうかを判定
  const hasHeaders = rows.length >= 2 && isSeparatorRow(rows[1])
  
  let headers: string[] = []
  let data: string[][] = []
  
  if (hasHeaders) {
    // ヘッダー行あり
    headers = rows[0]
    // セパレータ行（2行目）をスキップしてデータ行を取得
    data = rows.slice(2).map(row => {
      // 列数を揃える
      const normalizedRow = [...row]
      while (normalizedRow.length < colCount) {
        normalizedRow.push('')
      }
      return normalizedRow.slice(0, colCount)
    })
  } else {
    // ヘッダー行なし（すべてデータ行）
    headers = []
    data = rows.map(row => {
      // 列数を揃える
      const normalizedRow = [...row]
      while (normalizedRow.length < colCount) {
        normalizedRow.push('')
      }
      return normalizedRow.slice(0, colCount)
    })
  }
  
  // データがない場合はnull
  if (data.length === 0 && headers.length === 0) {
    return null
  }
  
  return {
    headers,
    data,
    hasHeaders
  }
}

