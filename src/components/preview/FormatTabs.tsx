import { useRef, useState } from 'react'
import type { SlideFormat } from '../../types'
import { formatConfigs } from '../../constants/formatConfigs'

interface FormatTabsProps {
  currentFormat: SlideFormat
  onFormatChange: (format: SlideFormat) => void
}

// フォーマットのアイコンをレンダリング
const FormatIcon = ({ format, isActive }: { format: SlideFormat; isActive: boolean }) => {
  // S, M, L のテキストアイコン
  if (format === 'meeting' || format === 'seminar' || format === 'conference') {
    return (
      <span className="format-icon-text">
        {format === 'meeting' ? 'S' : format === 'seminar' ? 'M' : 'L'}
      </span>
    )
  }
  
  // Instagramアイコン
  if (format === 'instapost') {
    return (
      <svg className="format-instagram-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.23 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  }
  
  // Material Icons
  return (
    <span className={`material-icons ${isActive ? 'format-icon-active' : ''}`}>
      {formatConfigs[format].icon}
    </span>
  )
}

type BarState = 'collapsed' | 'expanding' | 'expanded' | 'closing_icons' | 'closing_bar'

export const FormatTabs = ({ currentFormat, onFormatChange }: FormatTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [barState, setBarState] = useState<BarState>('collapsed')
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [hoveredFormat, setHoveredFormat] = useState<SlideFormat | null>(null)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closingPhase2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  const formats = Object.keys(formatConfigs) as SlideFormat[]
  
  // 選択中アイコンの移動量を計算（左端までの距離）
  const activeIndex = formats.indexOf(currentFormat)
  // space-between レイアウトでのアイコン位置計算
  // バー: 345px, border: 2px, padding: 16px → コンテンツ幅: 327px
  // 7アイコンの間隔: (327 - 36) / 6 = 48.5px
  const contentWidth = 345 - 2 - 16 // 327px
  const iconWidth = 36
  const iconCount = formats.length
  const stride = (contentWidth - iconWidth) / (iconCount - 1) // 48.5px
  const paddingDiff = 8 - 1 // expanded: 8px, collapsed: 1px
  const iconMoveX = activeIndex * stride + paddingDiff
  
  // 速度を一定にするためのduration計算
  const baseSpeed = 400 // px/s
  const minDuration = 0.2 // 最小時間（左端アイコン用）
  const iconDuration = Math.max(minDuration, iconMoveX / baseSpeed)

  const handleMouseEnterOption = (e: React.MouseEvent<HTMLButtonElement>, format: SlideFormat) => {
    if (barState !== 'expanded' && barState !== 'expanding') return
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    setHoveredFormat(format)
    
    // ツールチップ表示に遅延を設ける
    const rect = e.currentTarget.getBoundingClientRect()
    tooltipTimeoutRef.current = setTimeout(() => {
      const tooltipWidth = 280
      const tooltipHalfWidth = tooltipWidth / 2
      const padding = 10
      
      let x = rect.left + rect.width / 2
      
      if (x - tooltipHalfWidth < padding) {
        x = tooltipHalfWidth + padding
      }
      
      if (x + tooltipHalfWidth > window.innerWidth - padding) {
        x = window.innerWidth - tooltipHalfWidth - padding
      }
      
      setTooltip({
        text: formatConfigs[format].description,
        x: x,
        y: rect.top - 10
      })
    }, 100) // 100msの遅延
  }

  const handleMouseLeaveOption = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null)
      setHoveredFormat(null)
    }, 100)
  }

  const expandingPhaseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnterContainer = () => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current)
    }
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current)
    }
    if (closingPhase2Ref.current) {
      clearTimeout(closingPhase2Ref.current)
    }
    if (expandingPhaseRef.current) {
      clearTimeout(expandingPhaseRef.current)
    }
    // 展開アニメーション開始（blur付き）
    setBarState('expanding')
    // blur解除して完全展開
    expandingPhaseRef.current = setTimeout(() => {
      setBarState('expanded')
    }, 200)
  }

  const handleMouseLeaveContainer = () => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current)
    }
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current)
    }
    if (closingPhase2Ref.current) {
      clearTimeout(closingPhase2Ref.current)
    }
    if (expandingPhaseRef.current) {
      clearTimeout(expandingPhaseRef.current)
    }
    // 2段階アニメーション開始
    expandTimeoutRef.current = setTimeout(() => {
      // フェーズ1: アイコン移動 + 他のアイコンフェードアウト
      setBarState('closing_icons')
      setTooltip(null)
      setHoveredFormat(null)
      
      // フェーズ2: バー縮小（アイコン移動と重ねて早めに開始）
      closingTimeoutRef.current = setTimeout(() => {
        setBarState('closing_bar')
        
        // 完了: collapsed状態に
        closingPhase2Ref.current = setTimeout(() => {
          setBarState('collapsed')
        }, 400)
      }, 100)
    }, 10)
  }

  const handleFormatClick = (format: SlideFormat) => {
    if (barState === 'expanded' || barState === 'expanding') {
      onFormatChange(format)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`format-selector ${barState}`}
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
    >
      {/* 常に同じ要素、クラスで状態管理 */}
      <div 
        className={`format-floating-bar ${barState}`}
        style={{ 
          '--icon-move-x': `${iconMoveX}px`,
          '--icon-duration': `${iconDuration}s`
        } as React.CSSProperties}
      >
        {formats.map((format, index) => {
          // 両端から中央へ消えていくdelay計算
          // 端からの距離: 0が端、3が中央
          const maxDist = Math.floor((formats.length - 1) / 2) // 3
          const distFromEdge = Math.min(index, formats.length - 1 - index)
          const t = distFromEdge / maxDist // 0 ~ 1
          const eased = 1 - Math.pow(1 - t, 2) // ease-out quadratic
          const fadeDelay = eased * 300 // 最大300ms
          
          return (
          <button
            key={format}
            onClick={() => handleFormatClick(format)}
            className={`format-option ${currentFormat === format ? 'active' : ''} ${hoveredFormat === format ? 'hovered' : ''}`}
            type="button"
            style={{ '--fade-delay': `${fadeDelay}ms` } as React.CSSProperties}
            onMouseEnter={(e) => handleMouseEnterOption(e, format)}
            onMouseLeave={handleMouseLeaveOption}
            aria-label={formatConfigs[format].name}
          >
            <FormatIcon format={format} isActive={currentFormat === format} />
            {hoveredFormat === format && (barState === 'expanded' || barState === 'expanding') && (
              <span className="format-option-label">
                <span className="format-option-name">{formatConfigs[format].name}</span>
                <span className="format-option-ratio">{formatConfigs[format].ratio}</span>
              </span>
            )}
          </button>
        )})}
      </div>

      {/* ツールチップ */}
      {tooltip && (
        <div
          className="format-tooltip"
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
