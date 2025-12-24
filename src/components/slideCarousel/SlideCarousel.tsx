import { useRef, useEffect, useMemo, useState } from 'react'
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

// チャプターグループの型
interface ChapterGroup {
  name: string
  slides: { slide: Slide; originalIndex: number }[]
}

// スライドがチャプターの先頭（中扉）かどうかを判定
const isChapterSlide = (slide: Slide): boolean => {
  const content = slide.content
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    // H1見出しで始まる場合はチャプタースライド
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      return true
    }
    if (trimmed.startsWith('#ttl ')) {
      return true
    }
    // 最初の非空行が見出しでなければfalse
    return false
  }
  return false
}

// チャプター名を抽出する関数
const extractChapterName = (slide: Slide): string | null => {
  const content = slide.content
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    // H1見出し
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      return trimmed.substring(2).trim()
    }
    // レイアウト属性値
    if (trimmed.startsWith('#ttl ')) {
      return trimmed.substring(5).trim()
    }
    return null
  }
  return null
}

// スライドをチャプターごとにグループ化する関数
const groupSlidesByChapter = (slides: Slide[]): ChapterGroup[] => {
  const groups: ChapterGroup[] = []
  let currentGroup: ChapterGroup | null = null
  
  slides.forEach((slide, idx) => {
    const chapterName = extractChapterName(slide)
    
    if (chapterName !== null) {
      // 新しいチャプターが始まる
      currentGroup = {
        name: chapterName,
        slides: [{ slide, originalIndex: idx }]
      }
      groups.push(currentGroup)
    } else if (currentGroup) {
      // 既存のチャプターに追加
      currentGroup.slides.push({ slide, originalIndex: idx })
    } else {
      // チャプターが始まる前のスライド（暗黙のチャプター）
      currentGroup = {
        name: '',
        slides: [{ slide, originalIndex: idx }]
      }
      groups.push(currentGroup)
    }
  })
  
  return groups
}

