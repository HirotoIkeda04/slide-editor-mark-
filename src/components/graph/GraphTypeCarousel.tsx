/**
 * GraphTypeCarousel - グラフタイプカルーセル
 * 
 * アイコン付きボタンの横スクロールでグラフタイプを選択
 * 右端に「もっと見る」ボタンと設定ボタンを配置
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import type { TableDisplayFormat, GraphCategory } from '../../types'
import { getGraphTypesByCategory, isSettingsEnabled } from '../../constants/graphConfigs'

interface GraphTypeCarouselProps {
  selectedCategory: GraphCategory
  currentFormat: TableDisplayFormat
  onFormatChange: (format: TableDisplayFormat) => void
  onSettingsClick: () => void
  onMoreClick: () => void
}

export const GraphTypeCarousel = ({
  selectedCategory,
  currentFormat,
  onFormatChange,
  onSettingsClick,
  onMoreClick,
}: GraphTypeCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)
  
  const graphTypes = getGraphTypesByCategory(selectedCategory)
  const settingsEnabled = isSettingsEnabled(currentFormat)
  
  // スクロール位置に応じてフェード表示を更新
  const updateFades = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    setShowLeftFade(scrollLeft > 0)
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])
  
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    updateFades()
    container.addEventListener('scroll', updateFades)
    
    // ResizeObserverでコンテナサイズ変更を監視
    const resizeObserver = new ResizeObserver(updateFades)
    resizeObserver.observe(container)
    
    return () => {
      container.removeEventListener('scroll', updateFades)
      resizeObserver.disconnect()
    }
  }, [updateFades, selectedCategory])
  
  return (
    <div className="graph-carousel-wrapper">
      <div className="graph-carousel">
        {/* 左フェード */}
        {showLeftFade && <div className="graph-carousel-fade left" />}
        
        {/* スクロールコンテナ */}
        <div 
          ref={scrollContainerRef}
          className="graph-carousel-scroll"
        >
          {graphTypes.map(graphType => (
            <button
              key={graphType.id}
              className={`graph-type-btn ${currentFormat === graphType.id ? 'active' : ''}`}
              onClick={() => onFormatChange(graphType.id)}
              type="button"
              title={graphType.description}
            >
              <span className="material-icons">{graphType.icon}</span>
              <span className="graph-type-label">{graphType.label}</span>
            </button>
          ))}
          
          {/* その他のグラフボタン */}
          <button
            className="graph-type-btn more-btn"
            onClick={onMoreClick}
            type="button"
            title="すべてのグラフタイプを表示"
          >
            <span className="material-icons">more_horiz</span>
            <span className="graph-type-label">その他</span>
          </button>
        </div>
        
        {/* 右フェード */}
        {showRightFade && <div className="graph-carousel-fade right" />}
      </div>
      
      {/* 設定ボタン */}
      <button
        className={`graph-settings-btn ${!settingsEnabled ? 'disabled' : ''}`}
        onClick={settingsEnabled ? onSettingsClick : undefined}
        disabled={!settingsEnabled}
        type="button"
        title={settingsEnabled ? 'グラフ設定' : '表形式では設定できません'}
      >
        <span className="material-icons">settings</span>
      </button>
    </div>
  )
}
