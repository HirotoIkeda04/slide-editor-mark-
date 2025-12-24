/**
 * AxisMappingSection - 軸マッピングセクション
 * 
 * X/Y/Y2/Zの各軸にカラムを割り当てるUI
 * ドラッグ&ドロップとクリックで追加可能
 */

import { useCallback, useMemo, useState, DragEvent } from 'react'
import type { TableChartConfig, SeriesDisplayType, ZAxisUsage, TableItem, CellDataType, CellFormat } from '../../../types'

interface AxisMappingProps {
  table: TableItem
  chartConfig: TableChartConfig
  onConfigChange: (updates: Partial<TableChartConfig>) => void
  zAxisUsages?: ZAxisUsage[]
}

interface ColumnInfo {
  index: number
  name: string
  type: CellDataType
}

// 軸タイプの定義
type AxisType = 'x' | 'y' | 'y2' | 'z'

// 軸に割り当てられたカラム
interface AxisColumn {
  columnIndex: number
  displayType?: SeriesDisplayType  // Y軸のみ
}

export const AxisMappingSection = ({
  table,
  chartConfig,
  onConfigChange,
  zAxisUsages = [],
}: AxisMappingProps) => {
  const [dragOverAxis, setDragOverAxis] = useState<AxisType | null>(null)
  
  // カラム情報を生成
  const columns: ColumnInfo[] = useMemo(() => {
    if (!table) return []
    const headers = table.headers || []
    const firstRow = table.data[0] || []
    const cellFormats = table.cellFormats || {}
    
    return firstRow.map((_, index) => {
      const name = headers[index] || firstRow[index] || `列 ${index + 1}`
      // 列の最初のセルからデータ型を取得
      const cellKey = `1-${index}`  // 行1のセル
      const format: CellFormat | undefined = cellFormats[cellKey]
      const type: CellDataType = format?.type || 'text'
      
      return { index, name, type }
    })
  }, [table])
  
  // 現在の軸設定を取得
  const xColumn = chartConfig.xAxisColumn ?? 0
  const yColumns = chartConfig.yAxisColumns || []
  const y2Columns = chartConfig.yAxisRightColumns || []
  const zColumn = chartConfig.zColumn
  const seriesConfigs = chartConfig.seriesConfigs || []
  
  // 使用されていないカラム
  const availableColumns = useMemo(() => {
    const usedIndices = new Set<number>([xColumn])
    yColumns.forEach(c => usedIndices.add(c))
    y2Columns.forEach(c => usedIndices.add(c))
    if (zColumn !== undefined) usedIndices.add(zColumn)
    
    return columns.filter(c => !usedIndices.has(c.index))
  }, [columns, xColumn, yColumns, y2Columns, zColumn])
  
  // カラムの表示タイプを取得
  const getDisplayType = useCallback((columnIndex: number): SeriesDisplayType => {
    const config = seriesConfigs.find(sc => sc.column === columnIndex)
    return config?.displayType || 'bar'
  }, [seriesConfigs])
  
  // 表示タイプを更新
  const setDisplayType = useCallback((columnIndex: number, displayType: SeriesDisplayType) => {
    const existingIndex = seriesConfigs.findIndex(sc => sc.column === columnIndex)
    let newConfigs = [...seriesConfigs]
    
    if (existingIndex >= 0) {
      newConfigs[existingIndex] = { ...newConfigs[existingIndex], displayType }
    } else {
      newConfigs.push({
        id: crypto.randomUUID(),
        column: columnIndex,
        displayType,
        showLabel: false,
        yAxisIndex: 0,
      })
    }
    
    onConfigChange({ seriesConfigs: newConfigs })
  }, [seriesConfigs, onConfigChange])
  
  // カラムを軸に追加
  const addColumnToAxis = useCallback((columnIndex: number, axis: AxisType) => {
    switch (axis) {
      case 'x':
        onConfigChange({ xAxisColumn: columnIndex })
        break
      case 'y':
        if (!yColumns.includes(columnIndex)) {
          onConfigChange({ yAxisColumns: [...yColumns, columnIndex] })
        }
        break
      case 'y2':
        if (!y2Columns.includes(columnIndex)) {
          onConfigChange({ yAxisRightColumns: [...y2Columns, columnIndex] })
        }
        break
      case 'z':
        onConfigChange({ zColumn: columnIndex })
        break
    }
  }, [yColumns, y2Columns, onConfigChange])
  
  // カラムを軸から削除
  const removeColumnFromAxis = useCallback((columnIndex: number, axis: AxisType) => {
    switch (axis) {
      case 'x':
        // X軸は必須なので削除しない
        break
      case 'y':
        onConfigChange({ yAxisColumns: yColumns.filter(c => c !== columnIndex) })
        break
      case 'y2':
        onConfigChange({ yAxisRightColumns: y2Columns.filter(c => c !== columnIndex) })
        break
      case 'z':
        onConfigChange({ zColumn: undefined, zUsage: undefined })
        break
    }
  }, [yColumns, y2Columns, onConfigChange])
  
  // ドラッグ開始
  const handleDragStart = (e: DragEvent, columnIndex: number) => {
    e.dataTransfer.setData('columnIndex', String(columnIndex))
    e.dataTransfer.effectAllowed = 'move'
  }
  
  // ドラッグオーバー
  const handleDragOver = (e: DragEvent, axis: AxisType) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverAxis(axis)
  }
  
  // ドラッグ終了
  const handleDragLeave = () => {
    setDragOverAxis(null)
  }
  
  // ドロップ
  const handleDrop = (e: DragEvent, axis: AxisType) => {
    e.preventDefault()
    const columnIndex = parseInt(e.dataTransfer.getData('columnIndex'), 10)
    if (!isNaN(columnIndex)) {
      addColumnToAxis(columnIndex, axis)
    }
    setDragOverAxis(null)
  }
  
  // データ型のアイコンを取得
  const getTypeIcon = (type: CellDataType): string => {
    switch (type) {
      case 'text': return 'notes'
      case 'number': return 'tag'
      case 'date': return 'calendar_today'
      case 'percentage': return 'percent'
      case 'currency': return 'currency_yen'
      case 'category': return 'sell'
      default: return 'notes'
    }
  }
  
  // カラム名を取得
  const getColumnName = (index: number): string => {
    const col = columns.find(c => c.index === index)
    return col?.name || `列 ${index + 1}`
  }
  
  // カラムのデータ型を取得
  const getColumnType = (index: number): CellDataType => {
    const col = columns.find(c => c.index === index)
    return col?.type || 'text'
  }
  
  // 軸ラベルのレンダリング
  const renderAxisLabel = (axis: AxisType) => {
    const labels = {
      x: { badge: 'X', title: '横軸', subtitle: 'カテゴリ / 時間' },
      y: { badge: 'Y', title: '縦軸（左）', subtitle: '数値' },
      y2: { badge: 'Y2', title: '縦軸（右）', subtitle: '異なる単位' },
      z: { badge: 'Z', title: 'その他', subtitle: 'サイズ / 色 / グループ' },
    }
    const { badge, title, subtitle } = labels[axis]
    const badgeColors = {
      x: '#3b82f6',  // blue
      y: '#10b981',  // green
      y2: '#f97316', // orange
      z: '#8b5cf6',  // purple
    }
    
    return (
      <div className="axis-mapping-label">
        <span className="axis-mapping-badge" style={{ backgroundColor: badgeColors[axis] }}>
          {badge}
        </span>
        <span className="axis-mapping-title">{title}</span>
        <span className="axis-mapping-subtitle">{subtitle}</span>
      </div>
    )
  }
  
  // カラムチップのレンダリング
  const renderColumnChip = (
    columnIndex: number,
    axis: AxisType,
    showDisplayType: boolean = false
  ) => {
    const name = getColumnName(columnIndex)
    const type = getColumnType(columnIndex)
    const displayType = showDisplayType ? getDisplayType(columnIndex) : undefined
    
    return (
      <div key={columnIndex} className="axis-mapping-chip">
        <span className="material-icons axis-mapping-chip-icon">
          {getTypeIcon(type)}
        </span>
        <span className="axis-mapping-chip-name">{name}</span>
        
        {/* Y軸の場合は表示タイプセレクタ */}
        {showDisplayType && (
          <select
            className="axis-mapping-chip-select"
            value={displayType}
            onChange={(e) => setDisplayType(columnIndex, e.target.value as SeriesDisplayType)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="bar">棒</option>
            <option value="line">線</option>
            <option value="area">面</option>
          </select>
        )}
        
        {/* 削除ボタン（X軸以外） */}
        {axis !== 'x' && (
          <button
            className="axis-mapping-chip-remove"
            onClick={() => removeColumnFromAxis(columnIndex, axis)}
            type="button"
            aria-label="削除"
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </div>
    )
  }
  
  // 軸ドロップゾーンのレンダリング
  const renderAxisDropZone = (axis: AxisType, children: React.ReactNode, canAddMultiple: boolean = false) => {
    const isDragOver = dragOverAxis === axis
    
    return (
      <div
        className={`axis-mapping-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, axis)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, axis)}
      >
        {children}
        {canAddMultiple && (
          <button
            className="axis-mapping-add-btn"
            onClick={() => {
              if (availableColumns.length > 0) {
                addColumnToAxis(availableColumns[0].index, axis)
              }
            }}
            type="button"
            disabled={availableColumns.length === 0}
          >
            <span className="material-icons">add</span>
            <span>系列を追加</span>
          </button>
        )}
      </div>
    )
  }
  
  return (
    <div className="graph-panel-section axis-mapping-section">
      <div className="graph-section-title">データマッピング</div>
      
      {/* X軸 */}
      <div className="axis-mapping-group">
        {renderAxisLabel('x')}
        {renderAxisDropZone('x', 
          <>{renderColumnChip(xColumn, 'x')}</>
        )}
      </div>
      
      {/* Y軸 */}
      <div className="axis-mapping-group">
        {renderAxisLabel('y')}
        {renderAxisDropZone('y',
          <>
            {yColumns.map(col => renderColumnChip(col, 'y', true))}
          </>,
          true
        )}
      </div>
      
      {/* Y2軸 */}
      <div className="axis-mapping-group">
        {renderAxisLabel('y2')}
        {renderAxisDropZone('y2',
          <>
            {y2Columns.map(col => renderColumnChip(col, 'y2', true))}
          </>,
          true
        )}
        {/* Y2軸単位入力欄 */}
        {y2Columns.length > 0 && (
          <div className="axis-mapping-unit-input">
            <label>単位</label>
            <input
              type="text"
              placeholder="例: %, 倍"
              value={chartConfig.yAxisRightUnit || ''}
              onChange={(e) => onConfigChange({ yAxisRightUnit: e.target.value })}
            />
          </div>
        )}
      </div>
      
      {/* Z軸（対応チャートのみ） */}
      {zAxisUsages.length > 0 && (
        <div className="axis-mapping-group">
          {renderAxisLabel('z')}
          {renderAxisDropZone('z',
            <>
              {zColumn !== undefined && renderColumnChip(zColumn, 'z')}
              {zColumn === undefined && (
                <div className="axis-mapping-placeholder">
                  バブルサイズ、ヒートマップの色などに使用
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* 利用可能なカラム */}
      <div className="axis-mapping-available">
        <div className="axis-mapping-available-label">利用可能なカラム</div>
        <div className="axis-mapping-available-chips">
          {availableColumns.map(col => (
            <div
              key={col.index}
              className="axis-mapping-available-chip"
              draggable
              onDragStart={(e) => handleDragStart(e, col.index)}
              onClick={() => {
                // クリックでY軸に追加
                addColumnToAxis(col.index, 'y')
              }}
              title={`${col.name}をドラッグして軸に追加、またはクリックでY軸に追加`}
            >
              <span className="material-icons">{getTypeIcon(col.type)}</span>
              <span>{col.name}</span>
            </div>
          ))}
          {availableColumns.length === 0 && (
            <div className="axis-mapping-empty">すべてのカラムが使用されています</div>
          )}
        </div>
      </div>
      
      {/* オプション */}
      <div className="axis-mapping-options">
        <label className="axis-mapping-option">
          <input
            type="checkbox"
            checked={chartConfig.stacked === 'normal'}
            onChange={(e) => onConfigChange({ stacked: e.target.checked ? 'normal' : undefined })}
          />
          <span>棒を積み上げる</span>
        </label>
        <label className="axis-mapping-option">
          <input
            type="checkbox"
            checked={y2Columns.length > 0}
            onChange={(e) => {
              if (!e.target.checked) {
                // Y2軸をクリア
                onConfigChange({ yAxisRightColumns: [] })
              }
            }}
          />
          <span>Y2軸を表示</span>
        </label>
        <label className="axis-mapping-option">
          <input
            type="checkbox"
            checked={chartConfig.smoothLine ?? false}
            onChange={(e) => onConfigChange({ smoothLine: e.target.checked })}
          />
          <span>線を滑らかに</span>
        </label>
      </div>
    </div>
  )
}

