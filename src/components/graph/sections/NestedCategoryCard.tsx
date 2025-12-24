/**
 * NestedCategoryCard - ネストカテゴリカード
 * 
 * X軸の階層カテゴリを再帰的に表示するカード
 * 入れ子構造でカテゴリの包含関係を視覚的に表現
 */

import { useCallback, DragEvent } from 'react'
import type { NestedCategory, TableItem } from '../../../types'
import { getColumnName } from '../../../utils/chartUtils'

interface NestedCategoryCardProps {
  category: NestedCategory
  table: TableItem
  onUpdate: (category: NestedCategory | null) => void
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  depth?: number
}

export const NestedCategoryCard = ({
  category,
  table,
  onUpdate,
  depth = 0,
}: NestedCategoryCardProps) => {
  const columnName = getColumnName(table, category.column)
  const hasChild = category.child !== null
  
  // 削除ハンドラ
  const handleRemove = useCallback(() => {
    onUpdate(null)
  }, [onUpdate])
  
  // 子カテゴリの更新
  const handleChildUpdate = useCallback((child: NestedCategory | null) => {
    onUpdate({ ...category, child })
  }, [category, onUpdate])
  
  // 子ドロップゾーンへのドラッグオーバー
  const handleChildDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }, [])
  
  // 子ドロップゾーンへのドロップ
  const handleChildDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const columnIndex = parseInt(e.dataTransfer.getData('columnIndex'), 10)
    if (!isNaN(columnIndex) && columnIndex !== category.column) {
      // 新しい子カテゴリを作成
      const newChild: NestedCategory = {
        column: columnIndex,
        child: null,
      }
      onUpdate({ ...category, child: newChild })
    }
  }, [category, onUpdate])
  
  return (
    <div className="nested-category-card">
      <div className={`nested-category-header ${!hasChild ? 'no-child' : ''}`}>
        {/* ドラッグハンドル */}
        <span className="nested-category-grip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/>
            <circle cx="15" cy="5" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="15" cy="19" r="1.5"/>
          </svg>
        </span>
        
        {/* カラム名 */}
        <span className="nested-category-name">{columnName}</span>
        
        {/* 削除ボタン */}
        <button
          className="nested-category-remove"
          onClick={handleRemove}
          type="button"
          aria-label="削除"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      {/* 子カテゴリまたはドロップゾーン */}
      {hasChild ? (
        <NestedCategoryCard
          category={category.child!}
          table={table}
          onUpdate={handleChildUpdate}
          depth={depth + 1}
        />
      ) : (
        <div
          className="nested-category-child-dropzone"
          onDragOver={handleChildDragOver}
          onDrop={handleChildDrop}
        >
          ここにドロップで子階層を追加
        </div>
      )}
    </div>
  )
}

