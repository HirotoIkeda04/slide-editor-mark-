/**
 * ColorSection - カラー設定セクション
 * 
 * トーン連動 or カスタムカラーの選択
 * カスタム時は系列ごとのカラーピッカー表示
 */

import { useMemo } from 'react'
import type { TableItem, TableChartConfig, ColorMode } from '../../../types'

interface ColorSectionProps {
  table: TableItem
  chartConfig: TableChartConfig
  onConfigChange: (updates: Partial<TableChartConfig>) => void
}

export const ColorSection = ({
  table,
  chartConfig,
  onConfigChange,
}: ColorSectionProps) => {
  const colorMode = chartConfig.colorMode || 'tone'
  const customColors = chartConfig.customColors || {}
  
  // 系列（Y軸列）を取得
  const seriesColumns = useMemo(() => {
    const yAxisColumns = chartConfig.yAxisColumns || []
    const headers = table.headers || []
    const firstRow = table.data[0] || []
    
    // Y軸列が指定されていない場合は、X軸以外のすべての列
    const columns = yAxisColumns.length > 0
      ? yAxisColumns
      : firstRow.map((_, i) => i).filter(i => i !== (chartConfig.xAxisColumn ?? 0))
    
    return columns.map(colIndex => ({
      index: colIndex,
      label: headers[colIndex] || firstRow[colIndex] || `列 ${colIndex + 1}`,
    }))
  }, [chartConfig.yAxisColumns, chartConfig.xAxisColumn, table.headers, table.data])
  
  // デフォルトカラー（トーンに応じた色）
  const defaultColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]
  
  const handleColorModeChange = (mode: ColorMode) => {
    onConfigChange({ colorMode: mode })
  }
  
  const handleColorChange = (columnIndex: number, color: string) => {
    onConfigChange({
      customColors: {
        ...customColors,
        [columnIndex]: color,
      },
    })
  }
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">カラー</div>
      
      {/* モード選択 */}
      <div className="graph-radio-group" style={{ marginBottom: '0.75rem' }}>
        <button
          className={`graph-radio-btn ${colorMode === 'tone' ? 'active' : ''}`}
          onClick={() => handleColorModeChange('tone')}
          type="button"
          style={{ borderRadius: '4px 0 0 4px' }}
        >
          トーン連動
        </button>
        <button
          className={`graph-radio-btn ${colorMode === 'custom' ? 'active' : ''}`}
          onClick={() => handleColorModeChange('custom')}
          type="button"
          style={{ borderRadius: '0 4px 4px 0' }}
        >
          カスタム
        </button>
      </div>
      
      {/* カスタムカラー設定 */}
      {colorMode === 'custom' && seriesColumns.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {seriesColumns.map((series, idx) => (
            <div key={series.index} className="graph-color-row">
              <span className="graph-color-label">
                系列{idx + 1} ({series.label})
              </span>
              <input
                type="color"
                className="graph-color-picker"
                value={customColors[series.index] || defaultColors[idx % defaultColors.length]}
                onChange={(e) => handleColorChange(series.index, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* トーン連動時の説明 */}
      {colorMode === 'tone' && (
        <div style={{ fontSize: '0.625rem', color: 'var(--app-text-disabled)' }}>
          現在のTone & Mannerに応じた配色が自動適用されます
        </div>
      )}
    </div>
  )
}
