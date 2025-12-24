/**
 * SeriesDetailPanel - 系列詳細パネル
 * 
 * 系列カード展開時に表示される詳細設定
 * タイプ、色、スムージング、エラーバー、削除
 */

import { useCallback } from 'react'
import type { ChartSeries, ChartSeriesType, ErrorBarConfig, ErrorBarType } from '../../../types'
import { DEFAULT_CHART_COLORS } from '../../../utils/chartUtils'

interface SeriesDetailPanelProps {
  series: ChartSeries
  onUpdate: (series: ChartSeries) => void
  onDelete: () => void
}

export const SeriesDetailPanel = ({
  series,
  onUpdate,
  onDelete,
}: SeriesDetailPanelProps) => {
  // タイプ変更
  const handleTypeChange = useCallback((type: ChartSeriesType) => {
    onUpdate({
      ...series,
      type,
      // 線/面の場合はスムージングをデフォルトでON
      smoothing: type !== 'bar' ? (series.smoothing ?? true) : undefined,
    })
  }, [series, onUpdate])
  
  // 色変更
  const handleColorChange = useCallback((color: string) => {
    onUpdate({ ...series, color })
  }, [series, onUpdate])
  
  // スムージングトグル
  const handleSmoothingToggle = useCallback(() => {
    onUpdate({ ...series, smoothing: !series.smoothing })
  }, [series, onUpdate])
  
  // エラーバータイプ変更
  const handleErrorBarChange = useCallback((type: ErrorBarType) => {
    if (type === 'none') {
      onUpdate({ ...series, errorBar: undefined })
    } else {
      onUpdate({
        ...series,
        errorBar: {
          type,
          column: series.errorBar?.column,
        },
      })
    }
  }, [series, onUpdate])
  
  const showSmoothing = series.type === 'line' || series.type === 'area'
  const errorBarType = series.errorBar?.type || 'none'
  
  return (
    <div className="series-detail-panel">
      {/* タイプ選択 */}
      <div className="series-detail-row">
        <span className="series-detail-label">タイプ</span>
        <div className="series-detail-buttons">
          <button
            className={`series-detail-btn ${series.type === 'bar' ? 'active' : ''}`}
            onClick={() => handleTypeChange('bar')}
            type="button"
          >
            棒
          </button>
          <button
            className={`series-detail-btn ${series.type === 'line' ? 'active' : ''}`}
            onClick={() => handleTypeChange('line')}
            type="button"
          >
            線
          </button>
          <button
            className={`series-detail-btn ${series.type === 'area' ? 'active' : ''}`}
            onClick={() => handleTypeChange('area')}
            type="button"
          >
            面
          </button>
        </div>
      </div>
      
      {/* 色選択 */}
      <div className="series-detail-row">
        <span className="series-detail-label">色</span>
        <div className="series-color-buttons">
          {DEFAULT_CHART_COLORS.map((color) => (
            <button
              key={color}
              className={`series-color-btn ${series.color === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
              type="button"
              aria-label={`色: ${color}`}
            />
          ))}
        </div>
      </div>
      
      {/* スムージング（線/面のみ） */}
      {showSmoothing && (
        <div className="series-detail-row">
          <span className="series-detail-label">スムージング</span>
          <button
            className={`series-toggle ${series.smoothing ? 'on' : ''}`}
            onClick={handleSmoothingToggle}
            type="button"
            aria-pressed={series.smoothing}
          >
            <div className="series-toggle-dot" />
          </button>
        </div>
      )}
      
      {/* エラーバー */}
      <div className="series-detail-row">
        <span className="series-detail-label">エラーバー</span>
        <select
          className="series-detail-select"
          value={errorBarType}
          onChange={(e) => handleErrorBarChange(e.target.value as ErrorBarType)}
        >
          <option value="none">なし</option>
          <option value="stddev">標準偏差</option>
          <option value="ci95">信頼区間95%</option>
        </select>
      </div>
      
      {/* 削除ボタン */}
      <button
        className="series-delete-btn"
        onClick={onDelete}
        type="button"
      >
        系列を削除
      </button>
    </div>
  )
}

