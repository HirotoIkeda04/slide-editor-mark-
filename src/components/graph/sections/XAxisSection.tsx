/**
 * XAxisSection - X軸セクション
 * 
 * カテゴリの階層関係を入れ子構造で表現
 * ドラッグ&ドロップで階層を作成・編集
 */

import { useCallback, useMemo, useState, DragEvent } from 'react'
import type { TableItem, NestedCategory } from '../../../types'
import { getCategoryColumns, getColumnName } from '../../../utils/chartUtils'
import { NestedCategoryCard } from './NestedCategoryCard'

interface XAxisSectionProps {
  table: TableItem
  category: NestedCategory | null
  onCategoryChange: (category: NestedCategory | null) => void
}

export const XAxisSection = ({
  table,
  category,
  onCategoryChange,
}: XAxisSectionProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // カテゴリ型カラムのみ取得
  const categoryColumns = useMemo(() => getCategoryColumns(table), [table])
  
  // 使用中のカラムインデックスを収集
  const usedColumnIndices = useMemo(() => {
    const indices = new Set<number>()
    const collectIndices = (cat: NestedCategory | null) => {
      if (cat) {
        indices.add(cat.column)
        collectIndices(cat.child)
      }
    }
    collectIndices(category)
    return indices
  }, [category])
  
  // 利用可能なカラム
  const availableColumns = useMemo(() => {
    return categoryColumns.filter(col => !usedColumnIndices.has(col.index))
  }, [categoryColumns, usedColumnIndices])
  
  // セクション開閉
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])
  
  // ドラッグ開始
  const handleDragStart = useCallback((e: DragEvent, columnIndex: number) => {
    e.dataTransfer.setData('columnIndex', String(columnIndex))
    e.dataTransfer.effectAllowed = 'move'
  }, [])
  
  // ルートドロップエリアへのドラッグオーバー
  const handleRootDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])
  
  // ルートドロップエリアからのドラッグリーブ
  const handleRootDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])
  
  // ルートドロップエリアへのドロップ
  const handleRootDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const columnIndex = parseInt(e.dataTransfer.getData('columnIndex'), 10)
    if (!isNaN(columnIndex)) {
      // ルートカテゴリとして設定（既存の階層を子として保持）
      const newCategory: NestedCategory = {
        column: columnIndex,
        child: category,
      }
      onCategoryChange(newCategory)
    }
  }, [category, onCategoryChange])
  
  // クリックでカテゴリを追加
  const handleColumnClick = useCallback((columnIndex: number) => {
    if (category === null) {
      // ルートカテゴリとして設定
      onCategoryChange({ column: columnIndex, child: null })
    } else {
      // 最深部に追加
      const addToDeepest = (cat: NestedCategory): NestedCategory => {
        if (cat.child === null) {
          return { ...cat, child: { column: columnIndex, child: null } }
        }
        return { ...cat, child: addToDeepest(cat.child) }
      }
      onCategoryChange(addToDeepest(category))
    }
  }, [category, onCategoryChange])
  
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
        <span className="chart-section-title">X軸</span>
      </button>
      
      {/* セクションコンテンツ */}
      {isOpen && (
        <div className="chart-section-content">
          {/* カテゴリドロップエリア */}
          <div
            className={`chart-drop-area ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleRootDragOver}
            onDragLeave={handleRootDragLeave}
            onDrop={handleRootDrop}
          >
            {category ? (
              <NestedCategoryCard
                category={category}
                table={table}
                onUpdate={onCategoryChange}
              />
            ) : (
              <div className="chart-drop-placeholder">
                カテゴリをドラッグしてX軸を設定
              </div>
            )}
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
        </div>
      )}
    </div>
  )
}

