import { useMemo, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { TableItem, Tone, StackedMode, ChartSeries, ChartYAxisConfig, NestedCategory } from '../../types'
import { DEFAULT_TREE_SETTINGS } from '../../types'
import { treeToSankeyData, treeToTreemapData } from '../../utils/treeUtils'

// ネストカテゴリから最外層のカラムインデックスを取得
const getOutermostColumn = (category: NestedCategory | null | undefined): number => {
  if (!category) return 0
  return category.column
}

// Y軸設定から全系列を取得
const getAllSeriesFromConfig = (config: ChartYAxisConfig | undefined): ChartSeries[] => {
  if (!config?.stacks) return []
  return config.stacks.flatMap(stack => stack)
}

// Y軸設定から全カラムインデックスを取得
const getColumnsFromConfig = (config: ChartYAxisConfig | undefined): number[] => {
  return getAllSeriesFromConfig(config).map(s => s.column)
}

// スタック構造から積み上げ判定
const hasStackedSeriesInConfig = (config: ChartYAxisConfig | undefined): boolean => {
  if (!config?.stacks) return false
  return config.stacks.some(stack => stack.length > 1)
}

// 系列IDからChartSeriesを検索
const findSeriesByColumn = (
  column: number,
  yAxisConfig: ChartYAxisConfig | undefined,
  y2AxisConfig: ChartYAxisConfig | undefined
): ChartSeries | undefined => {
  const allSeries = [
    ...getAllSeriesFromConfig(yAxisConfig),
    ...getAllSeriesFromConfig(y2AxisConfig),
  ]
  return allSeries.find(s => s.column === column)
}

// カラムからスタックIDを取得（同じスタック内の系列は同じIDを持つ）
const getStackIdForColumn = (
  column: number,
  yAxisConfig: ChartYAxisConfig | undefined,
  y2AxisConfig: ChartYAxisConfig | undefined
): string | undefined => {
  // Y軸のスタックを検索
  if (yAxisConfig?.stacks) {
    for (let i = 0; i < yAxisConfig.stacks.length; i++) {
      const stack = yAxisConfig.stacks[i]
      if (stack.length > 1 && stack.some(s => s.column === column)) {
        return `y1-stack-${i}`
      }
    }
  }
  // Y2軸のスタックを検索
  if (y2AxisConfig?.stacks) {
    for (let i = 0; i < y2AxisConfig.stacks.length; i++) {
      const stack = y2AxisConfig.stacks[i]
      if (stack.length > 1 && stack.some(s => s.column === column)) {
        return `y2-stack-${i}`
      }
    }
  }
  return undefined
}

interface TableChartProps {
  table: TableItem
  tone?: Tone
  width?: number
  height?: number
  chartColors?: string[]
  backgroundColor?: string
  baseFontSize?: number
}

// トーンに応じた色パレット
const toneColors: Record<Tone, string[]> = {
  simple: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  casual: ['#25b7c0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  luxury: ['#C9A962', '#8B7355', '#B8860B', '#DAA520', '#D4AF37', '#FFD700'],
  warm: ['#E07A5F', '#F2CC8F', '#81B29A', '#3D405B', '#F4A261', '#E76F51'],
}

// 日付フォーマット関数
const formatDate = (value: string, format?: string): string => {
  if (!format || !value) return value
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  let result = format
  result = result.replace('YYYY', String(date.getFullYear()))
  result = result.replace('YY', String(date.getFullYear()).slice(-2))
  result = result.replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
  result = result.replace('M', String(date.getMonth() + 1))
  result = result.replace('DD', String(date.getDate()).padStart(2, '0'))
  result = result.replace('D', String(date.getDate()))
  return result
}

// テーブルデータをチャート用データに変換（新データモデル対応）
const convertTableToChartData = (
  table: TableItem
): { 
  data: Array<Record<string, string | number>>
  seriesKeys: string[]
  seriesColumnIndices: number[]
  yAxisColumns: number[]
  y2AxisColumns: number[]
} => {
  const { data, headers, chartConfig, hiddenRows = [] } = table
  
  // 新データモデルから読み取り
  const xAxisCategory = chartConfig?.xAxisCategory
  const yAxisConfig = chartConfig?.yAxisConfig
  const y2AxisConfig = chartConfig?.y2AxisConfig
  
  // X軸カラム: ネストカテゴリの最外層、またはデフォルト0
  const effectiveXAxisColumn = getOutermostColumn(xAxisCategory)
  
  // Y軸カラム: 新データモデルから取得
  const yAxisColumns = getColumnsFromConfig(yAxisConfig)
  const y2AxisColumns = getColumnsFromConfig(y2AxisConfig)
  
  // フォールバック: 新データモデルが空の場合、X軸以外の全列をY軸として使用
  const allColumns = Array.from({ length: (data[0]?.length ?? 1) }, (_, i) => i)
  const fallbackYColumns = allColumns.filter(col => col !== effectiveXAxisColumn)
  
  // 両方の軸の列を統合（重複を除去）
  const effectiveYAxisColumns = yAxisColumns.length > 0 ? yAxisColumns : fallbackYColumns
  const allYAxisColumns = [...new Set([...effectiveYAxisColumns, ...y2AxisColumns])]
  
  const getSeriesName = (colIndex: number): string => {
    if (headers && headers[colIndex]) return headers[colIndex]
    if (data[0] && data[0][colIndex]) return data[0][colIndex]
    return `Series ${colIndex}`
  }
  
  const seriesKeys = allYAxisColumns.map(col => getSeriesName(col))
  const seriesColumnIndices = allYAxisColumns
  
  const startRow = headers && headers.length > 0 ? 0 : 1
  const chartData = data
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ rowIndex }) => !hiddenRows.includes(rowIndex))
    .slice(startRow)
    .filter(({ row }) => {
      const name = row[effectiveXAxisColumn]?.trim()
      if (!name) return false
      const hasAnyValue = allYAxisColumns.some(colIndex => {
        const value = row[colIndex]?.trim()
        return value && value !== ''
      })
      return hasAnyValue
    })
    .map(({ row }) => {
      const entry: Record<string, string | number> = {
        name: row[effectiveXAxisColumn] || '',
      }
      allYAxisColumns.forEach((colIndex, idx) => {
        const value = row[colIndex]
        const numValue = parseFloat(value?.replace(/[,¥$€£%]/g, '') || '0')
        entry[seriesKeys[idx]] = isNaN(numValue) ? 0 : numValue
      })
      return entry
    })
  
  return { 
    data: chartData, 
    seriesKeys, 
    seriesColumnIndices,
    yAxisColumns: effectiveYAxisColumns,
    y2AxisColumns,
  }
}

