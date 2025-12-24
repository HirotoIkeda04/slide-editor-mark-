/**
 * YAxisSection - Y軸セクション
 * 
 * 系列の配置方法をドラッグ&ドロップで直感的に表現
 * 縦に重ねる → 積み上げ、横に並べる → 並列
 */

import { useCallback, useMemo, useState, DragEvent } from 'react'
import type { TableItem, ChartYAxisConfig, ChartSeries, SeriesStack } from '../../../types'
import { 
  getNumericColumns, 
  createSeries, 
  inferAxisUnit,
  createDefaultYAxisConfig,
} from '../../../utils/chartUtils'
import { SeriesStackComponent } from './SeriesStackComponent'

interface YAxisSectionProps {
  table: TableItem
  config: ChartYAxisConfig
  onConfigChange: (config: ChartYAxisConfig) => void
  title?: string
  isY2?: boolean
  // Cross-axis drag support
  onReceiveSeriesFromOtherAxis?: (series: ChartSeries) => void
  axisId?: string  // 'y1' or 'y2' for cross-axis identification
}

export const YAxisSection = ({
  table,
  config,
  onConfigChange,
  title = 'Y軸（左）',
  isY2 = false,
  onReceiveSeriesFromOtherAxis,
  axisId = 'y1',
}: YAxisSectionProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isDragOverNewStack, setIsDragOverNewStack] = useState(false)
  const [draggingSeriesId, setDraggingSeriesId] = useState<string | null>(null)
  const [draggingFromStack, setDraggingFromStack] = useState<number | null>(null)
  
  // 数値型カラムのみ取得
  const numericColumns = useMemo(() => getNumericColumns(table), [table])
  
  // 使用中のカラムインデックスを収集
  const usedColumnIndices = useMemo(() => {
    const indices = new Set<number>()
    for (const stack of config.stacks) {
      for (const series of stack) {
        indices.add(series.column)
      }
    }
    return indices
  }, [config.stacks])
  
  // 使用中の色を収集
  const usedColors = useMemo(() => {
    const colors: string[] = []
    for (const stack of config.stacks) {
      for (const series of stack) {
        colors.push(series.color)
      }
    }
    return colors
  }, [config.stacks])
  
  // 利用可能なカラム
  const availableColumns = useMemo(() => {
    return numericColumns.filter(col => !usedColumnIndices.has(col.index))
  }, [numericColumns, usedColumnIndices])
  
  // セクション開閉
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])
  
  // スタックの更新
  const handleStackUpdate = useCallback((stackIndex: number, stack: SeriesStack) => {
    const newStacks = [...config.stacks]
    newStacks[stackIndex] = stack
    onConfigChange({
      ...config,
      stacks: newStacks,
      unit: config.unit || inferAxisUnit(table, newStacks),
    })
  }, [config, table, onConfigChange])
  
  // スタック内の系列の並び替え
  const handleSeriesReorder = useCallback((stackIndex: number, fromIndex: number, toIndex: number) => {
    const newStacks = [...config.stacks]
    const stack = [...newStacks[stackIndex]]
    
    // 要素を取り出して新しい位置に挿入
    const [movedSeries] = stack.splice(fromIndex, 1)
    // fromIndex < toIndex の場合、spliceで1つ減っているので調整
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
    stack.splice(adjustedToIndex, 0, movedSeries)
    
    newStacks[stackIndex] = stack
    onConfigChange({
      ...config,
      stacks: newStacks,
    })
  }, [config, onConfigChange])
  
  // スタックの削除
  const handleStackDelete = useCallback((stackIndex: number) => {
    const newStacks = config.stacks.filter((_, i) => i !== stackIndex)
    onConfigChange({
      ...config,
      stacks: newStacks,
    })
  }, [config, onConfigChange])
  
  // カラムから新しいスタックを作成
  const addColumnAsNewStack = useCallback((columnIndex: number) => {
    const series = createSeries(columnIndex, 'bar', usedColors)
    const newStacks = [...config.stacks, [series]]
    onConfigChange({
      ...config,
      stacks: newStacks,
      unit: config.unit || inferAxisUnit(table, newStacks),
    })
  }, [config, table, usedColors, onConfigChange])
  
  // カラムを既存スタックに追加（積み上げ）
  const addColumnToStack = useCallback((columnIndex: number, stackIndex: number) => {
    const series = createSeries(columnIndex, 'bar', usedColors)
    const newStacks = [...config.stacks]
    newStacks[stackIndex] = [...newStacks[stackIndex], series]
    onConfigChange({
      ...config,
      stacks: newStacks,
      unit: config.unit || inferAxisUnit(table, newStacks),
    })
  }, [config, table, usedColors, onConfigChange])
  
  // ドラッグ開始
  const handleDragStart = useCallback((e: DragEvent, columnIndex: number) => {
    e.dataTransfer.setData('columnIndex', String(columnIndex))
    e.dataTransfer.setData('source', 'available')
    e.dataTransfer.effectAllowed = 'move'
  }, [])
  
  // 系列のドラッグ開始
  const handleSeriesDragStart = useCallback((e: DragEvent, seriesId: string, stackIndex: number) => {
    setDraggingSeriesId(seriesId)
    setDraggingFromStack(stackIndex)
    e.dataTransfer.setData('seriesId', seriesId)
    e.dataTransfer.setData('source', 'series')
    e.dataTransfer.setData('stackIndex', String(stackIndex))
  }, [])
  
  // 系列のドロップ（スタック内）
  const handleSeriesDrop = useCallback((e: DragEvent, targetStackIndex: number, insertIndex?: number) => {
    const source = e.dataTransfer.getData('source')
    
    if (source === 'available') {
      // 利用可能カラムからの追加
      const columnIndex = parseInt(e.dataTransfer.getData('columnIndex'), 10)
      if (!isNaN(columnIndex)) {
        // insertIndexが指定されていれば、その位置に挿入
        if (insertIndex !== undefined) {
          const series = createSeries(columnIndex, 'bar', usedColors)
          const newStacks = [...config.stacks]
          const targetStack = [...newStacks[targetStackIndex]]
          targetStack.splice(insertIndex, 0, series)
          newStacks[targetStackIndex] = targetStack
          onConfigChange({
            ...config,
            stacks: newStacks,
            unit: config.unit || inferAxisUnit(table, newStacks),
          })
        } else {
          addColumnToStack(columnIndex, targetStackIndex)
        }
      }
    } else if (source === 'series') {
      // 既存系列の移動
      const seriesId = e.dataTransfer.getData('seriesId')
      const fromStackIndex = parseInt(e.dataTransfer.getData('stackIndex'), 10)
      
      if (seriesId && !isNaN(fromStackIndex)) {
        // 元のスタックから系列を削除
        const fromStack = config.stacks[fromStackIndex]
        const seriesIndex = fromStack.findIndex(s => s.id === seriesId)
        if (seriesIndex !== -1) {
          const series = fromStack[seriesIndex]
          const newFromStack = fromStack.filter((_, i) => i !== seriesIndex)
          
          const newStacks = [...config.stacks]
          newStacks[fromStackIndex] = newFromStack
          
          // 挿入位置を調整（同じスタックの場合、削除後のインデックスを考慮）
          let adjustedInsertIndex = insertIndex ?? newStacks[targetStackIndex].length
          if (fromStackIndex === targetStackIndex && seriesIndex < adjustedInsertIndex) {
            adjustedInsertIndex = Math.max(0, adjustedInsertIndex - 1)
          }
          
          // 新しい位置に挿入
          const targetStack = [...newStacks[targetStackIndex]]
          targetStack.splice(adjustedInsertIndex, 0, series)
          newStacks[targetStackIndex] = targetStack
          
          // 空のスタックを削除
          const filteredStacks = newStacks.filter(s => s.length > 0)
          
          onConfigChange({
            ...config,
            stacks: filteredStacks,
          })
        }
      }
    }
    
    setDraggingSeriesId(null)
    setDraggingFromStack(null)
  }, [config, addColumnToStack, usedColors, table, onConfigChange])
  
  // 新規スタック用ドラッグオーバー
  const handleNewStackDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOverNewStack(true)
  }, [])
  
  // 新規スタック用ドラッグリーブ
  const handleNewStackDragLeave = useCallback(() => {
    setIsDragOverNewStack(false)
  }, [])
  
  // 新規スタック用ドロップ
  const handleNewStackDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOverNewStack(false)
    
    const source = e.dataTransfer.getData('source')
    
    if (source === 'available') {
      const columnIndex = parseInt(e.dataTransfer.getData('columnIndex'), 10)
      if (!isNaN(columnIndex)) {
        addColumnAsNewStack(columnIndex)
      }
    } else if (source === 'series') {
      // 既存系列を新しいスタックに移動
      const seriesId = e.dataTransfer.getData('seriesId')
      const fromStackIndex = parseInt(e.dataTransfer.getData('stackIndex'), 10)
      
      if (seriesId && !isNaN(fromStackIndex)) {
        const fromStack = config.stacks[fromStackIndex]
        const seriesIndex = fromStack.findIndex(s => s.id === seriesId)
        if (seriesIndex !== -1) {
          const series = fromStack[seriesIndex]
          const newFromStack = fromStack.filter((_, i) => i !== seriesIndex)
          
          const newStacks = [...config.stacks]
          newStacks[fromStackIndex] = newFromStack
          
          // 空のスタックを削除して新しいスタックを追加
          const filteredStacks = newStacks.filter(s => s.length > 0)
          filteredStacks.push([series])
          
          onConfigChange({
            ...config,
            stacks: filteredStacks,
          })
        }
      }
    }
    
    setDraggingSeriesId(null)
    setDraggingFromStack(null)
  }, [config, addColumnAsNewStack, onConfigChange])
  
  // クリックでカラムを追加
  const handleColumnClick = useCallback((columnIndex: number) => {
    addColumnAsNewStack(columnIndex)
  }, [addColumnAsNewStack])
  
  // 最小値変更
  const handleMinChange = useCallback((value: string) => {
    const num = parseFloat(value)
    onConfigChange({
      ...config,
      scale: {
        ...config.scale,
        min: value === '' || isNaN(num) ? 'auto' : num,
      },
    })
  }, [config, onConfigChange])
  
  // 最大値変更
  const handleMaxChange = useCallback((value: string) => {
    const num = parseFloat(value)
    onConfigChange({
      ...config,
      scale: {
        ...config.scale,
        max: value === '' || isNaN(num) ? 'auto' : num,
      },
    })
  }, [config, onConfigChange])
  
  // 単位変更
  const handleUnitChange = useCallback((value: string) => {
    onConfigChange({
      ...config,
      unit: value,
    })
  }, [config, onConfigChange])
  
  return (
    <div className="graph-panel-section chart-axis-section">
      {/* セクションヘッダー */}
      <button
        className="chart-section-header"
        onClick={toggleOpen}
        type="button"
      >
        <svg 
          className={`chart-section-chevron ${!isOpen ? 'collapsed' : ''}`}
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
        <span className="chart-section-title">{title}</span>
      </button>
      
      {/* セクションコンテンツ */}
      {isOpen && (
        <div className="chart-section-content">
          {/* スタックエリア */}
          <div className="series-stacks-area">
            {config.stacks.map((stack, index) => (
              <SeriesStackComponent
                key={index}
                stack={stack}
                stackIndex={index}
                table={table}
                onUpdateStack={(s) => handleStackUpdate(index, s)}
                onDeleteStack={() => handleStackDelete(index)}
                onSeriesDragStart={handleSeriesDragStart}
                onSeriesDrop={handleSeriesDrop}
                onSeriesReorder={(fromIdx, toIdx) => handleSeriesReorder(index, fromIdx, toIdx)}
                draggingSeriesId={draggingSeriesId}
                isDragging={draggingSeriesId !== null}
              />
            ))}
            
            {/* 新規スタック追加ゾーン */}
            <div
              className={`series-new-stack ${isDragOverNewStack ? 'drag-over' : ''}`}
              onDragOver={handleNewStackDragOver}
              onDragLeave={handleNewStackDragLeave}
              onDrop={handleNewStackDrop}
            >
              + 並列
            </div>
          </div>
          
          {/* 利用可能なカラム */}
          {availableColumns.length > 0 && (
            <div className="chart-available-columns">
              {availableColumns.map(col => (
                <div
                  key={col.index}
                  className="chart-column-chip"
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.index)}
                  onClick={() => handleColumnClick(col.index)}
                  title={`${col.name}をドラッグまたはクリックで追加`}
                >
                  {col.name}
                </div>
              ))}
            </div>
          )}
          
          {/* 軸設定 */}
          <div className="chart-axis-inputs">
            <div className="chart-axis-input-row">
              <div className="chart-axis-input-item">
                <label className="chart-axis-input-label">最小値</label>
                <input
                  type="text"
                  className="chart-axis-input"
                  placeholder="自動"
                  value={config.scale.min === 'auto' ? '' : config.scale.min}
                  onChange={(e) => handleMinChange(e.target.value)}
                />
              </div>
              <div className="chart-axis-input-item">
                <label className="chart-axis-input-label">最大値</label>
                <input
                  type="text"
                  className="chart-axis-input"
                  placeholder="自動"
                  value={config.scale.max === 'auto' ? '' : config.scale.max}
                  onChange={(e) => handleMaxChange(e.target.value)}
                />
              </div>
            </div>
            <div className="chart-axis-input-item full">
              <label className="chart-axis-input-label">単位</label>
              <input
                type="text"
                className="chart-axis-input"
                placeholder="例: 万円"
                value={config.unit}
                onChange={(e) => handleUnitChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

