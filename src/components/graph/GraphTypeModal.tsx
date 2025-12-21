/**
 * GraphTypeModal - グラフタイプ選択モーダル
 * 
 * カテゴリ別にグラフタイプを表示するモーダルダイアログ
 */

import { useEffect, useRef, useCallback } from 'react'
import type { TableDisplayFormat } from '../../types'
import { graphCategories, graphTypes } from '../../constants/graphConfigs'
import './GraphTypeModal.css'

interface GraphTypeModalProps {
  isOpen: boolean
  currentFormat: TableDisplayFormat
  onFormatChange: (format: TableDisplayFormat) => void
  onClose: () => void
}

export const GraphTypeModal = ({
  isOpen,
  currentFormat,
  onFormatChange,
  onClose,
}: GraphTypeModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  
  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])
  
  // モーダルを開いた時にフォーカス
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
    }
  }, [isOpen])
  
  // グラフタイプ選択ハンドラ
  const handleSelectType = useCallback((format: TableDisplayFormat) => {
    onFormatChange(format)
    onClose()
  }, [onFormatChange, onClose])
  
  // カテゴリ別にグラフタイプをグループ化（'all'カテゴリを除く）
  const categoriesWithTypes = graphCategories
    .filter(category => category.id !== 'all')
    .map(category => ({
      ...category,
      types: graphTypes.filter(type => type.categories.includes(category.id))
    }))
    .filter(category => category.types.length > 0)
  
  if (!isOpen) return null
  
  return (
    <div className="graph-type-modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="graph-type-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="graph-modal-title"
      >
        {/* ヘッダー */}
        <div className="graph-type-modal-header">
          <h3 id="graph-modal-title">グラフタイプを選択</h3>
          <button
            ref={closeButtonRef}
            className="graph-type-modal-close"
            onClick={onClose}
            type="button"
            aria-label="閉じる"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {/* 本体 */}
        <div className="graph-type-modal-content">
          {categoriesWithTypes.map(category => (
            <div key={category.id} className="graph-type-modal-category">
              <h4 className="graph-type-modal-category-title">{category.label}</h4>
              <div className="graph-type-modal-grid">
                {category.types.map(graphType => (
                  <button
                    key={graphType.id}
                    className={`graph-type-modal-btn ${currentFormat === graphType.id ? 'active' : ''}`}
                    onClick={() => handleSelectType(graphType.id)}
                    type="button"
                    title={graphType.description}
                  >
                    <span className="material-icons">{graphType.icon}</span>
                    <span className="graph-type-modal-label">{graphType.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
