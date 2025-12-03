import { useMemo } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { TableItem, Tone } from '../../types'

interface TableChartProps {
  table: TableItem
  tone?: Tone
  width?: number
  height?: number
}

// トーンに応じた色パレット
const toneColors: Record<Tone, string[]> = {
  simple: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  casual: ['#25b7c0', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  luxury: ['#C9A962', '#8B7355', '#B8860B', '#DAA520', '#D4AF37', '#FFD700'],
  warm: ['#E07A5F', '#F2CC8F', '#81B29A', '#3D405B', '#F4A261', '#E76F51'],
}

// テーブルデータをチャート用データに変換
const convertTableToChartData = (
  table: TableItem
): { data: Array<Record<string, string | number>>; seriesKeys: string[] } => {
  const { data, headers, chartConfig, hiddenRows = [], hiddenColumns = [] } = table
  const xAxisColumn = chartConfig?.xAxisColumn ?? 0
  
  // 非表示列を除外したY軸列インデックスを計算
  const allColumns = Array.from({ length: (data[0]?.length ?? 1) }, (_, i) => i)
  const visibleColumns = allColumns.filter(col => !hiddenColumns.includes(col))
  
  // X軸列が非表示の場合は最初の表示列を使用
  const effectiveXAxisColumn = hiddenColumns.includes(xAxisColumn) 
    ? visibleColumns[0] ?? 0 
    : xAxisColumn
  
  const yAxisColumns = chartConfig?.yAxisColumns?.filter(col => !hiddenColumns.includes(col)) ?? 
    visibleColumns.filter(col => col !== effectiveXAxisColumn)
  
  // ヘッダーからシリーズ名を取得
  const getSeriesName = (colIndex: number): string => {
    if (headers && headers[colIndex]) {
      return headers[colIndex]
    }
    // ヘッダーがない場合、最初の行をヘッダーとして使用
    if (data[0] && data[0][colIndex]) {
      return data[0][colIndex]
    }
    return `Series ${colIndex}`
  }
  
  const seriesKeys = yAxisColumns.map(col => getSeriesName(col))
  
  // データ行を変換（ヘッダーがある場合は最初の行から、ない場合は2行目から）
  // 非表示行を除外
  const startRow = headers && headers.length > 0 ? 0 : 1
  const chartData = data
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ rowIndex }) => !hiddenRows.includes(rowIndex))
    .slice(startRow)
    .map(({ row }) => {
      const entry: Record<string, string | number> = {
        name: row[effectiveXAxisColumn] || '',
      }
    
      yAxisColumns.forEach((colIndex, idx) => {
        const value = row[colIndex]
        // 数値に変換を試みる
        const numValue = parseFloat(value?.replace(/[,¥$€£%]/g, '') || '0')
        entry[seriesKeys[idx]] = isNaN(numValue) ? 0 : numValue
      })
    
      return entry
    })
  
  return { data: chartData, seriesKeys }
}

export const TableChart = ({ table, tone = 'simple', width = 600, height = 300 }: TableChartProps) => {
  const displayFormat = table.displayFormat || 'table'
  const showGrid = table.chartConfig?.showGrid ?? true
  const colors = toneColors[tone]
  
  const { data, seriesKeys } = useMemo(() => convertTableToChartData(table), [table])
  
  // テーブル形式の場合は何も表示しない（Markdownで処理される）
  if (displayFormat === 'table') {
    return null
  }
  
  // データがない場合
  if (data.length === 0 || seriesKeys.length === 0) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#888',
        fontSize: '0.875rem',
      }}>
        データがありません
      </div>
    )
  }
  
  const commonProps = {
    width,
    height,
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
  }
  
  const axisStyle = {
    fontSize: 12,
    fill: tone === 'luxury' ? '#C9A962' : tone === 'warm' ? '#3D405B' : '#666',
  }
  
  const gridStyle = {
    strokeDasharray: '3 3',
    stroke: tone === 'luxury' ? '#444' : '#ddd',
  }

  switch (displayFormat) {
    case 'line':
      return (
        <LineChart {...commonProps}>
          {showGrid && <CartesianGrid {...gridStyle} />}
          <XAxis dataKey="name" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip />
          {seriesKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      )
    
    case 'area':
      return (
        <AreaChart {...commonProps}>
          {showGrid && <CartesianGrid {...gridStyle} />}
          <XAxis dataKey="name" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip />
          {seriesKeys.map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              fill={colors[idx % colors.length]}
              fillOpacity={0.3}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      )
    
    case 'bar':
      return (
        <BarChart {...commonProps}>
          {showGrid && <CartesianGrid {...gridStyle} />}
          <XAxis dataKey="name" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip />
          {seriesKeys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[idx % colors.length]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      )
    
    case 'scatter':
      // 散布図は最初の2つのシリーズをX/Y軸として使用
      const xKey = seriesKeys[0] || 'x'
      const yKey = seriesKeys[1] || seriesKeys[0] || 'y'
      return (
        <ScatterChart {...commonProps}>
          {showGrid && <CartesianGrid {...gridStyle} />}
          <XAxis dataKey={xKey} name={xKey} tick={axisStyle} />
          <YAxis dataKey={yKey} name={yKey} tick={axisStyle} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            name={`${xKey} vs ${yKey}`}
            data={data}
            fill={colors[0]}
            isAnimationActive={false}
          />
        </ScatterChart>
      )
    
    default:
      return null
  }
}
