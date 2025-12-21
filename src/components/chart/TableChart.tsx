import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { TableItem, Tone, StackedMode } from '../../types'
import { DEFAULT_TREE_SETTINGS } from '../../types'
import { treeToSankeyData, treeToTreemapData } from '../../utils/treeUtils'

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

// テーブルデータをチャート用データに変換
const convertTableToChartData = (
  table: TableItem
): { 
  data: Array<Record<string, string | number>>
  seriesKeys: string[]
  seriesColumnIndices: number[]
} => {
  const { data, headers, chartConfig, hiddenRows = [], hiddenColumns = [] } = table
  const xAxisColumn = chartConfig?.xAxisColumn ?? 0
  
  const allColumns = Array.from({ length: (data[0]?.length ?? 1) }, (_, i) => i)
  const visibleColumns = allColumns.filter(col => !hiddenColumns.includes(col))
  
  const effectiveXAxisColumn = hiddenColumns.includes(xAxisColumn) 
    ? visibleColumns[0] ?? 0 
    : xAxisColumn
  
  const yAxisColumns = chartConfig?.yAxisColumns?.filter(col => !hiddenColumns.includes(col)) ?? 
    visibleColumns.filter(col => col !== effectiveXAxisColumn)
  
  const getSeriesName = (colIndex: number): string => {
    if (headers && headers[colIndex]) return headers[colIndex]
    if (data[0] && data[0][colIndex]) return data[0][colIndex]
    return `Series ${colIndex}`
  }
  
  const seriesKeys = yAxisColumns.map(col => getSeriesName(col))
  const seriesColumnIndices = yAxisColumns
  
  const startRow = headers && headers.length > 0 ? 0 : 1
  const chartData = data
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ rowIndex }) => !hiddenRows.includes(rowIndex))
    .slice(startRow)
    .filter(({ row }) => {
      const name = row[effectiveXAxisColumn]?.trim()
      if (!name) return false
      const hasAnyValue = yAxisColumns.some(colIndex => {
        const value = row[colIndex]?.trim()
        return value && value !== ''
      })
      return hasAnyValue
    })
    .map(({ row }) => {
      const entry: Record<string, string | number> = {
        name: row[effectiveXAxisColumn] || '',
      }
      yAxisColumns.forEach((colIndex, idx) => {
        const value = row[colIndex]
        const numValue = parseFloat(value?.replace(/[,¥$€£%]/g, '') || '0')
        entry[seriesKeys[idx]] = isNaN(numValue) ? 0 : numValue
      })
      return entry
    })
  
  return { data: chartData, seriesKeys, seriesColumnIndices }
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
  
  const yAxisUnit = chartConfig?.yAxisUnit || ''
  const yAxisRightUnit = chartConfig?.yAxisRightUnit || ''
  const yAxisRightColumns = chartConfig?.yAxisRightColumns || []
  const xAxisDateFormat = chartConfig?.xAxisDateFormat
  const stacked: StackedMode = chartConfig?.stacked || 'off'
  const showLegend = chartConfig?.showLegend ?? true
  const showDataLabels = chartConfig?.showDataLabels ?? false
  const barColumns = chartConfig?.barColumns || []
  const lineColumns = chartConfig?.lineColumns || []
  const showLineLabels = chartConfig?.showLineLabels ?? false
  const lineLabelPosition = chartConfig?.lineLabelPosition || 'middle'
  
  const { data, seriesKeys, seriesColumnIndices } = useMemo(() => convertTableToChartData(table), [table])
  
  const hasDualAxis = yAxisRightColumns.length > 0
  const getYAxisIndex = (colIndex: number): number => yAxisRightColumns.includes(colIndex) ? 1 : 0
  
  // Y軸の最大値を計算（左軸・右軸それぞれ）
  const { leftAxisMax, rightAxisMax } = useMemo(() => {
    let leftMax = 0
    let rightMax = 0
    
    seriesKeys.forEach((key, idx) => {
      const colIndex = seriesColumnIndices[idx]
      const isRightAxis = yAxisRightColumns.includes(colIndex)
      const maxValue = Math.max(...data.map(d => {
        const val = d[key]
        return typeof val === 'number' ? val : 0
      }))
      
      if (isRightAxis) {
        rightMax = Math.max(rightMax, maxValue)
      } else {
        leftMax = Math.max(leftMax, maxValue)
      }
    })
    
    return { leftAxisMax: leftMax, rightAxisMax: rightMax }
  }, [data, seriesKeys, seriesColumnIndices, yAxisRightColumns])
  
  const smallFontSize = Math.round(baseFontSize * 0.75)
  const isLight = isLightBackground(backgroundColor)
  
  // 背景色計算
  const chartBgColor = (() => {
    const match = backgroundColor?.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
    if (match) {
      const [, , c, h] = match
      const targetL = isLight ? 0.95 : 0.3
      const targetC = Math.min(parseFloat(c), 0.02)
      return `oklch(${targetL} ${targetC} ${h})`
    }
    return isLight ? '#f2f2f2' : '#4d4d4d'
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
  
  // 共通のグリッド設定
  const getGrid = () => ({
    left: baseFontSize * 3,
    right: showLegend ? baseFontSize * 6 : baseFontSize * 1.5,
    top: baseFontSize * 2.5,
    bottom: baseFontSize * 1.5,
    containLabel: true,
  })
  
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
  const getLegend = () => showLegend ? {
    show: true,
    orient: 'vertical' as const,
    right: 10,
    top: baseFontSize * 2.5,
    textStyle: {
      fontSize: smallFontSize,
      color: textColor,
    },
  } : { show: false }
  
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
  
  // 共通のY軸設定（日経スタイル: 三角マーカー付き）
  const getYAxis = (unit?: string, isRight = false, dataMax?: number) => ({
    type: 'value' as const,
    position: isRight ? 'right' as const : 'left' as const,
    axisLabel: {
      formatter: (value: number) => {
        const marker = isRight ? `◂${value}` : `${value}▸`
        // 最上部（データ最大値以上）の場合のみ単位を下に追加
        if (unit && dataMax !== undefined && value >= dataMax) {
          return `{value|${marker}}\n{unit|${unit}}`
        }
        return `{value|${marker}}`
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
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: showGrid ? { lineStyle: { color: gridColor, type: 'dashed' as const } } : { show: false },
  })
  
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
  const getOption = (): EChartsOption => {
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
            ? [getYAxis(yAxisUnit, false, leftAxisMax), getYAxis(yAxisRightUnit, true, rightAxisMax)]
            : getYAxis(yAxisUnit, false, leftAxisMax),
          series: seriesKeys.map((key, idx) => {
            const seriesData = data.map(d => d[key])
            const color = colors[idx % colors.length]
            return {
              name: key,
              type: 'line' as const,
              data: seriesData,
              yAxisIndex: hasDualAxis ? getYAxisIndex(seriesColumnIndices[idx]) : 0,
              smooth: true,
              symbol: 'none',
              symbolSize: 8,
              lineStyle: { width: 2, color },
              itemStyle: { color },
              label: showDataLabels ? {
                show: true,
                position: 'top',
                fontSize: smallFontSize,
                color: textColor,
              } : { show: false },
              markPoint: getLineLabel(key, seriesData, color),
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
            ? [getYAxis(yAxisUnit, false, leftAxisMax), getYAxis(yAxisRightUnit, true, rightAxisMax)]
            : getYAxis(yAxisUnit, false, leftAxisMax),
          series: seriesKeys.map((key, idx) => {
            const seriesData = data.map(d => d[key])
            const color = colors[idx % colors.length]
            return {
              name: key,
              type: 'line' as const,
              data: seriesData,
              yAxisIndex: hasDualAxis ? getYAxisIndex(seriesColumnIndices[idx]) : 0,
              smooth: true,
              symbol: 'none',
              areaStyle: { opacity: 0.3 },
              lineStyle: { width: 2, color },
              itemStyle: { color },
              label: showDataLabels ? {
                show: true,
                position: 'top',
                fontSize: smallFontSize,
                color: textColor,
              } : { show: false },
              markPoint: getLineLabel(key, seriesData, color),
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
            ? [getYAxis(yAxisUnit, false, leftAxisMax), getYAxis(yAxisRightUnit, true, rightAxisMax)]
            : getYAxis(yAxisUnit, false, leftAxisMax),
          series: seriesKeys.map((key, idx) => ({
            name: key,
            type: 'bar' as const,
            data: data.map(d => d[key]),
            yAxisIndex: hasDualAxis ? getYAxisIndex(seriesColumnIndices[idx]) : 0,
            itemStyle: { 
              color: colors[idx % colors.length],
              borderRadius: [4, 4, 0, 0],
            },
            label: showDataLabels ? {
              show: true,
              position: 'top',
              fontSize: smallFontSize,
              color: textColor,
            } : { show: false },
          })),
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
          series: seriesKeys.map((key, idx) => ({
            name: key,
            type: 'bar' as const,
            data: data.map(d => d[key]),
            stack: stacked !== 'off' ? 'total' : undefined,
            itemStyle: { 
              color: colors[idx % colors.length],
              borderRadius: [0, 4, 4, 0],
            },
            label: showDataLabels ? {
              show: true,
              position: 'right',
              fontSize: smallFontSize,
              color: textColor,
            } : { show: false },
          })),
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
            ...getYAxis(yAxisUnit, false, leftAxisMax),
            max: stacked === 'percent' ? 100 : undefined,
          },
          series: seriesKeys.map((key, idx) => ({
            name: key,
            type: 'bar' as const,
            data: data.map(d => d[key]),
            stack: 'total',
            itemStyle: { color: colors[idx % colors.length] },
            label: showDataLabels ? {
              show: true,
              position: 'inside',
              fontSize: smallFontSize,
              color: '#fff',
            } : { show: false },
          })),
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
            ? [getYAxis(yAxisUnit, false, leftAxisMax), getYAxis(yAxisRightUnit, true, rightAxisMax)]
            : getYAxis(yAxisUnit, false, leftAxisMax),
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
                smooth: true,
                symbol: 'none',
                symbolSize: 8,
                lineStyle: { width: 2, color },
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
          yAxis: getYAxis(yAxisUnit, false, leftAxisMax),
          series: seriesKeys.map((key, idx) => ({
            name: key,
            type: 'scatter' as const,
            data: data.map((d, i) => [categoryData[i], d[key]]),
            symbolSize: 16,
            itemStyle: { color: colors[idx % colors.length] },
            label: showDataLabels ? {
              show: true,
              position: 'top',
              fontSize: smallFontSize,
              color: textColor,
              formatter: (params: { value: [string, number] }) => String(params.value[1]),
            } : { show: false },
          })),
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
            ...getYAxis(yAxisUnit, false, leftAxisMax),
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
          const value: number = typeof entry[seriesKeys[0]] === 'number' ? entry[seriesKeys[0]] : 0
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
          yAxis: getYAxis(yAxisUnit, false, leftAxisMax),
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
          yAxis: getYAxis(yAxisUnit, false, leftAxisMax),
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
          yAxis: getYAxis(yAxisUnit, false, leftAxisMax),
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
            const value = typeof entry[seriesKeys[1]] === 'number' ? entry[seriesKeys[1]] : 1
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
              lineStyle: { width: 3, color },
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
  
  const option = useMemo(() => getOption(), [displayFormat, data, seriesKeys, colors, showGrid, showLegend, showDataLabels, yAxisUnit, yAxisRightUnit, hasDualAxis, stacked, baseFontSize, smallFontSize, textColor, gridColor, chartBgColor, table.name, xAxisDateFormat, categoryData, seriesColumnIndices, barColumns, lineColumns, chartConfig, leftAxisMax, rightAxisMax])
  
  return (
    <ReactECharts
      option={option}
      style={{ width, height }}
      opts={{ renderer: 'svg' }}
      notMerge={true}
    />
  )
}
