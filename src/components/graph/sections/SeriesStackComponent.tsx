/**
 * SeriesStackComponent - 系列スタック
 * 
 * 同一スタック内の系列は積み上げ表示される
 * 「+ 積み上げ」ドロップゾーンで系列を追加
 * 系列間のドロップゾーンで並び替え
 */

import { useCallback, useState, DragEvent } from 'react'
import type { ChartSeries, SeriesStack, TableItem } from '../../../types'
import { SeriesCard } from './SeriesCard'

interface SeriesStackComponentProps {
  stack: SeriesStack
  stackIndex: number
  table: TableItem
  onUpdateStack: (stack: SeriesStack) => void
  onDeleteStack: () => void
  onSeriesDragStart?: (e: DragEvent, seriesId: string, stackIndex: number) => void
  onSeriesDrop?: (e: DragEvent, stackIndex: number, insertIndex?: number) => void
  onSeriesReorder?: (fromIndex: number, toIndex: number) => void
  draggingSeriesId?: string | null
  isDragging?: boolean  // 何かがドラッグ中かどうか
}

export const SeriesStackComponent = ({
  stack,
  stackIndex,
  table,
  onUpdateStack,
  onDeleteStack,
  onSeriesDragStart,
  onSeriesDrop,
  onSeriesReorder,
  draggingSeriesId,
  isDragging = false,
}: SeriesStackComponentProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [hoverInsertIndex, setHoverInsertIndex] = useState<number | null>(null)
  
  // 系列の更新
  const handleSeriesUpdate = useCallback((index: number, series: ChartSeries) => {
    const newStack = [...stack]
    newStack[index] = series
    onUpdateStack(newStack)
  }, [stack, onUpdateStack])
  
  // 系列の削除
  const handleSeriesDelete = useCallback((index: number) => {
    const newStack = stack.filter((_, i) => i !== index)
    if (newStack.length === 0) {
      // スタックが空になったら削除
      onDeleteStack()
    } else {
      onUpdateStack(newStack)
    }
  }, [stack, onUpdateStack, onDeleteStack])
  
  // ドラッグオーバー（上部追加用）
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])
  
  // ドラッグリーブ（上部追加用）
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])
  
  // ドロップ（上部追加用）
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onSeriesDrop?.(e, stackIndex, 0)
  }, [stackIndex, onSeriesDrop])
  
  // 系列のドラッグ開始
  const handleSeriesDragStart = useCallback((e: DragEvent, seriesId: string) => {
    onSeriesDragStart?.(e, seriesId, stackIndex)
  }, [stackIndex, onSeriesDragStart])
  
  // 挿入ドロップゾーンのドラッグオーバー
  const handleInsertDragOver = useCallback((e: DragEvent, insertIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setHoverInsertIndex(insertIndex)
  }, [])
  
  // 挿入ドロップゾーンのドラッグリーブ
  const handleInsertDragLeave = useCallback(() => {
    setHoverInsertIndex(null)
  }, [])
  
  // 挿入ドロップゾーンへのドロップ
  const handleInsertDrop = useCallback((e: DragEvent, insertIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setHoverInsertIndex(null)
    
    const seriesId = e.dataTransfer.getData('seriesId')
    const source = e.dataTransfer.getData('source')
    
    // 同じスタック内での並び替え
    if (source === 'series' && seriesId) {
      const fromIndex = stack.findIndex(s => s.id === seriesId)
      if (fromIndex !== -1 && fromIndex !== insertIndex && fromIndex !== insertIndex - 1) {
        // 同じスタック内での移動
        onSeriesReorder?.(fromIndex, insertIndex)
        return
      }
    }
    
    // 別のスタックからのドロップ
    onSeriesDrop?.(e, stackIndex, insertIndex)
  }, [stack, stackIndex, onSeriesReorder, onSeriesDrop])
  
  return (
    <div className={`series-stack ${isDragging ? 'is-dragging' : ''}`}>
      {/* 積み上げドロップゾーン（上部追加） */}
      <div
        className={`series-stack-add ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        + 積み上げ
      </div>
      
      {/* 系列カードと挿入ドロップゾーン */}
      {stack.map((series, index) => (
        <div key={series.id} className="series-stack-item">
          {/* 挿入ドロップゾーン（各系列の上） */}
          <div
            className={`series-insert-zone ${hoverInsertIndex === index ? 'drag-over' : ''}`}
            onDragOver={(e) => handleInsertDragOver(e, index)}
            onDragLeave={handleInsertDragLeave}
            onDrop={(e) => handleInsertDrop(e, index)}
          />
          
          {/* 系列カード */}
          <SeriesCard
            series={series}
            table={table}
            onUpdate={(s) => handleSeriesUpdate(index, s)}
            onDelete={() => handleSeriesDelete(index)}
            onDragStart={handleSeriesDragStart}
            isDragging={draggingSeriesId === series.id}
          />
        </div>
      ))}
    </div>
  )
}

