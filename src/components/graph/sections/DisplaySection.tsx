/**
 * DisplaySection - 表示設定セクション
 * 
 * 凡例、グリッド、データラベルの表示設定
 */

import type { TableChartConfig, LegendPosition } from '../../../types'

interface DisplaySectionProps {
  chartConfig: TableChartConfig
  onConfigChange: (updates: Partial<TableChartConfig>) => void
}

const legendPositions: { value: LegendPosition; label: string }[] = [
  { value: 'top', label: '上' },
  { value: 'bottom', label: '下' },
  { value: 'left', label: '左' },
  { value: 'right', label: '右' },
  { value: 'inside', label: '内' },
]

const legendTypes: { value: 'legend' | 'annotation'; label: string }[] = [
  { value: 'legend', label: '凡例' },
  { value: 'annotation', label: '線上ラベル' },
]

export const DisplaySection = ({
  chartConfig,
  onConfigChange,
}: DisplaySectionProps) => {
  const showLegend = chartConfig.showLegend ?? true
  const legendPosition = chartConfig.legendPosition || 'top'
  const legendType = chartConfig.legendType || 'legend'
  const showGrid = chartConfig.showGrid ?? true
  const showDataLabels = chartConfig.showDataLabels ?? false
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">表示</div>
      
      {/* 凡例 */}
      <div className="graph-toggle-row">
        <span className="graph-toggle-label">凡例</span>
        <button
          className={`graph-toggle ${showLegend ? 'active' : ''}`}
          onClick={() => onConfigChange({ showLegend: !showLegend })}
          type="button"
          aria-pressed={showLegend}
        />
      </div>
      
      {/* 凡例タイプ（凡例ONの場合のみ表示） */}
      {showLegend && (
        <div className="graph-form-group" style={{ marginTop: '0.5rem' }}>
          <label className="graph-form-label">凡例タイプ</label>
          <div className="graph-legend-position">
            {legendTypes.map(type => (
              <button
                key={type.value}
                className={`graph-legend-position-btn ${legendType === type.value ? 'active' : ''}`}
                onClick={() => onConfigChange({ legendType: type.value })}
                type="button"
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 凡例位置（凡例ONかつ通常凡例の場合のみ表示） */}
      {showLegend && legendType === 'legend' && (
        <div className="graph-form-group" style={{ marginTop: '0.5rem' }}>
          <label className="graph-form-label">凡例位置</label>
          <div className="graph-legend-position">
            {legendPositions.map(pos => (
              <button
                key={pos.value}
                className={`graph-legend-position-btn ${legendPosition === pos.value ? 'active' : ''}`}
                onClick={() => onConfigChange({ legendPosition: pos.value })}
                type="button"
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* グリッド */}
      <div className="graph-toggle-row">
        <span className="graph-toggle-label">グリッド</span>
        <button
          className={`graph-toggle ${showGrid ? 'active' : ''}`}
          onClick={() => onConfigChange({ showGrid: !showGrid })}
          type="button"
          aria-pressed={showGrid}
        />
      </div>
      
      {/* データラベル */}
      <div className="graph-toggle-row">
        <span className="graph-toggle-label">ラベル</span>
        <button
          className={`graph-toggle ${showDataLabels ? 'active' : ''}`}
          onClick={() => onConfigChange({ showDataLabels: !showDataLabels })}
          type="button"
          aria-pressed={showDataLabels}
        />
      </div>
    </div>
  )
}
