/**
 * GraphTypeHoverSelector - ガラス風ホバー展開型グラフタイプセレクター
 * 
 * FormatTabsと同様のガラス風UIで、丸いアイコンから右+下に展開
 */

import { useRef, useState, useCallback } from 'react'
import type { TableDisplayFormat } from '../../types'
import { graphCategories, graphTypes, getGraphTypeConfig } from '../../constants/graphConfigs'

interface GraphTypeHoverSelectorProps {
  currentFormat: TableDisplayFormat
  onFormatChange: (format: TableDisplayFormat) => void
}

type SelectorState = 'collapsed' | 'expanding' | 'expanded' | 'closing_icons' | 'closing_bar'

export const GraphTypeHoverSelector = ({
  currentFormat,
  onFormatChange,
}: GraphTypeHoverSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectorState, setSelectorState] = useState<SelectorState>('collapsed')
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closingPhase2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expandingPhaseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const currentConfig = getGraphTypeConfig(currentFormat)
  
  // カテゴリ別にグラフタイプをグループ化（'all'カテゴリを除く）
  const categoriesWithTypes = graphCategories
    .filter(category => category.id !== 'all')
    .map(category => ({
      ...category,
      types: graphTypes.filter(type => type.categories.includes(category.id))
    }))
    .filter(category => category.types.length > 0)
  
  // タイムアウトをすべてクリア
  const clearAllTimeouts = useCallback(() => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current)
      expandTimeoutRef.current = null
    }
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current)
      closingTimeoutRef.current = null
    }
    if (closingPhase2Ref.current) {
      clearTimeout(closingPhase2Ref.current)
      closingPhase2Ref.current = null
    }
    if (expandingPhaseRef.current) {
      clearTimeout(expandingPhaseRef.current)
      expandingPhaseRef.current = null
    }
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
  }, [])
  
  // マウスエンター時の処理
  const handleMouseEnterContainer = useCallback(() => {
    clearAllTimeouts()
    // 展開アニメーション開始（blur付き）
    setSelectorState('expanding')
    // blur解除して完全展開
    expandingPhaseRef.current = setTimeout(() => {
      setSelectorState('expanded')
    }, 200)
  }, [clearAllTimeouts])
  
  // マウスリーブ時の処理
  const handleMouseLeaveContainer = useCallback(() => {
    clearAllTimeouts()
    // 2段階アニメーション開始
    expandTimeoutRef.current = setTimeout(() => {
      // フェーズ1: アイコンフェードアウト
      setSelectorState('closing_icons')
      setTooltip(null)
      
      // フェーズ2: パネル縮小
      closingTimeoutRef.current = setTimeout(() => {
        setSelectorState('closing_bar')
        
        // 完了: collapsed状態に
        closingPhase2Ref.current = setTimeout(() => {
          setSelectorState('collapsed')
        }, 300)
      }, 100)
    }, 10)
  }, [clearAllTimeouts])
  
  // アイテムホバー時（ツールチップ表示用）
  const handleMouseEnterItem = useCallback((e: React.MouseEvent<HTMLButtonElement>, graphType: typeof graphTypes[0]) => {
    if (selectorState !== 'expanded' && selectorState !== 'expanding') return
    
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    
    // ツールチップ表示
    const rect = e.currentTarget.getBoundingClientRect()
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({
        text: graphType.description,
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      })
    }, 300)
  }, [selectorState])
  
  const handleMouseLeaveItem = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null)
    }, 100)
  }, [])
  
  // グラフタイプ選択
  const handleSelectType = useCallback((format: TableDisplayFormat) => {
    if (selectorState === 'expanded' || selectorState === 'expanding') {
      onFormatChange(format)
    }
  }, [selectorState, onFormatChange])
  
  const isOpen = selectorState === 'expanding' || selectorState === 'expanded'
  
  return (
    <div
      ref={containerRef}
      className={`graph-glass-selector ${selectorState}`}
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
    >
      {/* ガラス風フローティングバー */}
      <div className={`graph-glass-bar ${selectorState}`}>
        {/* 選択中アイコン（閉じた状態のみ表示） */}
        {!isOpen && (
          <button
            type="button"
            className="graph-glass-active-icon"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="material-icons">
              {currentConfig?.icon || 'table_chart'}
            </span>
            <span className="graph-glass-active-label">
              {currentConfig?.label || '表'}
            </span>
          </button>
        )}
        
        {/* 展開パネル */}
        <div className={`graph-glass-panel ${selectorState}`}>
          {categoriesWithTypes.map((category, catIndex) => (
            <div 
              key={category.id} 
              className="graph-glass-category"
              style={{ '--cat-index': catIndex } as React.CSSProperties}
            >
              <span className="graph-glass-category-label">{category.label}</span>
              <div className="graph-glass-items">
                {category.types.map((graphType, typeIndex) => {
                  const isActive = currentFormat === graphType.id
                  return (
                    <button
                      key={graphType.id}
                      className={`graph-glass-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectType(graphType.id)}
                      onMouseEnter={(e) => handleMouseEnterItem(e, graphType)}
                      onMouseLeave={handleMouseLeaveItem}
                      type="button"
                      style={{ '--item-index': typeIndex } as React.CSSProperties}
                      aria-label={graphType.label}
                    >
                      <span className="material-icons">{graphType.icon}</span>
                      <span className="graph-glass-item-label">{graphType.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* ツールチップ */}
      {tooltip && (
        <div
          className="graph-glass-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 10000
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
