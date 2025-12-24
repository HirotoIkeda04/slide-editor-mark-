/**
 * SeriesCard - 系列カード
 * 
 * Y軸の各データ系列を表すカード
 * クリックで展開/折りたたみ、ドラッグで移動
 */

import { useCallback, useState, type DragEvent } from 'react'
import type { ChartSeries, TableItem } from '../../../types'
import { getColumnName } from '../../../utils/chartUtils'
import { SeriesDetailPanel } from './SeriesDetailPanel'

interface SeriesCardProps {
  series: ChartSeries
  table: TableItem
  onUpdate: (series: ChartSeries) => void
  onDelete: () => void
  onDragStart?: (e: DragEvent, seriesId: string) => void
  isDragging?: boolean
}

export const SeriesCard = ({
  series,
  table,
  onUpdate,
  onDelete,
  onDragStart,
  isDragging = false,
}: SeriesCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const columnName = getColumnName(table, series.column)
  
  // タイプ表示名
  const typeLabel = {
    bar: '棒',
    line: '線',
    area: '面',
  }[series.type]
  
  // 展開/折りたたみトグル
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])
  
  // ドラッグ開始
  const handleDragStart = useCallback((e: DragEvent) => {
    e.dataTransfer.setData('seriesId', series.id)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(e, series.id)
  }, [series.id, onDragStart])
  
  return (
    <div 
      className={`series-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
    >
      {/* ヘッダー */}
      <div 
        className="series-card-header"
        onClick={toggleExpand}
      >
        {/* ドラッグハンドル */}
        <span 
          className="series-card-grip"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/>
            <circle cx="15" cy="5" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="15" cy="19" r="1.5"/>
          </svg>
        </span>
        
        {/* 色表示 */}
        <span 
          className="series-card-color"
          style={{ backgroundColor: series.color }}
        />
        
        {/* 系列名 */}
        <span className="series-card-name">{columnName}</span>
        
        {/* タイプ表示 */}
        <span className="series-card-type">{typeLabel}</span>
        
        {/* 展開/折りたたみアイコン */}
        <svg 
          className={`series-card-chevron ${isExpanded ? 'expanded' : ''}`}
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      
      {/* 詳細パネル */}
      {isExpanded && (
        <SeriesDetailPanel
          series={series}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

