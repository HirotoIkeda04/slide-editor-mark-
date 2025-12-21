/**
 * AxisSection - 軸設定セクション
 * 
 * Y軸範囲（自動/カスタム）と対数軸の設定
 * Phase 2: 系列ごとの表示タイプ選択、Z軸設定
 */

import { useCallback, useMemo } from 'react'
import type { TableChartConfig, YAxisRangeMode, SeriesConfig, SeriesDisplayType, ZAxisUsage, TableItem } from '../../../types'

interface AxisSectionProps {
  chartConfig: TableChartConfig
  onConfigChange: (updates: Partial<TableChartConfig>) => void
  table?: TableItem  // 列情報を取得するため
  showSeriesConfig?: boolean  // 系列設定を表示するか
  showZAxis?: boolean  // Z軸設定を表示するか
  zAxisUsages?: ZAxisUsage[]  // 利用可能なZ軸の用途
}

export const AxisSection = ({
  chartConfig,
  onConfigChange,
  table,
  showSeriesConfig = false,
  showZAxis = false,
  zAxisUsages = [],
}: AxisSectionProps) => {
  const yAxisRange = chartConfig.yAxisRange || 'auto'
  const yAxisMin = chartConfig.yAxisMin
  const yAxisMax = chartConfig.yAxisMax
  const yAxisUnit = chartConfig.yAxisUnit || ''
  const yAxisRightUnit = chartConfig.yAxisRightUnit || ''
  const logScale = chartConfig.logScale ?? false
  const seriesConfigs = chartConfig.seriesConfigs || []
  const zColumn = chartConfig.zColumn
  const zUsage = chartConfig.zUsage
  
  // 列オプションを生成
  const columnOptions = useMemo(() => {
    if (!table) return []
    const firstRow = table.data[0] || []
    const headers = table.headers || []
    
    return firstRow.map((_, index) => {
      const label = headers[index] || firstRow[index] || `列 ${index + 1}`
      return { value: index, label }
    })
  }, [table])
  
  // Y軸に設定されている列を取得
  const yAxisColumns = chartConfig.yAxisColumns || []
  
  // 系列設定を更新
  const handleSeriesConfigChange = useCallback((columnIndex: number, updates: Partial<SeriesConfig>) => {
    const existingIndex = seriesConfigs.findIndex(sc => sc.column === columnIndex)
    let newConfigs: SeriesConfig[]
    
    if (existingIndex >= 0) {
      newConfigs = seriesConfigs.map((sc, i) =>
        i === existingIndex ? { ...sc, ...updates } : sc
      )
    } else {
      // 新しい設定を作成
      const newConfig: SeriesConfig = {
        id: crypto.randomUUID(),
        column: columnIndex,
        displayType: 'bar',
        showLabel: false,
        yAxisIndex: 0,
        ...updates,
      }
      newConfigs = [...seriesConfigs, newConfig]
    }
    
    onConfigChange({ seriesConfigs: newConfigs })
  }, [seriesConfigs, onConfigChange])
  
  // 系列の設定を取得（なければデフォルト値）
  const getSeriesConfig = useCallback((columnIndex: number): SeriesConfig => {
    const existing = seriesConfigs.find(sc => sc.column === columnIndex)
    return existing || {
      id: `default-${columnIndex}`,
      column: columnIndex,
      displayType: 'bar',
      showLabel: false,
      yAxisIndex: 0,
    }
  }, [seriesConfigs])
  
  // 列の名前を取得
  const getColumnName = useCallback((columnIndex: number): string => {
    const opt = columnOptions.find(o => o.value === columnIndex)
    return opt?.label || `列 ${columnIndex + 1}`
  }, [columnOptions])
  
  const handleRangeChange = (mode: YAxisRangeMode) => {
    onConfigChange({ yAxisRange: mode })
    
    // カスタムからオートに変更した場合、min/maxをクリア
    if (mode === 'auto') {
      onConfigChange({ yAxisMin: undefined, yAxisMax: undefined })
    }
  }
  
  const handleMinChange = (value: string) => {
    const num = parseFloat(value)
    onConfigChange({ yAxisMin: isNaN(num) ? undefined : num })
  }
  
  const handleMaxChange = (value: string) => {
    const num = parseFloat(value)
    onConfigChange({ yAxisMax: isNaN(num) ? undefined : num })
  }
  
  // 系列をY2軸に移動/解除
  const handleToggleY2Axis = useCallback((columnIndex: number) => {
    const currentYAxisRight = chartConfig.yAxisRightColumns || []
    const isOnY2 = currentYAxisRight.includes(columnIndex)
    
    const newYAxisRight = isOnY2
      ? currentYAxisRight.filter(c => c !== columnIndex)
      : [...currentYAxisRight, columnIndex]
    
    onConfigChange({ yAxisRightColumns: newYAxisRight })
  }, [chartConfig.yAxisRightColumns, onConfigChange])
  
  const isOnY2Axis = useCallback((columnIndex: number): boolean => {
    return (chartConfig.yAxisRightColumns || []).includes(columnIndex)
  }, [chartConfig.yAxisRightColumns])
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">軸</div>
      
      {/* 系列設定（Phase 2） */}
      {showSeriesConfig && yAxisColumns.length > 0 && (
        <div className="graph-form-group">
          <label className="graph-form-label">Y軸系列</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {yAxisColumns.map(colIndex => {
              const config = getSeriesConfig(colIndex)
              const onY2 = isOnY2Axis(colIndex)
              
              return (
                <div
                  key={colIndex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    backgroundColor: 'var(--app-bg-tertiary)',
                    borderRadius: 4,
                    border: `2px solid ${onY2 ? '#f97316' : '#10b981'}`,
                  }}
                >
                  {/* 系列名 */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--app-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {getColumnName(colIndex)}
                  </span>
                  
                  {/* 表示タイプ選択 */}
                  <select
                    value={config.displayType}
                    onChange={(e) => handleSeriesConfigChange(colIndex, {
                      displayType: e.target.value as SeriesDisplayType,
                    })}
                    style={{
                      fontSize: 11,
                      padding: '2px 4px',
                      border: '1px solid var(--app-border-light)',
                      borderRadius: 3,
                      backgroundColor: 'var(--app-bg-secondary)',
                      color: 'var(--app-text-primary)',
                    }}
                  >
                    <option value="bar">棒</option>
                    <option value="line">線</option>
                    <option value="area">面</option>
                  </select>
                  
                  {/* Y2軸トグル */}
                  <button
                    type="button"
                    onClick={() => handleToggleY2Axis(colIndex)}
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      border: 'none',
                      borderRadius: 3,
                      backgroundColor: onY2 ? '#f97316' : 'var(--app-bg-secondary)',
                      color: onY2 ? '#fff' : 'var(--app-text-secondary)',
                      cursor: 'pointer',
                    }}
                    title={onY2 ? '左Y軸に移動' : '右Y軸に移動'}
                  >
                    {onY2 ? 'Y2' : 'Y1'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Z軸設定（Phase 2） */}
      {showZAxis && zAxisUsages.length > 0 && (
        <div className="graph-form-group">
          <label className="graph-form-label">
            Z（{zAxisUsages.map(u => u === 'size' ? 'サイズ' : u === 'color' ? '色' : 'グループ').join('/')}）
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="graph-form-select"
              value={zColumn ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                onConfigChange({ zColumn: isNaN(val) ? undefined : val })
              }}
              style={{ flex: 1 }}
            >
              <option value="">未設定</option>
              {columnOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            
            {zColumn !== undefined && zAxisUsages.length > 1 && (
              <select
                className="graph-form-select"
                value={zUsage || zAxisUsages[0]}
                onChange={(e) => onConfigChange({ zUsage: e.target.value as ZAxisUsage })}
                style={{ width: 80 }}
              >
                {zAxisUsages.map(u => (
                  <option key={u} value={u}>
                    {u === 'size' ? 'サイズ' : u === 'color' ? '色' : 'グループ'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
      
      {/* Y軸範囲 */}
      <div className="graph-form-group">
        <label className="graph-form-label">Y軸範囲</label>
        <select
          className="graph-form-select"
          value={yAxisRange}
          onChange={(e) => handleRangeChange(e.target.value as YAxisRangeMode)}
        >
          <option value="auto">自動</option>
          <option value="custom">カスタム</option>
        </select>
        
        {/* カスタム範囲入力 */}
        {yAxisRange === 'custom' && (
          <div className="graph-range-inputs" style={{ marginTop: '0.5rem' }}>
            <input
              type="number"
              className="graph-range-input"
              placeholder="最小"
              value={yAxisMin ?? ''}
              onChange={(e) => handleMinChange(e.target.value)}
            />
            <span className="graph-range-separator">〜</span>
            <input
              type="number"
              className="graph-range-input"
              placeholder="最大"
              value={yAxisMax ?? ''}
              onChange={(e) => handleMaxChange(e.target.value)}
            />
          </div>
        )}
      </div>
      
      {/* Y軸単位 */}
      <div className="graph-form-group">
        <label className="graph-form-label">Y軸単位（左）</label>
        <input
          type="text"
          className="graph-form-input"
          placeholder="例: 円, %, kg"
          value={yAxisUnit}
          onChange={(e) => onConfigChange({ yAxisUnit: e.target.value })}
        />
      </div>
      
      {/* Y2軸単位（右Y軸に列がある場合のみ） */}
      {(chartConfig.yAxisRightColumns?.length ?? 0) > 0 && (
        <div className="graph-form-group">
          <label className="graph-form-label">Y軸単位（右）</label>
          <input
            type="text"
            className="graph-form-input"
            placeholder="例: %, 倍"
            value={yAxisRightUnit}
            onChange={(e) => onConfigChange({ yAxisRightUnit: e.target.value })}
          />
        </div>
      )}
      
      {/* 対数軸 */}
      <div className="graph-toggle-row">
        <span className="graph-toggle-label">対数軸</span>
        <button
          className={`graph-toggle ${logScale ? 'active' : ''}`}
          onClick={() => onConfigChange({ logScale: !logScale })}
          type="button"
          aria-pressed={logScale}
        />
      </div>
    </div>
  )
}