// 背景色が明るいかどうかを判定
const isLightBackground = (bgColor?: string): boolean => {
  if (!bgColor) return true
  const match = bgColor.match(/oklch\(([0-9.]+)/)
  if (match) {
    const l = parseFloat(match[1])
    return l > 0.5
  }
  if (bgColor.startsWith('#')) {
    const hex = bgColor.slice(1)
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return luminance > 0.5
  }
  return true
}

// グラデーションから中間色（平均色）を抽出
const extractMiddleColorFromGradient = (gradient: string): string | null => {
  // oklch形式の色を全て抽出
  const oklchMatches = [...gradient.matchAll(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/g)]
  if (oklchMatches.length >= 2) {
    // 各成分の平均を計算
    let totalL = 0, totalC = 0, totalH = 0
    oklchMatches.forEach(match => {
      totalL += parseFloat(match[1])
      totalC += parseFloat(match[2])
      totalH += parseFloat(match[3])
    })
    const avgL = totalL / oklchMatches.length
    const avgC = totalC / oklchMatches.length
    const avgH = totalH / oklchMatches.length
    return `oklch(${avgL.toFixed(3)} ${avgC.toFixed(3)} ${avgH.toFixed(1)})`
  }
  
  // HEX形式の色を抽出
  const hexMatches = [...gradient.matchAll(/#([0-9a-fA-F]{6})/g)]
  if (hexMatches.length >= 2) {
    let totalR = 0, totalG = 0, totalB = 0
    hexMatches.forEach(match => {
      totalR += parseInt(match[1].slice(0, 2), 16)
      totalG += parseInt(match[1].slice(2, 4), 16)
      totalB += parseInt(match[1].slice(4, 6), 16)
    })
    const avgR = Math.round(totalR / hexMatches.length)
    const avgG = Math.round(totalG / hexMatches.length)
    const avgB = Math.round(totalB / hexMatches.length)
    return `#${avgR.toString(16).padStart(2,'0')}${avgG.toString(16).padStart(2,'0')}${avgB.toString(16).padStart(2,'0')}`
  }
  
  return null
}

// 単色からチャート背景色を計算（明度を保持）
const calculateChartBgFromColor = (color: string): string => {
  // OKLCH形式：明度をそのまま保持、彩度のみ抑制
  const oklchMatch = color.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (oklchMatch) {
    const [, l, c, h] = oklchMatch
    const targetC = Math.min(parseFloat(c), 0.02)
    return `oklch(${l} ${targetC} ${h})`
  }
  
  // HEX形式：輝度を計算してOKLCHに変換
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return `oklch(${luminance.toFixed(3)} 0.02 0)`
  }
  
  // その他の形式：そのまま返す
  return color
}

// ============================================
// 1-2-5 軸スケーリングアルゴリズム
// ============================================

// 最大公約数を計算
const gcd = (a: number, b: number): number => {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b > 0) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

// 1-2-5間隔の候補を生成
const get125Intervals = (range: number): number[] => {
  if (range <= 0) return [1]
  const magnitude = Math.pow(10, Math.floor(Math.log10(range)) - 1)
  return [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map(n => n * magnitude)
}

// 0を軸に含めるべきか判定
const shouldIncludeZero = (dataMin: number, dataMax: number): boolean => {
  // 負の値が含まれる場合は0を必ず含める
  if (dataMin < 0 && dataMax > 0) return true
  // 正のデータのみの場合
  if (dataMin >= 0) {
    const range = dataMax - dataMin
    // 最小値が範囲の2倍未満なら0を含める
    return dataMin < range * 2
  }
  // 負のデータのみの場合
  const range = dataMax - dataMin
  return Math.abs(dataMax) < range * 2
}

// 単軸のスケール計算（1-2-5間隔、充足率70%以上、7〜11目盛り目標）
interface AxisScaleResult {
  axisMin: number
  axisMax: number
  interval: number
  tickCount: number
  fillRate: number
}

const calculateSingleAxisScale = (dataMin: number, dataMax: number): AxisScaleResult => {
  // データがない場合のデフォルト
  if (dataMin === 0 && dataMax === 0) {
    return { axisMin: 0, axisMax: 10, interval: 2, tickCount: 6, fillRate: 0 }
  }
  
  const range = dataMax - dataMin
  const includeZero = shouldIncludeZero(dataMin, dataMax)
  
  // 0を含める場合の調整
  const effectiveMin = includeZero && dataMin >= 0 ? 0 : dataMin
  const effectiveMax = includeZero && dataMax <= 0 ? 0 : dataMax
  const effectiveRange = effectiveMax - effectiveMin
  
  const intervals = get125Intervals(effectiveRange)
  let best: AxisScaleResult | null = null
  let bestScore = -Infinity
  
  for (const interval of intervals) {
    // 軸の最小値・最大値を計算
    let axisMin = Math.floor(effectiveMin / interval) * interval
    let axisMax = Math.ceil(effectiveMax / interval) * interval
    
    // 0を含める場合の調整
    if (includeZero) {
      if (dataMin >= 0) axisMin = 0
      if (dataMax <= 0) axisMax = 0
    }
    
    const axisRange = axisMax - axisMin
    const tickCount = Math.round(axisRange / interval) + 1
    const fillRate = range / axisRange
    
    // 制約チェック: 充足率70%以上、目盛り数5〜12
    if (fillRate >= 0.70 && tickCount >= 5 && tickCount <= 12) {
      // スコア計算: 充足率 + 目盛り数が8に近いほどボーナス
      const tickBonus = 1 - Math.abs(tickCount - 8) * 0.05
      const score = fillRate + tickBonus
      
      if (score > bestScore) {
        bestScore = score
        best = { axisMin, axisMax, interval, tickCount, fillRate }
      }
    }
  }
  
  // 有効な組み合わせがない場合はフォールバック
  if (!best) {
    const fallbackInterval = intervals.find(i => {
      const min = Math.floor(effectiveMin / i) * i
      const max = Math.ceil(effectiveMax / i) * i
      const ticks = Math.round((max - min) / i) + 1
      return ticks >= 4 && ticks <= 15
    }) || intervals[Math.floor(intervals.length / 2)]
    
    let axisMin = Math.floor(effectiveMin / fallbackInterval) * fallbackInterval
    let axisMax = Math.ceil(effectiveMax / fallbackInterval) * fallbackInterval
    if (includeZero && dataMin >= 0) axisMin = 0
    if (includeZero && dataMax <= 0) axisMax = 0
    
    const axisRange = axisMax - axisMin
    const tickCount = Math.round(axisRange / fallbackInterval) + 1
    const fillRate = range / axisRange
    
    best = { axisMin, axisMax, interval: fallbackInterval, tickCount, fillRate }
  }
  
  return best
}

// 2軸グラフ用: GCDベースのグリッド線整合アルゴリズム（独立スケーリング + 間引き）
interface DualAxisScaleResult {
  left: AxisScaleResult & { splitLineInterval: number }  // グリッド線の間引き設定
  right: AxisScaleResult & { splitLineInterval: number }
  gridLines: number  // グリッド線の本数
  zeroAligned: boolean  // 0の位置が揃っているか
}

// 0の相対位置を計算（軸が0をまたぐ場合のみ有効）
const calculateZeroRatio = (axisMin: number, axisMax: number): number | null => {
  if (axisMin >= 0 || axisMax <= 0) return null  // 0をまたがない
  return Math.abs(axisMin) / (Math.abs(axisMin) + axisMax)
}

// 区間数を調整してGCDを改善
const adjustSectionsForBetterGcd = (
  leftSections: number,
  rightSections: number,
  minGcd: number = 4
): { left: number; right: number; gcd: number } | null => {
  // 現在のGCDが十分なら調整不要
  const currentGcd = gcd(leftSections, rightSections)
  if (currentGcd >= minGcd) {
    return { left: leftSections, right: rightSections, gcd: currentGcd }
  }
  
  // 片方が他方の倍数になるよう調整を試みる
  // 小さい方を大きい方の約数に近づける
  const candidates: { left: number; right: number; gcd: number }[] = []
  
  // 左を調整
  for (let adj = -2; adj <= 2; adj++) {
    const newLeft = leftSections + adj
    if (newLeft >= 4 && newLeft <= 12) {
      const newGcd = gcd(newLeft, rightSections)
      if (newGcd >= minGcd) {
        candidates.push({ left: newLeft, right: rightSections, gcd: newGcd })
      }
    }
  }
  
  // 右を調整
  for (let adj = -2; adj <= 2; adj++) {
    const newRight = rightSections + adj
    if (newRight >= 4 && newRight <= 12) {
      const newGcd = gcd(leftSections, newRight)
      if (newGcd >= minGcd) {
        candidates.push({ left: leftSections, right: newRight, gcd: newGcd })
      }
    }
  }
  
  // 両方を調整
  for (let adjL = -1; adjL <= 1; adjL++) {
    for (let adjR = -1; adjR <= 1; adjR++) {
      const newLeft = leftSections + adjL
      const newRight = rightSections + adjR
      if (newLeft >= 4 && newLeft <= 12 && newRight >= 4 && newRight <= 12) {
        const newGcd = gcd(newLeft, newRight)
        if (newGcd >= minGcd) {
          candidates.push({ left: newLeft, right: newRight, gcd: newGcd })
        }
      }
    }
  }
  
  if (candidates.length === 0) return null
  
  // 調整量が最小のものを選択
  candidates.sort((a, b) => {
    const adjA = Math.abs(a.left - leftSections) + Math.abs(a.right - rightSections)
    const adjB = Math.abs(b.left - leftSections) + Math.abs(b.right - rightSections)
    if (adjA !== adjB) return adjA - adjB
    return b.gcd - a.gcd  // 同じ調整量ならGCDが大きい方
  })
  
  return candidates[0]
}

const calculateDualAxisScale = (
  leftDataMin: number, leftDataMax: number,
  rightDataMin: number, rightDataMax: number
): DualAxisScaleResult => {
  // 1. 各軸で独立に最適スケールを計算
  const leftScale = calculateSingleAxisScale(leftDataMin, leftDataMax)
  const rightScale = calculateSingleAxisScale(rightDataMin, rightDataMax)
  
  const leftSections = leftScale.tickCount - 1
  const rightSections = rightScale.tickCount - 1
  
  // 2. GCDを計算
  let gridGcd = gcd(leftSections, rightSections)
  let finalLeftSections = leftSections
  let finalRightSections = rightSections
  
  // 3. GCDが小さすぎる場合（< 4）は区間数を調整
  if (gridGcd < 4) {
    const adjusted = adjustSectionsForBetterGcd(leftSections, rightSections, 4)
    if (adjusted) {
      gridGcd = adjusted.gcd
      finalLeftSections = adjusted.left
      finalRightSections = adjusted.right
      
      // 区間数が変わった場合、スケールを再計算
      if (finalLeftSections !== leftSections) {
        const newLeftRange = leftScale.interval * finalLeftSections
        // 範囲を拡張（中央寄せ）
        const diff = newLeftRange - (leftScale.axisMax - leftScale.axisMin)
        leftScale.axisMax += diff / 2
        leftScale.axisMin -= diff / 2
        leftScale.axisMin = Math.floor(leftScale.axisMin / leftScale.interval) * leftScale.interval
        leftScale.axisMax = leftScale.axisMin + newLeftRange
        leftScale.tickCount = finalLeftSections + 1
      }
      
      if (finalRightSections !== rightSections) {
        const newRightRange = rightScale.interval * finalRightSections
        const diff = newRightRange - (rightScale.axisMax - rightScale.axisMin)
        rightScale.axisMax += diff / 2
        rightScale.axisMin -= diff / 2
        rightScale.axisMin = Math.floor(rightScale.axisMin / rightScale.interval) * rightScale.interval
        rightScale.axisMax = rightScale.axisMin + newRightRange
        rightScale.tickCount = finalRightSections + 1
      }
    }
  }
  
  const gridLines = gridGcd + 1
  
  // 4. splitLine.interval を計算（EChartsの間引き設定）
  // interval: N → N+1 個ごとにグリッド線を表示
  const leftSplitLineInterval = (finalLeftSections / gridGcd) - 1
  const rightSplitLineInterval = (finalRightSections / gridGcd) - 1
  
  // 5. 0の位置揃えチェック
  const leftCrossesZero = leftScale.axisMin < 0 && leftScale.axisMax > 0
  const rightCrossesZero = rightScale.axisMin < 0 && rightScale.axisMax > 0
  
  let zeroAligned = false
  if (leftCrossesZero && rightCrossesZero) {
    const leftZeroRatio = calculateZeroRatio(leftScale.axisMin, leftScale.axisMax)
    const rightZeroRatio = calculateZeroRatio(rightScale.axisMin, rightScale.axisMax)
    
    if (leftZeroRatio !== null && rightZeroRatio !== null) {
      const zeroRatioDiff = Math.abs(leftZeroRatio - rightZeroRatio)
      // 0の相対位置が近い場合（差が0.1未満）は揃っていると見なす
      zeroAligned = zeroRatioDiff < 0.1
    }
  }
  
  return {
    left: {
      ...leftScale,
      splitLineInterval: leftSplitLineInterval
    },
    right: {
      ...rightScale,
      splitLineInterval: rightSplitLineInterval
    },
    gridLines,
    zeroAligned
  }
}

export const TableChart = ({ 
  table, 
  tone = 'simple', 
  width = 600, 
  height = 300, 
  chartColors, 
  backgroundColor, 
  baseFontSize = 48 
}: TableChartProps) => {
  const displayFormat = table.displayFormat || 'table'
  const chartConfig = table.chartConfig
  const showGrid = chartConfig?.showGrid ?? true
  const colors = chartColors && chartColors.length > 0 ? chartColors : toneColors[tone]
  
  // 新データモデルから読み取り
  const yAxisConfig = chartConfig?.yAxisConfig
  const y2AxisConfig = chartConfig?.y2AxisConfig
  
  // 単位: 新データモデルから取得、フォールバックあり
  const yAxisUnit = yAxisConfig?.unit || chartConfig?.yAxisUnit || ''
  const yAxisRightUnit = y2AxisConfig?.unit || chartConfig?.yAxisRightUnit || ''
  
  const xAxisDateFormat = chartConfig?.xAxisDateFormat
  
  // 積み上げ判定: スタック構造から判定
  const hasStacked = hasStackedSeriesInConfig(yAxisConfig) || hasStackedSeriesInConfig(y2AxisConfig)
  const stacked: StackedMode = hasStacked ? 'on' : (chartConfig?.stacked || 'off')
  
  const showLegend = chartConfig?.showLegend ?? true
  const legendPosition = chartConfig?.legendPosition || 'top'
  const showDataLabels = chartConfig?.showDataLabels ?? false
  const barColumns = chartConfig?.barColumns || []
  const lineColumns = chartConfig?.lineColumns || []
  const showLineLabels = chartConfig?.showLineLabels ?? false
  const lineLabelPosition = chartConfig?.lineLabelPosition || 'middle'
  
  // マイナス値を三角形表記にフォーマット（例: -80 → △80）
  const formatValue = (value: number): string => {
    if (value < 0) {
      return `△${Math.abs(value)}`
    }
    return String(value)
  }
  
  // 各列の表示タイプを取得するヘルパー関数（新データモデル対応）
  const getSeriesDisplayType = (columnIndex: number): 'bar' | 'line' | 'area' => {
    const series = findSeriesByColumn(columnIndex, yAxisConfig, y2AxisConfig)
    return series?.type || 'bar'
  }
  
  // 各列の色を取得するヘルパー関数
  const getSeriesColor = (columnIndex: number, fallbackIdx: number): string => {
    const series = findSeriesByColumn(columnIndex, yAxisConfig, y2AxisConfig)
    return series?.color || colors[fallbackIdx % colors.length]
  }
  
  // 各列のスムージング設定を取得
  const getSeriesSmoothing = (columnIndex: number): boolean => {
    const series = findSeriesByColumn(columnIndex, yAxisConfig, y2AxisConfig)
    return series?.smoothing ?? false
  }
  
  // 各列のスタックIDを取得
  const getSeriesStackId = (columnIndex: number): string | undefined => {
    return getStackIdForColumn(columnIndex, yAxisConfig, y2AxisConfig)
  }
  
  const { data, seriesKeys, seriesColumnIndices, yAxisColumns, y2AxisColumns } = useMemo(
    () => convertTableToChartData(table), 
    [table]
  )
  
  const hasDualAxis = y2AxisColumns.length > 0
  const getYAxisIndex = (colIndex: number): number => y2AxisColumns.includes(colIndex) ? 1 : 0
  
  // Y軸の最大値・最小値を計算（左軸・右軸それぞれ、積み上げを考慮、負の値対応）
  const { leftAxisMax, rightAxisMax, leftAxisMin, rightAxisMin } = useMemo(() => {
    // チャートタイプごとに右軸に割り当てるデータを判定
    const isRightAxisColumn = (colIndex: number, idx: number): boolean => {
      if (displayFormat === 'combo') {
        // コンボチャート: lineColumns に含まれる列、または指定がなければ最初以外の列
        if (lineColumns.length > 0) {
          return lineColumns.includes(colIndex)
        }
        return idx > 0  // デフォルトは最初の列以外が右軸
      }
      // その他のチャート: y2AxisColumns に基づく（新データモデル）
      return y2AxisColumns.includes(colIndex)
    }
    
    // 積み上げがない場合は従来通り（個別最大値・最小値）
    if (stacked === 'off' && !hasStacked) {
      let leftMax = 0
      let rightMax = 0
      let leftMin = 0
      let rightMin = 0
      
      seriesKeys.forEach((key, idx) => {
        const colIndex = seriesColumnIndices[idx]
        const isRightAxis = hasDualAxis && isRightAxisColumn(colIndex, idx)
        const values = data.map(d => {
          const val = d[key]
          return typeof val === 'number' ? val : 0
        })
        const maxValue = Math.max(...values)
        const minValue = Math.min(...values)
        
        if (isRightAxis) {
          rightMax = Math.max(rightMax, maxValue)
          rightMin = Math.min(rightMin, minValue)
        } else {
          leftMax = Math.max(leftMax, maxValue)
          leftMin = Math.min(leftMin, minValue)
        }
      })
      
      return { leftAxisMax: leftMax, rightAxisMax: rightMax, leftAxisMin: leftMin, rightAxisMin: rightMin }
    }
    
    // 積み上げの場合：同じstackIdを持つシリーズをグループ化して累積最大値・最小値を計算
    const leftStackGroups: Map<string, number[]> = new Map()  // stackId -> seriesIndices
    const rightStackGroups: Map<string, number[]> = new Map()
    const leftNonStacked: number[] = []  // スタックされていない左軸のシリーズ
    const rightNonStacked: number[] = []  // スタックされていない右軸のシリーズ
    
    seriesColumnIndices.forEach((colIndex, idx) => {
      const stackId = getSeriesStackId(colIndex)
      const isRightAxis = hasDualAxis && isRightAxisColumn(colIndex, idx)
      
      if (stackId) {
        // スタックされている場合
        const targetMap = isRightAxis ? rightStackGroups : leftStackGroups
        if (!targetMap.has(stackId)) {
          targetMap.set(stackId, [])
        }
        targetMap.get(stackId)!.push(idx)
      } else {
        // スタックされていない場合
        if (isRightAxis) {
          rightNonStacked.push(idx)
        } else {
          leftNonStacked.push(idx)
        }
      }
    })
    
    let leftMax = 0
    let rightMax = 0
    let leftMin = 0
    let rightMin = 0
    
    // 左軸のスタックグループの累積最大値・最小値を計算
    leftStackGroups.forEach((indices) => {
      data.forEach(d => {
        const stackSum = indices.reduce((sum, idx) => {
          const val = d[seriesKeys[idx]]
          return sum + (typeof val === 'number' ? val : 0)
        }, 0)
        leftMax = Math.max(leftMax, stackSum)
        leftMin = Math.min(leftMin, stackSum)
      })
    })
    
    // 左軸のスタックされていないシリーズの最大値・最小値
    leftNonStacked.forEach(idx => {
      const values = data.map(d => {
        const val = d[seriesKeys[idx]]
        return typeof val === 'number' ? val : 0
      })
      const maxValue = Math.max(...values)
      const minValue = Math.min(...values)
      leftMax = Math.max(leftMax, maxValue)
      leftMin = Math.min(leftMin, minValue)
    })
    
    // 右軸のスタックグループの累積最大値・最小値を計算
    rightStackGroups.forEach((indices) => {
      data.forEach(d => {
        const stackSum = indices.reduce((sum, idx) => {
          const val = d[seriesKeys[idx]]
          return sum + (typeof val === 'number' ? val : 0)
        }, 0)
        rightMax = Math.max(rightMax, stackSum)
        rightMin = Math.min(rightMin, stackSum)
      })
    })
    
    // 右軸のスタックされていないシリーズの最大値・最小値
    rightNonStacked.forEach(idx => {
      const values = data.map(d => {
        const val = d[seriesKeys[idx]]
        return typeof val === 'number' ? val : 0
      })
      const maxValue = Math.max(...values)
      const minValue = Math.min(...values)
      rightMax = Math.max(rightMax, maxValue)
      rightMin = Math.min(rightMin, minValue)
    })
    
    return { leftAxisMax: leftMax, rightAxisMax: rightMax, leftAxisMin: leftMin, rightAxisMin: rightMin }
  }, [data, seriesKeys, seriesColumnIndices, y2AxisColumns, displayFormat, lineColumns, hasDualAxis, stacked, hasStacked, getSeriesStackId])
  
  // 1-2-5アルゴリズムによる軸スケール計算（GCDベースのグリッド線整合、独立スケーリング + 間引き）
  const axisScale = useMemo(() => {
    if (hasDualAxis) {
      // 2軸グラフ: 独立スケーリング + GCDベースのグリッド線間引き
      return calculateDualAxisScale(
        leftAxisMin, leftAxisMax,
        rightAxisMin, rightAxisMax
      )
    } else {
      // 単軸: 通常の1-2-5スケーリング（間引きなし）
      const left = calculateSingleAxisScale(leftAxisMin, leftAxisMax)
      return {
        left: { ...left, splitLineInterval: 0 },  // 間引きなし（毎回表示）
        right: { ...left, splitLineInterval: 0 },  // 使用しない
        gridLines: left.tickCount,
        zeroAligned: false  // 単軸では該当なし
      }
    }
  }, [leftAxisMin, leftAxisMax, rightAxisMin, rightAxisMax, hasDualAxis])
  
  // 軸ラベルの色を計算（2軸グラフで、その軸が1系列のみの場合、その系列の色を使用）
  const axisLabelColors = useMemo(() => {
    // 2軸グラフでない場合は色をつけない
    if (!hasDualAxis) {
      return { left: null, right: null }
    }
    
    // 左軸の系列を取得（y2AxisColumnsに含まれない列）
    const leftAxisSeriesIndices = seriesColumnIndices
      .map((colIndex, idx) => ({ colIndex, idx }))
      .filter(({ colIndex }) => !y2AxisColumns.includes(colIndex))
    
    // 右軸の系列を取得
    const rightAxisSeriesIndices = seriesColumnIndices
      .map((colIndex, idx) => ({ colIndex, idx }))
      .filter(({ colIndex }) => y2AxisColumns.includes(colIndex))
    
    // 左軸: 1系列のみなら色をつける（右軸の系列数は関係ない）
    const leftColor = leftAxisSeriesIndices.length === 1
      ? getSeriesColor(leftAxisSeriesIndices[0].colIndex, leftAxisSeriesIndices[0].idx)
      : null
    
    // 右軸: 1系列のみなら色をつける（左軸の系列数は関係ない）
    const rightColor = rightAxisSeriesIndices.length === 1
      ? getSeriesColor(rightAxisSeriesIndices[0].colIndex, rightAxisSeriesIndices[0].idx)
      : null
    
    return { left: leftColor, right: rightColor }
  }, [seriesColumnIndices, y2AxisColumns, hasDualAxis, getSeriesColor])
  
  const smallFontSize = Math.round(baseFontSize * 0.75)
  const isLight = isLightBackground(backgroundColor)
  
  // 背景色計算（グラデーション対応、明度保持）
  const chartBgColor = (() => {
    if (!backgroundColor) return '#f2f2f2'
    
    // グラデーション背景の場合：中間色を抽出
    if (backgroundColor.includes('gradient')) {
      const middleColor = extractMiddleColorFromGradient(backgroundColor)
      if (middleColor) {
        return calculateChartBgFromColor(middleColor)
      }
    }
    
    return calculateChartBgFromColor(backgroundColor)
  })()
  
  const textColor = tone === 'luxury' ? '#C9A962' : tone === 'warm' ? '#3D405B' : (isLight ? '#666' : '#ccc')
  const gridColor = tone === 'luxury' ? '#444' : (isLight ? '#ddd' : '#555')
  
  // テーブル形式の場合は何も表示しない
  if (displayFormat === 'table') {
    return null
  }
  
  // データがない場合
  if (data.length === 0 || seriesKeys.length === 0) {
    return (
      <div style={{ 
        width, height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#888', fontSize: '0.875rem',
      }}>
        データがありません
      </div>
    )
  }
  
  const categoryData = data.map(d => String(d.name))
  
  // 共通のグリッド設定（凡例位置に応じてマージン調整）
  // containLabel: true により軸ラベルの幅は自動計算されるため、追加マージンは最小限に
  const getGrid = () => {
    const baseGrid = {
      left: baseFontSize * 0.5,
      right: baseFontSize * 0.5,
      top: baseFontSize * 2.5,
      bottom: baseFontSize * 1.5,
      containLabel: true,
    }
    
    if (!showLegend || legendPosition === 'inside') {
      return baseGrid
    }
    
    switch (legendPosition) {
      case 'top':
        return { ...baseGrid, top: baseFontSize * 4 }
      case 'bottom':
        return { ...baseGrid, bottom: baseFontSize * 3 }
      case 'left':
        return { ...baseGrid, left: baseFontSize * 3 }
      case 'right':
        return { ...baseGrid, right: baseFontSize * 3 }
      default:
        return baseGrid
    }
  }
  
  // 共通のタイトル設定
  const getTitle = () => ({
    text: table.name,
    left: 'center',
    top: baseFontSize * 0.5,
    textStyle: {
      fontSize: baseFontSize,
      fontWeight: 'bold' as const,
      color: textColor,
    },
  })
  
  // 共通の凡例設定
  const getLegend = () => {
    if (!showLegend) return { show: false }
    
    const baseStyle = {
      show: true,
      textStyle: {
        fontSize: smallFontSize,
        color: textColor,
      },
    }
    
    switch (legendPosition) {
      case 'top':
        return {
          ...baseStyle,
          orient: 'horizontal' as const,
          top: baseFontSize * 2.5,
          left: 'center' as const,
        }
      case 'bottom':
        return {
          ...baseStyle,
          orient: 'horizontal' as const,
          bottom: 0,
          left: 'center' as const,
        }
      case 'left':
        return {
          ...baseStyle,
          orient: 'vertical' as const,
          left: 10,
          top: 'middle' as const,
        }
      case 'right':
        return {
          ...baseStyle,
          orient: 'vertical' as const,
          right: 10,
          top: 'middle' as const,
        }
      case 'inside':
        return {
          ...baseStyle,
          orient: 'horizontal' as const,
          top: 'middle' as const,
          left: 'center' as const,
        }
      default:
        return {
          ...baseStyle,
          orient: 'horizontal' as const,
          top: baseFontSize * 2.5,
          left: 'center' as const,
        }
    }
  }
  
  // 日経スタイル X軸フォーマッター（時系列用）
  const getNikkeiXAxisFormatter = () => (value: string, index: number) => {
    const isFirst = index === 0
    const isLast = index === categoryData.length - 1
    
    // 日付として解析を試みる
    const date = new Date(value)
    const isValidDate = !isNaN(date.getTime())
    
    if (!isValidDate) {
      // 日付でない場合はそのまま返す
      return value
    }
    
    if (isFirst) {
      // 最初: 年月を明示（例: 15/10月）
      return formatDate(value, 'YY/M月')
    } else if (isLast) {
      // 最後: 単位を付与（例: 25年）
      return formatDate(value, 'YY年')
    } else {
      // 中間: 数字のみ
      return formatDate(value, 'YY')
    }
  }
  
  // 共通のX軸設定
  const getXAxis = (isCategory = true) => ({
    type: isCategory ? 'category' as const : 'value' as const,
    data: isCategory ? categoryData : undefined,
    axisLabel: {
      fontSize: smallFontSize,
      color: textColor,
      formatter: xAxisDateFormat ? getNikkeiXAxisFormatter() : undefined,
    },
    axisLine: { lineStyle: { color: gridColor } },
    axisTick: { lineStyle: { color: gridColor } },
  })
  
  // 横棒グラフ用のX軸（値軸）設定（日経スタイル: 最大値に単位表示）
  const getXAxisValue = (unit?: string, dataMax?: number) => ({
    type: 'value' as const,
    axisLabel: {
      formatter: (value: number) => {
        // 最右端（データ最大値以上）の場合のみ単位を下に追加
        if (unit && dataMax !== undefined && value >= dataMax) {
          return `{value|${value}}\n{unit|${unit}}`
        }
        return `{value|${value}}`
      },
      rich: {
        value: { 
          fontSize: smallFontSize, 
          color: textColor,
          lineHeight: smallFontSize * 1.2,
        },
        unit: { 
          fontSize: smallFontSize * 0.7, 
          color: textColor,
          lineHeight: smallFontSize * 0.9,
        },
      },
    },
    axisLine: { lineStyle: { color: gridColor } },
    splitLine: showGrid ? { lineStyle: { color: gridColor, type: 'dashed' as const } } : { show: false },
  })
  
  // 共通のY軸設定（日経スタイル: 三角マーカー付き、1-2-5スケーリング対応、GCDベースのグリッド間引き）
  const getYAxis = (unit?: string, isRight = false) => {
    // 新しい1-2-5アルゴリズムから計算済みのスケールを使用
    const scale = isRight ? axisScale.right : axisScale.left
    const { axisMin, axisMax, interval, splitLineInterval } = scale
    
    // 軸ラベルの色: その軸が1系列のみの場合、系列の色を使用
    const axisColor = (isRight ? axisLabelColors.right : axisLabelColors.left) || textColor
    
    return {
      type: 'value' as const,
      position: isRight ? 'right' as const : 'left' as const,
      min: axisMin,
      max: axisMax,
      interval,
      axisLabel: {
        formatter: (value: number) => {
          const marker = isRight ? `◂${value}` : `${value}▸`
          // 最上部（axisMaxと一致する場合）のみ単位を下に追加
          if (unit && Math.abs(value - axisMax) < interval * 0.01) {
            return `{value|${marker}}\n{unit|${unit}}`
          }
          return `{value|${marker}}`
        },
        rich: {
          value: { 
            fontSize: smallFontSize, 
            color: axisColor,  // 系列の色または既定色
            lineHeight: smallFontSize * 1.2,
          },
          unit: { 
            fontSize: smallFontSize * 0.7, 
            color: axisColor,  // 系列の色または既定色
            lineHeight: smallFontSize * 0.9,
          },
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      // 右軸はグリッド線を非表示、左軸はGCDベースで間引き表示
      splitLine: isRight 
        ? { show: false }
        : (showGrid ? { 
            show: true,
            interval: splitLineInterval,  // GCDベースの間引き（0 = 毎回、1 = 2回に1回、etc.）
            lineStyle: { color: gridColor, type: 'dashed' as const } 
          } : { show: false }),
    }
  }
  
  // 共通のツールチップ設定（無効化）
  const getTooltip = () => ({ show: false })
  
  // 線上ラベル（markPoint）を生成
  const getLineLabel = (seriesName: string, seriesData: (string | number)[], color: string) => {
    if (!showLineLabels) return undefined
    
    // ラベル位置を決定
    let labelIndex: number
    switch (lineLabelPosition) {
      case 'start':
        labelIndex = 0
        break
      case 'end':
        labelIndex = seriesData.length - 1
        break
      case 'middle':
      default:
        labelIndex = Math.floor(seriesData.length / 2)
        break
    }
    
    const value = seriesData[labelIndex]
    
    return {
      symbol: 'rect',
      symbolSize: [seriesName.length * smallFontSize * 0.8 + 20, smallFontSize * 1.5],
      symbolOffset: [0, -smallFontSize * 0.8],
      data: [{
        name: seriesName,
        coord: [categoryData[labelIndex], value],
        label: {
          show: true,
          formatter: '{b}',
          color: '#fff',
          fontSize: smallFontSize * 0.9,
          fontWeight: 'bold' as const,
        },
        itemStyle: {
          color: color,
          borderRadius: 4,
        },
      }],
    }
  }
  
  // EChartsオプションを生成
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getOption = (): any => {
  switch (displayFormat) {
    case 'line':
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: hasDualAxis 
            ? [getYAxis(yAxisUnit, false), getYAxis(yAxisRightUnit, true)]
            : getYAxis(yAxisUnit, false),
          series: seriesKeys.map((key, idx) => {
            const colIndex = seriesColumnIndices[idx]
            const displayType = getSeriesDisplayType(colIndex)
            const seriesData = data.map(d => d[key])
            const color = getSeriesColor(colIndex, idx)
            const smooth = getSeriesSmoothing(colIndex)
            const stackId = getSeriesStackId(colIndex)
            
            if (displayType === 'bar') {
              return {
                name: key,
                type: 'bar' as const,
                data: showDataLabels && !stackId
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                stack: stackId,
                itemStyle: { 
                  color,
                  borderRadius: stackId ? [0, 0, 0, 0] : [4, 4, 0, 0],
                },
                label: stackId && showDataLabels ? {
                  show: true,
                  position: 'inside',
                  fontSize: smallFontSize,
                  color: '#fff',
                  formatter: (params: { value: number }) => formatValue(params.value),
                } : { show: false },
              }
            } else if (displayType === 'area') {
              return {
                name: key,
                type: 'line' as const,
                data: showDataLabels
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                smooth,
                symbol: 'none',
                stack: stackId,
                areaStyle: { opacity: 0.3 },
                lineStyle: { width: 4, color },
                itemStyle: { color },
                markPoint: getLineLabel(key, seriesData, color),
              }
            } else {
              // line (default for line chart)
              return {
                name: key,
                type: 'line' as const,
                data: showDataLabels
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                smooth,
                symbol: 'none',
                symbolSize: 8,
                lineStyle: { width: 4, color },
                itemStyle: { color },
                markPoint: getLineLabel(key, seriesData, color),
              }
            }
          }),
        }
    
    case 'area':
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: hasDualAxis 
            ? [getYAxis(yAxisUnit, false), getYAxis(yAxisRightUnit, true)]
            : getYAxis(yAxisUnit, false),
          series: seriesKeys.map((key, idx) => {
            const colIndex = seriesColumnIndices[idx]
            const displayType = getSeriesDisplayType(colIndex)
            const seriesData = data.map(d => d[key])
            const color = getSeriesColor(colIndex, idx)
            const smooth = getSeriesSmoothing(colIndex)
            const stackId = getSeriesStackId(colIndex)
            
            if (displayType === 'bar') {
              return {
                name: key,
                type: 'bar' as const,
                data: showDataLabels && !stackId
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                stack: stackId,
                itemStyle: { 
                  color,
                  borderRadius: stackId ? [0, 0, 0, 0] : [4, 4, 0, 0],
                },
                label: stackId && showDataLabels ? {
                  show: true,
                  position: 'inside',
                  fontSize: smallFontSize,
                  color: '#fff',
                  formatter: (params: { value: number }) => formatValue(params.value),
                } : { show: false },
              }
            } else if (displayType === 'line') {
              return {
                name: key,
                type: 'line' as const,
                data: showDataLabels
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                smooth,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 4, color },
                itemStyle: { color },
                markPoint: getLineLabel(key, seriesData, color),
              }
            } else {
              // area (default for area chart)
              return {
                name: key,
                type: 'line' as const,
                data: showDataLabels
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                smooth,
                symbol: 'none',
                stack: stackId,
                areaStyle: { opacity: 0.3 },
                lineStyle: { width: 4, color },
                itemStyle: { color },
                markPoint: getLineLabel(key, seriesData, color),
              }
            }
          }),
        }
    
    case 'bar':
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: hasDualAxis 
            ? [getYAxis(yAxisUnit, false), getYAxis(yAxisRightUnit, true)]
            : getYAxis(yAxisUnit, false),
          series: seriesKeys.map((key, idx) => {
            const colIndex = seriesColumnIndices[idx]
            const displayType = getSeriesDisplayType(colIndex)
            const color = getSeriesColor(colIndex, idx)
            const smooth = getSeriesSmoothing(colIndex)
            const stackId = getSeriesStackId(colIndex)
            const seriesData = data.map(d => d[key])
            
            if (displayType === 'line') {
              return {
                name: key,
                type: 'line' as const,
                data: showDataLabels
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                smooth,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 4, color },
                itemStyle: { color },
              }
            } else if (displayType === 'area') {
              return {
                name: key,
                type: 'line' as const,
                data: showDataLabels
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                smooth,
                symbol: 'none',
                stack: stackId,
                areaStyle: { opacity: 0.3 },
                lineStyle: { width: 4, color },
                itemStyle: { color },
              }
            } else {
              // bar (default)
              return {
                name: key,
                type: 'bar' as const,
                data: showDataLabels && !stackId
                  ? seriesData.map(value => ({
                      value,
                      label: {
                        show: true,
                        position: Number(value) < 0 ? 'bottom' : 'top',
                        fontSize: smallFontSize,
                        color: color,
                        formatter: () => formatValue(Number(value)),
                      },
                    }))
                  : seriesData,
                yAxisIndex: hasDualAxis ? getYAxisIndex(colIndex) : 0,
                stack: stackId,
                itemStyle: { 
                  color,
                  borderRadius: stackId ? [0, 0, 0, 0] : [4, 4, 0, 0],
                },
                label: stackId && showDataLabels ? {
                  show: true,
                  position: 'inside',
                  fontSize: smallFontSize,
                  color: '#fff',
                  formatter: (params: { value: number }) => formatValue(params.value),
                } : { show: false },
              }
            }
          }),
        }
    
    case 'scatter':
      const xKey = seriesKeys[0] || 'x'
      const yKey = seriesKeys[1] || seriesKeys[0] || 'y'
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: {
            type: 'value' as const,
            name: xKey,
            axisLabel: { fontSize: smallFontSize, color: textColor },
            axisLine: { lineStyle: { color: gridColor } },
            splitLine: showGrid ? { lineStyle: { color: gridColor, type: 'dashed' as const } } : { show: false },
          },
          yAxis: {
            type: 'value' as const,
            name: yKey,
            axisLabel: { fontSize: smallFontSize, color: textColor },
            axisLine: { lineStyle: { color: gridColor } },
            splitLine: showGrid ? { lineStyle: { color: gridColor, type: 'dashed' as const } } : { show: false },
          },
          series: [{
            name: `${xKey} vs ${yKey}`,
            type: 'scatter' as const,
            data: data.map(d => [d[xKey], d[yKey]]),
            symbolSize: 12,
            itemStyle: { color: colors[0] },
          }],
        }
      
      case 'donut':
        const pieData = data.map((entry, idx) => ({
          name: String(entry.name),
          value: typeof entry[seriesKeys[0]] === 'number' ? entry[seriesKeys[0]] : 0,
          itemStyle: { color: colors[idx % colors.length] },
        }))
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          tooltip: getTooltip(),
          series: [{
            type: 'pie' as const,
            radius: ['40%', '70%'],
            center: ['45%', '55%'],
            data: pieData,
            label: {
              show: true,
              formatter: '{b}: {d}%',
              fontSize: smallFontSize * 0.8,
              color: textColor,
            },
            labelLine: { lineStyle: { color: textColor } },
          }],
        }
      
      case 'horizontalBar':
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: { ...getGrid(), left: baseFontSize * 5 },
          tooltip: getTooltip(),
          xAxis: getXAxisValue(yAxisUnit, leftAxisMax),
          yAxis: {
            type: 'category' as const,
            data: categoryData,
            axisLabel: { fontSize: smallFontSize, color: textColor },
            axisLine: { lineStyle: { color: gridColor } },
          },
          series: seriesKeys.map((key, idx) => {
            const colIndex = seriesColumnIndices[idx]
            const stackId = getSeriesStackId(colIndex) || (stacked !== 'off' ? 'total' : undefined)
            const color = getSeriesColor(colIndex, idx)
            const seriesData = data.map(d => d[key])
            return {
              name: key,
              type: 'bar' as const,
              data: showDataLabels && !stackId
                ? seriesData.map(value => ({
                    value,
                    label: {
                      show: true,
                      position: Number(value) < 0 ? 'left' : 'right',
                      fontSize: smallFontSize,
                      color: color,
                      formatter: () => formatValue(Number(value)),
                    },
                  }))
                : seriesData,
              stack: stackId,
              itemStyle: { 
                color,
                borderRadius: [0, 4, 4, 0],
              },
              label: stackId && showDataLabels ? {
                show: true,
                position: 'inside',
                fontSize: smallFontSize,
                color: '#fff',
                formatter: (params: { value: number }) => formatValue(params.value),
              } : { show: false },
            }
          }),
        }
      
      case 'stackedBar':
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: {
            ...getYAxis(yAxisUnit, false),
            ...(stacked === 'percent' ? { 
              min: leftAxisMin < 0 ? -100 : 0,
              max: 100,
              interval: leftAxisMin < 0 ? 40 : 20,
            } : {}),
          },
          series: seriesKeys.map((key, idx) => {
            const colIndex = seriesColumnIndices[idx]
            const stackId = getSeriesStackId(colIndex) || 'total'
            return {
              name: key,
              type: 'bar' as const,
              data: data.map(d => d[key]),
              stack: stackId,
              itemStyle: { color: getSeriesColor(colIndex, idx) },
              label: showDataLabels ? {
                show: true,
                position: 'inside',
                fontSize: smallFontSize,
                color: '#fff',
                formatter: (params: { value: number }) => formatValue(params.value),
              } : { show: false },
            }
          }),
        }
      
      case 'combo':
        const effectiveBarColumns = barColumns.length > 0
          ? barColumns.map(col => seriesKeys[seriesColumnIndices.indexOf(col)] || seriesKeys[0])
          : [seriesKeys[0]]
        const effectiveLineColumns = lineColumns.length > 0
          ? lineColumns.map(col => seriesKeys[seriesColumnIndices.indexOf(col)] || seriesKeys[1])
          : seriesKeys.slice(1)

        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: hasDualAxis
            ? [getYAxis(yAxisUnit, false), getYAxis(yAxisRightUnit, true)]
            : getYAxis(yAxisUnit, false),
          series: [
            ...effectiveBarColumns.filter(Boolean).map((key, idx) => ({
              name: key,
              type: 'bar' as const,
              data: data.map(d => d[key]),
              yAxisIndex: 0,
              itemStyle: {
                color: colors[idx % colors.length],
                borderRadius: [4, 4, 0, 0],
              },
            })),
            ...effectiveLineColumns.filter(Boolean).map((key, idx) => {
              const seriesData = data.map(d => d[key])
              const color = colors[(effectiveBarColumns.length + idx) % colors.length]
              return {
                name: key,
                type: 'line' as const,
                data: seriesData,
                yAxisIndex: hasDualAxis ? 1 : 0,
                smooth: false,
                symbol: 'none',
                symbolSize: 8,
                lineStyle: { width: 4, color },
                itemStyle: { color },
                markPoint: getLineLabel(key, seriesData, color),
              }
            }),
          ],
        }
      
      case 'radar':
        const radarIndicator = categoryData.map(name => ({ name, max: 100 }))
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          tooltip: getTooltip(),
          radar: {
            indicator: radarIndicator,
            center: ['45%', '55%'],
            radius: '60%',
            axisName: { color: textColor, fontSize: smallFontSize },
            splitLine: { lineStyle: { color: gridColor } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: gridColor } },
          },
          series: [{
            type: 'radar' as const,
            data: seriesKeys.map((key, idx) => ({
              name: key,
              value: data.map(d => d[key]),
              lineStyle: { color: colors[idx % colors.length] },
              areaStyle: { color: colors[idx % colors.length], opacity: 0.3 },
              itemStyle: { color: colors[idx % colors.length] },
            })),
          }],
        }
      
      case 'dot':
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: getYAxis(yAxisUnit, false),
          series: seriesKeys.map((key, idx) => {
            const color = colors[idx % colors.length]
            return {
              name: key,
              type: 'scatter' as const,
              data: showDataLabels
                ? data.map((d, i) => ({
                    value: [categoryData[i], d[key]],
                    label: {
                      show: true,
                      position: Number(d[key]) < 0 ? 'bottom' : 'top',
                      fontSize: smallFontSize,
                      color: color,
                      formatter: () => formatValue(Number(d[key])),
                    },
                  }))
                : data.map((d, i) => [categoryData[i], d[key]]),
              symbolSize: 16,
              itemStyle: { color },
            }
          }),
        }
      
      case 'treemap':
        // ツリーデータがある場合はそちらを使用
        if (table.treeData) {
          const treeSettings = table.treeSettings || DEFAULT_TREE_SETTINGS
          const treemapHierarchyData = treeToTreemapData(table.treeData, treeSettings)
          return {
            backgroundColor: chartBgColor,
            title: getTitle(),
            tooltip: getTooltip(),
            series: [{
              type: 'treemap' as const,
              data: treemapHierarchyData,
              top: baseFontSize * 2.5,
              left: 20,
              right: 20,
              bottom: 20,
              label: {
                show: true,
                formatter: '{b}',
                fontSize: smallFontSize,
                color: '#fff',
              },
              breadcrumb: { show: false },
            }],
          }
        }
        
        // スプレッドシートデータを使用（フォールバック）
        const treemapData = data.map((entry, idx) => ({
          name: String(entry.name),
          value: typeof entry[seriesKeys[0]] === 'number' ? entry[seriesKeys[0]] : 0,
          itemStyle: { color: colors[idx % colors.length] },
        }))
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          tooltip: getTooltip(),
          series: [{
            type: 'treemap' as const,
            data: treemapData,
            top: baseFontSize * 2.5,
            left: 20,
            right: 20,
            bottom: 20,
            label: {
              show: true,
              formatter: '{b}',
              fontSize: smallFontSize,
              color: '#fff',
            },
            breadcrumb: { show: false },
          }],
        }
      
      case 'bubble':
        const bubbleXKey = seriesKeys[0] || 'x'
        const bubbleYKey = seriesKeys[1] || seriesKeys[0] || 'y'
        const bubbleZKey = seriesKeys[2] || seriesKeys[0]
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: {
            type: 'value' as const,
            name: bubbleXKey,
            axisLabel: { fontSize: smallFontSize, color: textColor },
            axisLine: { lineStyle: { color: gridColor } },
            splitLine: showGrid ? { lineStyle: { color: gridColor, type: 'dashed' as const } } : { show: false },
          },
          yAxis: {
            ...getYAxis(yAxisUnit, false),
            name: bubbleYKey,
          },
          series: [{
            name: 'data',
            type: 'scatter' as const,
            data: data.map(d => {
              const z = typeof d[bubbleZKey] === 'number' ? d[bubbleZKey] : 10
              return [d[bubbleXKey], d[bubbleYKey], z]
            }),
            symbolSize: (dataItem: number[]) => Math.sqrt(dataItem[2] as number) * 3 + 10,
            itemStyle: { color: colors[0], opacity: 0.7 },
          }],
        }
      
      case 'waterfall':
        const waterfallData: Array<{ name: string; value: number; start: number; fill: string }> = []
        let runningTotal = 0
        
        data.forEach((entry, idx) => {
          const rawValue = entry[seriesKeys[0]]
          const value: number = typeof rawValue === 'number' ? rawValue : 0
          const name = String(entry.name)
          const isFirst = idx === 0
          const isLast = idx === data.length - 1
          
          if (isFirst) {
            waterfallData.push({ name, value, start: 0, fill: colors[0] })
            runningTotal = value
          } else if (isLast) {
            waterfallData.push({ name, value: runningTotal + value, start: 0, fill: colors[0] })
          } else {
            waterfallData.push({
              name,
              value: Math.abs(value),
              start: value >= 0 ? runningTotal : runningTotal + value,
              fill: value >= 0 ? (colors[1] || '#10B981') : (colors[2] || '#EF4444'),
            })
            runningTotal += value
          }
        })
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: {
            type: 'category' as const,
            data: waterfallData.map(d => d.name),
            axisLabel: { fontSize: smallFontSize, color: textColor },
            axisLine: { lineStyle: { color: gridColor } },
          },
          yAxis: getYAxis(yAxisUnit, false),
          series: [
            {
              type: 'bar' as const,
              stack: 'waterfall',
              data: waterfallData.map(d => d.start),
              itemStyle: { color: 'transparent' },
            },
            {
              type: 'bar' as const,
              stack: 'waterfall',
              data: waterfallData.map(d => ({
                value: d.value,
                itemStyle: { color: d.fill, borderRadius: [4, 4, 0, 0] },
              })),
            },
          ],
        }
      
      case 'heatmap':
        const heatmapData: Array<[number, number, number]> = []
        let minVal = Infinity
        let maxVal = -Infinity
        
        data.forEach((entry, rowIdx) => {
          seriesKeys.forEach((key, colIdx) => {
            const val = typeof entry[key] === 'number' ? entry[key] : 0
            heatmapData.push([colIdx, rowIdx, val])
            if (val < minVal) minVal = val
            if (val > maxVal) maxVal = val
          })
        })
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          tooltip: getTooltip(),
          grid: { ...getGrid(), left: baseFontSize * 4 },
          xAxis: {
            type: 'category' as const,
            data: seriesKeys,
            splitArea: { show: true },
            axisLabel: { fontSize: smallFontSize, color: textColor },
          },
          yAxis: {
            type: 'category' as const,
            data: categoryData,
            splitArea: { show: true },
            axisLabel: { fontSize: smallFontSize, color: textColor },
          },
          visualMap: {
            min: minVal,
            max: maxVal,
            calculable: true,
            orient: 'horizontal' as const,
            left: 'center',
            bottom: 10,
            inRange: { color: ['#3B82F6', '#EF4444'] },
            textStyle: { color: textColor, fontSize: smallFontSize * 0.8 },
          },
          series: [{
            type: 'heatmap' as const,
            data: heatmapData,
            label: { show: true, color: '#fff', fontSize: smallFontSize * 0.8 },
          }],
        }
      
      case 'candlestick':
        const openCol = chartConfig?.openColumn ?? 1
        const highCol = chartConfig?.highColumn ?? 2
        const lowCol = chartConfig?.lowColumn ?? 3
        const closeCol = chartConfig?.closeColumn ?? 4
        
        const ohlcData = data.map(entry => {
          const getVal = (key: string) => typeof entry[key] === 'number' ? entry[key] : 0
          return [
            getVal(seriesKeys[openCol - 1] || seriesKeys[0]),
            getVal(seriesKeys[closeCol - 1] || seriesKeys[3]),
            getVal(seriesKeys[lowCol - 1] || seriesKeys[2]),
            getVal(seriesKeys[highCol - 1] || seriesKeys[1]),
          ]
        })
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: getYAxis(yAxisUnit, false),
          series: [{
            type: 'candlestick' as const,
            data: ohlcData,
            itemStyle: {
              color: '#10B981',
              color0: '#EF4444',
              borderColor: '#10B981',
              borderColor0: '#EF4444',
            },
          }],
        }
      
      case 'boxplot':
        const boxplotData = data.map(entry => {
          const values = seriesKeys.map(key => typeof entry[key] === 'number' ? entry[key] : 0).sort((a, b) => a - b)
          const n = values.length
          return [
            values[0],
            values[Math.floor(n * 0.25)] || values[0],
            values[Math.floor(n * 0.5)] || values[0],
            values[Math.floor(n * 0.75)] || values[0],
            values[n - 1],
          ]
        })
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: getYAxis(yAxisUnit, false),
          series: [{
            type: 'boxplot' as const,
            data: boxplotData,
            itemStyle: { color: colors[0], borderColor: colors[0] },
          }],
        }
      
      case 'sankey':
        // ツリーデータがある場合はそちらを使用
        if (table.treeData) {
          const treeSettings = table.treeSettings || DEFAULT_TREE_SETTINGS
          const sankeyData = treeToSankeyData(table.treeData, treeSettings)
          return {
            backgroundColor: chartBgColor,
            title: getTitle(),
            tooltip: getTooltip(),
            series: [{
              type: 'sankey' as const,
              data: sankeyData.nodes,
              links: sankeyData.links,
              emphasis: { focus: 'adjacency' as const },
              lineStyle: { color: 'gradient' as const, curveness: 0.5 },
              label: { color: textColor, fontSize: smallFontSize },
            }],
          }
        }
        
        // スプレッドシートデータを使用（フォールバック）
        // サンキー図: データをノードとリンクに変換
        const nodes = new Set<string>()
        const links: Array<{ source: string; target: string; value: number }> = []
        
        // シリーズの最初の2列をソースとターゲットとして使用
        if (seriesKeys.length >= 2) {
          data.forEach(entry => {
            const source = String(entry.name)
            const target = String(entry[seriesKeys[0]] || '')
            const rawValue = entry[seriesKeys[1]]
            const value = typeof rawValue === 'number' ? rawValue : 1
            if (source && target) {
              nodes.add(source)
              nodes.add(target)
              links.push({ source, target, value })
            }
          })
        }
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          tooltip: getTooltip(),
          series: [{
            type: 'sankey' as const,
            data: Array.from(nodes).map((name, idx) => ({ 
              name, 
              itemStyle: { color: colors[idx % colors.length] } 
            })),
            links,
            emphasis: { focus: 'adjacency' as const },
            lineStyle: { color: 'gradient' as const, curveness: 0.5 },
            label: { color: textColor, fontSize: smallFontSize },
          }],
        }
      
      case 'sunburst':
        // サンバースト: 階層データとして変換
        const sunburstData = data.map((entry, idx) => ({
          name: String(entry.name),
          value: typeof entry[seriesKeys[0]] === 'number' ? entry[seriesKeys[0]] : 0,
          itemStyle: { color: colors[idx % colors.length] },
        }))
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          tooltip: getTooltip(),
          series: [{
            type: 'sunburst' as const,
            data: sunburstData,
            radius: ['20%', '80%'],
            label: {
              show: true,
              fontSize: smallFontSize * 0.8,
              color: textColor,
            },
          }],
        }
      
      case 'bump':
        // バンプチャート: ランキング変動を表示
        // 各カテゴリのランキングを計算
        const rankings: Record<string, number[]> = {}
        seriesKeys.forEach(key => { rankings[key] = [] })
        
        data.forEach((entry) => {
          const values = seriesKeys.map(key => ({
            key,
            value: typeof entry[key] === 'number' ? entry[key] : 0,
          }))
          values.sort((a, b) => b.value - a.value)
          values.forEach((v, rank) => {
            rankings[v.key].push(rank + 1)
          })
        })
        
        return {
          backgroundColor: chartBgColor,
          title: getTitle(),
          legend: getLegend(),
          grid: getGrid(),
          tooltip: getTooltip(),
          xAxis: getXAxis(),
          yAxis: {
            type: 'value' as const,
            inverse: true,
            min: 1,
            max: seriesKeys.length,
            interval: 1,
            axisLabel: { fontSize: smallFontSize, color: textColor },
            axisLine: { lineStyle: { color: gridColor } },
            splitLine: showGrid ? { lineStyle: { color: gridColor, type: 'dashed' as const } } : { show: false },
          },
          series: seriesKeys.map((key, idx) => {
            const seriesData = rankings[key]
            const color = colors[idx % colors.length]
            return {
              name: key,
              type: 'line' as const,
              data: seriesData,
              smooth: 0.3,
              symbol: 'circle',
              symbolSize: 12,
              lineStyle: { width: 4, color },
              itemStyle: { color },
              markPoint: getLineLabel(key, seriesData, color),
            }
          }),
        }
    
    default:
        return {
          backgroundColor: chartBgColor,
          title: { text: 'Unsupported chart type', left: 'center', top: 'center' },
        }
    }
  }
  
  const option = useMemo(() => getOption(), [displayFormat, data, seriesKeys, colors, showGrid, showLegend, legendPosition, showDataLabels, yAxisUnit, yAxisRightUnit, hasDualAxis, stacked, baseFontSize, smallFontSize, textColor, gridColor, chartBgColor, table.name, xAxisDateFormat, categoryData, seriesColumnIndices, barColumns, lineColumns, chartConfig, leftAxisMax, rightAxisMax, yAxisConfig, y2AxisConfig])
  
  // ReactEChartsの参照を保持
  const chartRef = useRef<InstanceType<typeof ReactECharts>>(null)
  
  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      // エラーを抑制しながらチャートをdispose
      try {
        const instance = chartRef.current?.getEchartsInstance()
        if (instance && !instance.isDisposed()) {
          instance.dispose()
        }
      } catch {
        // ResizeObserverのdisconnectエラーを無視
      }
    }
  }, [])
  
  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ width, height }}
      opts={{ renderer: 'svg' }}
      notMerge={true}
      lazyUpdate={true}
    />
  )
}
