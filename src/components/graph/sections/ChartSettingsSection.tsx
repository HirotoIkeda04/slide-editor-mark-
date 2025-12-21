/**
 * ChartSettingsSection - グラフ設定セクション
 * 
 * 積み上げ、エラーバー、回帰直線などのグラフタイプ固有の設定
 */

import { useMemo } from 'react'
import type { TableItem, TableDisplayFormat, TableChartConfig, StackedMode, ErrorBarType } from '../../../types'
import { hasChartSetting } from '../../../constants/graphConfigs'

interface ChartSettingsSectionProps {
  displayFormat: TableDisplayFormat
  chartConfig: TableChartConfig
  table: TableItem
  onConfigChange: (updates: Partial<TableChartConfig>) => void
}

export const ChartSettingsSection = ({
  displayFormat,
  chartConfig,
  table,
  onConfigChange,
}: ChartSettingsSectionProps) => {
  // Y軸に選択された列を取得（右Y軸選択用）
  const yAxisColumnOptions = useMemo(() => {
    const yAxisColumns = chartConfig.yAxisColumns || []
    const headers = table.headers || []
    const firstRow = table.data[0] || []
    
    return yAxisColumns.map(colIndex => ({
      value: colIndex,
      label: headers[colIndex] || firstRow[colIndex] || `列 ${colIndex + 1}`,
    }))
  }, [chartConfig.yAxisColumns, table.headers, table.data])
  
  // 列オプション（エラーバー用）
  const allColumnOptions = useMemo(() => {
    const firstRow = table.data[0] || []
    const headers = table.headers || []
    
    return firstRow.map((_, index) => ({
      value: index,
      label: headers[index] || firstRow[index] || `列 ${index + 1}`,
    }))
  }, [table.data, table.headers])
  
  // 積み上げ設定
  const renderStackedSetting = () => {
    if (!hasChartSetting(displayFormat, 'stacked')) return null
    
    const stacked = chartConfig.stacked || 'off'
    
    const handleChange = (value: StackedMode) => {
      onConfigChange({ stacked: value })
    }
    
    return (
      <div className="graph-form-group">
        <label className="graph-form-label">積み上げ</label>
        <div className="graph-radio-group">
          <button
            className={`graph-radio-btn ${stacked === 'off' ? 'active' : ''}`}
            onClick={() => handleChange('off')}
            type="button"
          >
            OFF
          </button>
          <button
            className={`graph-radio-btn ${stacked === 'on' ? 'active' : ''}`}
            onClick={() => handleChange('on')}
            type="button"
          >
            ON
          </button>
          <button
            className={`graph-radio-btn ${stacked === 'percent' ? 'active' : ''}`}
            onClick={() => handleChange('percent')}
            type="button"
          >
            100%
          </button>
        </div>
      </div>
    )
  }
  
  // 積み上げモード設定（積み上げ棒グラフ用）
  const renderStackedModeSetting = () => {
    if (!hasChartSetting(displayFormat, 'stackedMode')) return null
    
    const stacked = chartConfig.stacked || 'on'
    
    return (
      <div className="graph-form-group">
        <label className="graph-form-label">積み上げモード</label>
        <div className="graph-radio-group">
          <button
            className={`graph-radio-btn ${stacked === 'on' ? 'active' : ''}`}
            onClick={() => onConfigChange({ stacked: 'on' })}
            type="button"
          >
            通常
          </button>
          <button
            className={`graph-radio-btn ${stacked === 'percent' ? 'active' : ''}`}
            onClick={() => onConfigChange({ stacked: 'percent' })}
            type="button"
          >
            100%
          </button>
        </div>
      </div>
    )
  }
  
  // 右Y軸設定
  const renderRightYAxisSetting = () => {
    if (!hasChartSetting(displayFormat, 'rightYAxis')) return null
    
    const rightYAxis = chartConfig.rightYAxis
    
    return (
      <div className="graph-form-group">
        <label className="graph-form-label">右Y軸</label>
        <select
          className="graph-form-select"
          value={rightYAxis ?? ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value, 10) : undefined
            onConfigChange({ rightYAxis: value })
          }}
        >
          <option value="">なし</option>
          {yAxisColumnOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  
  // エラーバー設定
  const renderErrorBarSetting = () => {
    if (!hasChartSetting(displayFormat, 'errorBar')) return null
    
    const errorBar = chartConfig.errorBar || 'none'
    const errorBarColumn = chartConfig.errorBarColumn
    
    return (
      <div className="graph-form-group">
        <label className="graph-form-label">エラーバー</label>
        <select
          className="graph-form-select"
          value={errorBar}
          onChange={(e) => onConfigChange({ errorBar: e.target.value as ErrorBarType })}
        >
          <option value="none">なし</option>
          <option value="column">列を指定</option>
          <option value="stddev">標準偏差</option>
          <option value="ci95">信頼区間95%</option>
        </select>
        
        {errorBar === 'column' && (
          <select
            className="graph-form-select"
            value={errorBarColumn ?? ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value, 10) : undefined
              onConfigChange({ errorBarColumn: value })
            }}
            style={{ marginTop: '0.5rem' }}
          >
            <option value="">エラー値の列を選択</option>
            {allColumnOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }
  
  // 回帰直線設定（散布図用）
  const renderRegressionSetting = () => {
    if (!hasChartSetting(displayFormat, 'regression')) return null
    
    const showRegression = chartConfig.showRegression ?? false
    const showR2 = chartConfig.showR2 ?? false
    
    return (
      <>
        <div className="graph-toggle-row">
          <span className="graph-toggle-label">回帰直線</span>
          <button
            className={`graph-toggle ${showRegression ? 'active' : ''}`}
            onClick={() => onConfigChange({ showRegression: !showRegression })}
            type="button"
            aria-pressed={showRegression}
          />
        </div>
        
        <div className="graph-toggle-row">
          <span className="graph-toggle-label">R²表示</span>
          <button
            className={`graph-toggle ${showR2 ? 'active' : ''}`}
            onClick={() => onConfigChange({ showR2: !showR2 })}
            type="button"
            aria-pressed={showR2}
            disabled={!showRegression}
            style={{ opacity: showRegression ? 1 : 0.5 }}
          />
        </div>
      </>
    )
  }
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">グラフ設定</div>
      
      {renderStackedSetting()}
      {renderStackedModeSetting()}
      {renderRightYAxisSetting()}
      {renderErrorBarSetting()}
      {renderRegressionSetting()}
    </div>
  )
}
