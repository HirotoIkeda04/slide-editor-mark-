import { useRef, useEffect } from 'react'
import type { Slide, SlideFormat, Tone, Item, ImpressionCode, ImpressionStyleVars } from '../../types'
import { extractSlideTitle } from '../../utils/markdown'
import { Preview } from '../preview/Preview'

interface SlideCarouselProps {
  slides: Slide[]
  currentIndex: number
  currentFormat: SlideFormat
  currentTone: Tone
  impressionCode?: ImpressionCode
  styleOverrides?: Partial<ImpressionStyleVars>
  selectedBiomeId?: string
  items: Item[]
  setCurrentIndex: (index: number) => void
}

export const SlideCarousel = ({ slides, currentIndex, currentFormat, currentTone, impressionCode, styleOverrides, selectedBiomeId, items, setCurrentIndex }: SlideCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null)

  // 選択中のスライドがカルーセルに表示されるようにスクロール位置を調整
  useEffect(() => {
    if (carouselRef.current) {
      const currentSlide = carouselRef.current.querySelector(`[data-slide-index="${currentIndex}"]`) as HTMLElement
      if (currentSlide) {
        currentSlide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex])

  // カルーセルの高さに基づいてスライドのサイズを計算
  const carouselHeight = 120 // 固定高さ
  const titleHeight = 20 // タイトル部分の高さ（概算）
  const padding = 8 // 上下のパディング
  const availableHeight = carouselHeight - titleHeight - padding
  
  // アスペクト比に基づいて幅を計算
  const getSlideDimensions = (format: SlideFormat) => {
    let slideWidth: number
    let slideHeight: number
    if (['webinar', 'meeting', 'seminar', 'conference'].includes(format)) {
      // 16:9
      slideHeight = availableHeight
      slideWidth = slideHeight * (16 / 9)
    } else if (format === 'instastory') {
      // 9:16
      slideHeight = availableHeight
      slideWidth = slideHeight * (9 / 16)
    } else if (format === 'a4') {
      // 210:297
      slideHeight = availableHeight
      slideWidth = slideHeight * (210 / 297)
    } else {
      // 4:5 (instapost)
      slideHeight = availableHeight
      slideWidth = slideHeight * (4 / 5)
    }
    return { slideWidth, slideHeight }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setCurrentIndex(Math.max(0, currentIndex - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setCurrentIndex(Math.min(slides.length - 1, currentIndex + 1))
    }
  }

  // イージング済みのグラデーション（ease-out）をマスクとして定義
  const easedGradientToRight = `linear-gradient(to right, 
    rgba(0,0,0,1) 0%, 
    rgba(0,0,0,0.97) 5%, 
    rgba(0,0,0,0.85) 15%, 
    rgba(0,0,0,0.6) 30%, 
    rgba(0,0,0,0.3) 50%, 
    rgba(0,0,0,0.12) 70%, 
    rgba(0,0,0,0.04) 85%, 
    rgba(0,0,0,0) 100%)`

  const easedGradientToLeft = `linear-gradient(to left, 
    rgba(0,0,0,1) 0%, 
    rgba(0,0,0,0.97) 5%, 
    rgba(0,0,0,0.85) 15%, 
    rgba(0,0,0,0.6) 30%, 
    rgba(0,0,0,0.3) 50%, 
    rgba(0,0,0,0.12) 70%, 
    rgba(0,0,0,0.04) 85%, 
    rgba(0,0,0,0) 100%)`

  return (
    <div style={{ marginTop: '16px', height: '120px', position: 'relative' }}>
      {/* 左側のフェードオーバーレイ（ease-outイージング + blur） */}
      <div 
        style={{ 
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '48px',
          background: `linear-gradient(to right, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 0%) 0%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 3%) 5%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 15%) 15%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 40%) 30%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 70%) 50%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 88%) 70%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 96%) 85%, 
            transparent 100%)`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          maskImage: easedGradientToRight,
          WebkitMaskImage: easedGradientToRight,
          zIndex: 10,
          pointerEvents: 'none'
        }}
      />
      {/* 右側のフェードオーバーレイ（ease-outイージング + blur） */}
      <div 
        style={{ 
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '48px',
          background: `linear-gradient(to left, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 0%) 0%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 3%) 5%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 15%) 15%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 40%) 30%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 70%) 50%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 88%) 70%, 
            color-mix(in oklch, var(--app-bg-secondary), transparent 96%) 85%, 
            transparent 100%)`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          maskImage: easedGradientToLeft,
          WebkitMaskImage: easedGradientToLeft,
          zIndex: 10,
          pointerEvents: 'none'
        }}
      />
      <div className="flex items-center h-full">
        {/* カルーセル */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <div 
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto pb-2 no-scrollbar items-center h-full outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {/* 左側の余白 */}
            <div className="flex-shrink-0" style={{ width: '48px' }} />
            {slides.map((slide, idx) => {
              const slideTitle = extractSlideTitle(slide.content)
              const { slideWidth, slideHeight } = getSlideDimensions(currentFormat)
              // サムネイル用のスライド配列を作成
              // 目次レイアウト（toc）の場合は全スライドを渡す（セクション見出し抽出のため）
              // それ以外は単一スライドを渡す
              const isTocLayout = slide.layout === 'toc'
              const thumbnailSlides = isTocLayout 
                ? slides.map((s, i) => i === idx 
                    ? { content: s.content, layout: s.layout }
                    : { content: s.content, layout: s.layout }
                  )
                : [{ content: slide.content, layout: slide.layout }]
              const thumbnailCurrentIndex = isTocLayout ? idx : 0
              
              return (
                <div key={idx} className="flex flex-col items-center flex-shrink-0" style={{ width: `${slideWidth}px` }} data-slide-index={idx}>
                  <button
                    onClick={() => setCurrentIndex(idx)}
                    className={`transition-all border rounded-lg cursor-pointer overflow-hidden ${
                      idx === currentIndex ? 'shadow-lg' : ''
                    }`}
                    style={{
                      width: `${slideWidth}px`,
                      height: `${slideHeight}px`,
                      borderWidth: idx === currentIndex ? '3px' : '1px',
                      borderColor: idx === currentIndex ? 'var(--app-accent)' : 'var(--color-gray-300)',
                      backgroundColor: '#ffffff',
                      padding: 0
                    }}
                    tabIndex={-1}
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      <Preview
                        slides={thumbnailSlides}
                        currentIndex={thumbnailCurrentIndex}
                        currentFormat={currentFormat}
                        currentTone={currentTone}
                        impressionCode={impressionCode}
                        styleOverrides={styleOverrides}
                        selectedBiomeId={selectedBiomeId}
                        previewRef={{ current: null }}
                        items={items}
                        isThumbnail={true}
                        thumbnailHeight={slideHeight}
                      />
                    </div>
                  </button>
                  {/* スライド番号とタイトル */}
                  <div 
                    className="text-left text-sm w-full"
                    style={{ 
                      marginTop: '4px',
                      color: idx === currentIndex ? 'var(--app-accent-light)' : 'var(--app-text-disabled)',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {idx + 1}. {slideTitle}
                  </div>
                </div>
              )
            })}
            {/* 右側の余白 */}
            <div className="flex-shrink-0" style={{ width: '48px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}