export const SlideCarousel = ({ slides, currentIndex, currentFormat, currentTone, impressionCode, styleOverrides, selectedBiomeId, items, setCurrentIndex }: SlideCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // スライドをチャプターごとにグループ化
  const chapterGroups = useMemo(() => groupSlidesByChapter(slides), [slides])

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
  const carouselHeight = 140 // チャプター名の行を含めた高さ
  const chapterLabelHeight = 20 // チャプター名ラベルの高さ
  const sectionLabelHeight = 20 // セクション名ラベルの高さ
  const padding = 8 // 上下のパディング
  const availableHeight = carouselHeight - chapterLabelHeight - sectionLabelHeight - padding
  
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

  const { slideWidth, slideHeight } = getSlideDimensions(currentFormat)

  return (
    <div style={{ marginTop: '16px', height: `${carouselHeight}px`, position: 'relative' }}>
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
            className="flex gap-0 overflow-x-auto pb-2 no-scrollbar items-stretch h-full outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {/* 左側の余白 */}
            <div className="flex-shrink-0" style={{ width: '48px' }} />
            
            {chapterGroups.map((chapter, chapterIdx) => {
              // チャプター内の全スライドの幅を計算
              const chapterWidth = chapter.slides.length * slideWidth + (chapter.slides.length - 1) * 12 // gap: 12px
              
              // チャプターに含まれるスライドの範囲を計算
              const firstSlideIndex = chapter.slides[0]?.originalIndex ?? 0
              const lastSlideIndex = chapter.slides[chapter.slides.length - 1]?.originalIndex ?? 0
              const slideRange = chapter.slides.length > 0 
                ? `（${firstSlideIndex + 1}~${lastSlideIndex + 1}）`
                : ''
              
              // チャプター区切り線の高さ（サムネイル行の高さの半分程度）
              const dividerHeight = Math.round((slideHeight + sectionLabelHeight) / 2)
              // スライドの中心軸の位置を計算（チャプター名の下からスライドの中心までの距離）
              const slideCenterOffset = chapterLabelHeight + 8 + slideHeight / 2
              // 区切り線をスライドの中心に揃えるためのマージン
              const dividerMarginTop = slideCenterOffset - dividerHeight / 2
              
              return (
                <div 
                  key={chapterIdx} 
                  className="flex flex-shrink-0"
                  style={{ gap: '0' }}
                >
                  {/* チャプター区切り線（最初のチャプター以外） */}
                  {chapterIdx > 0 && (
                    <div 
                      style={{
                        width: '1px',
                        height: `${dividerHeight}px`,
                        backgroundColor: 'var(--app-border-secondary)',
                        marginLeft: '16px',
                        marginRight: '16px',
                        marginTop: `${dividerMarginTop}px`
                      }}
                    />
                  )}
                  
                  {/* チャプターコンテナ */}
                  <div 
                    className="flex flex-col flex-shrink-0"
                    style={{ width: `${chapterWidth}px` }}
                  >
                    {/* チャプター名ラベル（上部、左寄せ、省略対応） */}
                    {chapter.name && (
                      <div
                        style={{
                          height: `${chapterLabelHeight}px`,
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--app-text-disabled)',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: `${chapterLabelHeight}px`,
                          paddingRight: '8px',
                          marginBottom: '8px'
                        }}
                        title={`${chapter.name}${slideRange}`}
                      >
                        {chapter.name}{slideRange}
                      </div>
                    )}
                    {/* チャプター名がない場合のスペーサー */}
                    {!chapter.name && (
                      <div style={{ height: `${chapterLabelHeight}px` }} />
                    )}
                    
                    {/* サムネイル行 */}
                    <div 
                      className="flex"
                      style={{ gap: '12px' }}
                    >
                      {chapter.slides.map(({ slide, originalIndex }) => {
                        const slideTitle = extractSlideTitle(slide.content)
                        // サムネイル用のスライド配列を作成
                        const isTocLayout = slide.layout === 'toc'
                        const thumbnailSlides = isTocLayout 
                          ? slides.map((s) => ({ content: s.content, layout: s.layout }))
                          : [{ content: slide.content, layout: slide.layout }]
                        const thumbnailCurrentIndex = isTocLayout ? originalIndex : 0
                        
                        // このスライドがチャプターの先頭（中扉）かどうか
                        const isChapter = isChapterSlide(slide)
                        
                        return (
                          <div 
                            key={originalIndex}
                            className="flex flex-col flex-shrink-0"
                            style={{ width: `${slideWidth}px` }}
                            data-slide-index={originalIndex}
                            onMouseEnter={() => setHoveredIndex(originalIndex)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            {/* サムネイルボタン */}
                            <button
                              onClick={() => setCurrentIndex(originalIndex)}
                              className={`transition-all border rounded-lg cursor-pointer overflow-hidden ${
                                originalIndex === currentIndex ? 'shadow-lg' : ''
                              }`}
                              style={{
                                width: `${slideWidth}px`,
                                height: `${slideHeight}px`,
                                borderWidth: originalIndex === currentIndex ? '3px' : '1px',
                                borderColor: originalIndex === currentIndex ? 'var(--app-accent)' : 'var(--color-gray-300)',
                                backgroundColor: '#ffffff',
                                padding: 0,
                                position: 'relative'
                              }}
                              tabIndex={-1}
                              aria-label={`Go to slide ${originalIndex + 1}`}
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
                              {/* ホバー時のスライド番号バッジ（左下） */}
                              {hoveredIndex === originalIndex && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    left: '4px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    pointerEvents: 'none'
                                  }}
                                >
                                  {originalIndex + 1}
                                </div>
                              )}
                            </button>
                            
                            {/* セクション名（中扉以外のみ表示） */}
                            <div 
                              style={{ 
                                height: `${sectionLabelHeight}px`,
                                marginTop: '4px',
                                color: originalIndex === currentIndex ? 'var(--app-accent-light)' : 'var(--app-text-disabled)',
                                fontSize: '11px',
                                lineHeight: '1.3',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textAlign: 'left',
                                opacity: isChapter ? 0 : 1 // 中扉の場合はラベル非表示（チャプター名と重複するため）
                              }}
                              title={isChapter ? '' : slideTitle}
                            >
                              {slideTitle}
                            </div>
                          </div>
                        )
                      })}
                    </div>
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
