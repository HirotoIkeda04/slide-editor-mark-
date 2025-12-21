/**
 * DataSection - データ設定セクション
 * 
 * グラフタイプに応じたデータ列選択UIを表示
 * パターンA〜Iに対応
 */

import { useMemo } from 'react'
import type { TableItem, TableDisplayFormat, TableChartConfig } from '../../../types'
import { getDataPattern } from '../../../constants/graphConfigs'

interface DataSectionProps {
  table: TableItem
  displayFormat: TableDisplayFormat
  chartConfig: TableChartConfig
  onConfigChange: (updates: Partial<TableChartConfig>) => void
}

export const DataSection = ({
  table,
  displayFormat,
  chartConfig,
  onConfigChange,
}: DataSectionProps) => {
  const dataPattern = getDataPattern(displayFormat)
  
  // 列オプションを生成（ヘッダーがあればヘッダー名、なければ列番号）
  const columnOptions = useMemo(() => {
    const firstRow = table.data[0] || []
    const headers = table.headers || []
    
    return firstRow.map((_, index) => {
      const label = headers[index] || firstRow[index] || `列 ${index + 1}`
      return { value: index, label }
    })
  }, [table.data, table.headers])
  
  if (!dataPattern) return null
  
  // ドロップダウンレンダリング
  const renderDropdown = (
    field: { key: string; label: string; required: boolean; description?: string },
    value: number | undefined
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = parseInt(e.target.value, 10)
      onConfigChange({ [field.key]: isNaN(newValue) ? undefined : newValue })
    }
    
    return (
      <div className="graph-form-group" key={field.key}>
        <label className="graph-form-label">
          {field.label}
          {!field.required && <span style={{ opacity: 0.6, marginLeft: '0.25rem' }}>(任意)</span>}
        </label>
        <select
          className="graph-form-select"
          value={value ?? ''}
          onChange={handleChange}
        >
          <option value="">選択してください</option>
          {columnOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.description && (
          <div style={{ fontSize: '0.625rem', color: 'var(--app-text-disabled)', marginTop: '0.25rem' }}>
            {field.description}
          </div>
        )}
      </div>
    )
  }
  
  // チェックボックス群レンダリング
  const renderCheckboxes = (
    field: { key: string; label: string },
    values: number[] | undefined
  ) => {
    const selectedValues = values || []
    
    const handleChange = (columnIndex: number, checked: boolean) => {
      const newValues = checked
        ? [...selectedValues, columnIndex]
        : selectedValues.filter(v => v !== columnIndex)
      onConfigChange({ [field.key]: newValues })
    }
    
    return (
      <div className="graph-form-group" key={field.key}>
        <label className="graph-form-label">{field.label}</label>
        <div className="graph-checkbox-group">
          {columnOptions.map(opt => (
            <label key={opt.value} className="graph-checkbox-item">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={(e) => handleChange(opt.value, e.target.checked)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    )
  }
  
  // フィールドの値を取得
  const getFieldValue = (key: string): number | number[] | undefined => {
    switch (key) {
      case 'xAxisColumn':
        return chartConfig.xAxisColumn
      case 'yAxisColumns':
        return chartConfig.yAxisColumns
      case 'sizeColumn':
        return chartConfig.sizeColumn
      case 'dateColumn':
        return chartConfig.dateColumn
      case 'openColumn':
        return chartConfig.openColumn
      case 'highColumn':
        return chartConfig.highColumn
      case 'lowColumn':
        return chartConfig.lowColumn
      case 'closeColumn':
        return chartConfig.closeColumn
      case 'rowLabelColumn':
        return chartConfig.rowLabelColumn
      case 'colLabelColumn':
        return chartConfig.colLabelColumn
      case 'valueColumn':
        return chartConfig.valueColumn
      case 'fromColumn':
        return chartConfig.fromColumn
      case 'toColumn':
        return chartConfig.toColumn
      case 'typeColumn':
        return chartConfig.typeColumn
      case 'groupColumn':
        return chartConfig.groupColumn
      case 'barColumns':
        return chartConfig.barColumns
      case 'lineColumns':
        return chartConfig.lineColumns
      default:
        return undefined
    }
  }
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">データ</div>
      
      {dataPattern.fields.map(field => {
        const value = getFieldValue(field.key)
        
        if (field.type === 'dropdown') {
          return renderDropdown(field, value as number | undefined)
        } else if (field.type === 'checkboxes') {
          return renderCheckboxes(field, value as number[] | undefined)
        }
        
        return null
      })}
    </div>
  )
}
