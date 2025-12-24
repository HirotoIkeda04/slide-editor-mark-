import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './FloatingNavBar.css'
import type { TableDisplayFormat, PictoElementType } from '../../types'

type ItemType = 'slide' | 'table' | 'image' | 'text' | 'pictogram' | 'euler' | null

// Pictogramのエディタモード
export type PictogramEditorMode = 'select' | 'connect' | 'comment'

// Eulerのエディタモード
export type EulerEditorMode = 'select' | 'add'

interface FloatingNavBarProps {
  itemType: ItemType
  // Slide用 (new line-based format)
  currentLine?: number  // 1-based line number
  currentAttribute?: string | null
  selection?: { startLine: number; endLine: number } | null  // 1-based line numbers
  onSetAttribute?: (lineNumber: number, attribute: string | null) => void
  onSetAttributesForRange?: (startLine: number, endLine: number, attribute: string | null) => void
  onScrollToCurrentSlide?: () => void  // 現在のスライドにスクロール
  onCreateItemFromSelection?: () => void  // 選択テキストからアイテムを作成
  // Table用
  onTableOperation?: (operation: string, ...args: unknown[]) => void
  tableState?: {
    hasSelection: boolean
    canMerge: boolean
    canUnmerge: boolean
    displayFormat?: TableDisplayFormat
    hiddenRowsCount?: number
    hiddenColumnsCount?: number
    useHeaders?: boolean
  }
  // Image用
  onImageOperation?: (operation: string, ...args: unknown[]) => void
  imageState?: {
    displayMode: 'contain' | 'cover'
    isCropping: boolean
  }
  // Pictogram用
  onPictogramOperation?: (operation: string, ...args: unknown[]) => void
  pictogramState?: {
    mode: PictogramEditorMode
    canDelete: boolean
    canGroup: boolean
  }
  onAddPictogramElement?: (type: PictoElementType) => void
  // Euler用
  mode?: 'euler'
  eulerEditorMode?: EulerEditorMode
  onEulerModeChange?: (mode: EulerEditorMode) => void
  onAddEulerCircle?: () => void
  onAddEulerElement?: () => void
  // 位置調整用（行番号カラムを除いた中央配置）
  leftOffset?: string
}

// ボタンの定義（優先順位順）
interface ButtonConfig {
  id: string
  label: React.ReactNode
  title: string
  attribute?: string | null
  isActive?: (currentAttribute: string | null) => boolean
  icon?: string
  group: number // グループ番号（同じグループは一緒に表示/非表示）
}

export const FloatingNavBar = ({
  itemType,
  currentLine,
  currentAttribute,
  selection,
  onSetAttribute,
  onSetAttributesForRange,
  onScrollToCurrentSlide,
  onCreateItemFromSelection,
  onTableOperation,
  tableState,
  onImageOperation,
  imageState,
  onPictogramOperation,
  pictogramState,
  onAddPictogramElement,
  mode,
  eulerEditorMode,
  onEulerModeChange,
  onAddEulerCircle,
  onAddEulerElement,
  leftOffset: _leftOffset,
}: FloatingNavBarProps) => {
  const [visibleCount, setVisibleCount] = useState<number>(Infinity)
  const [showOverflow, setShowOverflow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const overflowRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Slide用ボタン定義（優先順位順）
  const slideButtons: ButtonConfig[] = [
    // レイアウト属性値（表紙、目次、まとめ）
    { id: 'title', label: 'TTL', title: '表紙 (#ttl)', attribute: '#ttl', isActive: (a) => a === '#ttl', group: 0 },
    { id: 'agenda', label: 'AGD', title: '目次 (#agd)', attribute: '#agd', isActive: (a) => a === '#agd', group: 0 },
    { id: 'summary', label: '#!', title: 'まとめ (#!)', attribute: '#!', isActive: (a) => a === '#!', group: 0 },
    // 見出し属性値
    { id: 'h1', label: 'H1', title: 'チャプター (#)', attribute: '#', isActive: (a) => a === '#', group: 1 },
    { id: 'h2', label: 'H2', title: 'セクション (##)', attribute: '##', isActive: (a) => a === '##', group: 1 },
    { id: 'h3', label: 'H3', title: 'サブセクション (###)', attribute: '###', isActive: (a) => a === '###', group: 1 },
    { id: 'bullet', label: <span className="material-icons">format_list_bulleted</span>, title: '箇条書き (-)', attribute: '-', isActive: (a) => a === '-', group: 2 },
    { id: 'numbered', label: <span className="material-icons">format_list_numbered</span>, title: '番号付きリスト (1.)', attribute: '1.', isActive: (a) => /^\d+\.$/.test(a || ''), group: 3 },
    { id: 'asterisk', label: '*', title: 'アスタリスク (*)', attribute: '*', isActive: (a) => a === '*', group: 2 },
    { id: 'important', label: '!', title: 'キーメッセージ (!)', attribute: '!', isActive: (a) => a === '!', group: 2 },
    { id: 'alpha', label: 'A.', title: 'アルファベットリスト (A.)', attribute: 'A.', isActive: (a) => /^[A-Z]\.$/.test(a || ''), group: 3 },
    { id: 'clear', label: <span className="material-icons">format_clear</span>, title: '属性値を削除', attribute: null, isActive: (a) => a === null, group: 4 },
  ]

  // ボタンをグループごとにまとめる
  const getGroupedButtons = (buttons: ButtonConfig[], maxVisible: number) => {
    const visible: ButtonConfig[] = []
    const overflow: ButtonConfig[] = []
    let currentCount = 0
    const processedGroups = new Set<number>()

    for (const btn of buttons) {
      // 既に処理済みのグループはスキップ
      if (processedGroups.has(btn.group)) continue
      
      processedGroups.add(btn.group)
      // 新しいグループを追加できるか確認
      const groupButtons = buttons.filter(b => b.group === btn.group)
      if (currentCount + groupButtons.length <= maxVisible) {
        // グループ全体を追加
        visible.push(...groupButtons)
        currentCount += groupButtons.length
      } else {
        // このグループ以降をオーバーフローに
        const remainingButtons = buttons.filter(b => !processedGroups.has(b.group) || b.group === btn.group)
        overflow.push(...remainingButtons)
        break
      }
    }

    return { visible, overflow }
  }

  // オーバーフローメニューを閉じる（外側クリック）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    if (showOverflow) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOverflow])

  // ツールチップ表示ハンドラ
  const handleTooltipMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, text: string) => {
    // 既存のタイマーをクリア
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
    if (tooltipShowTimeoutRef.current) {
      clearTimeout(tooltipShowTimeoutRef.current)
      tooltipShowTimeoutRef.current = null
    }
    
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const gap = 8
    
    // ボタンの上に表示
    const x = rect.left + rect.width / 2
    const y = rect.top - gap
    
    // 少し遅延を設けてツールチップを表示（150msに短縮）
    tooltipShowTimeoutRef.current = setTimeout(() => {
      setTooltip({
        text,
        x,
        y
      })
    }, 150)
  }

  const handleTooltipMouseLeave = () => {
    // 表示待ちのタイマーをクリア
    if (tooltipShowTimeoutRef.current) {
      clearTimeout(tooltipShowTimeoutRef.current)
      tooltipShowTimeoutRef.current = null
    }
    // ツールチップを非表示にする
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null)
    }, 100)
  }

  // コンテナ幅を監視してvisibleCountを更新
  const updateVisibleCount = useCallback(() => {
    if (!barRef.current || !containerRef.current) return

    const containerWidth = containerRef.current.parentElement?.clientWidth || 0
    const buttonWidth = 32 // ボタン1つあたりの幅（padding込み）
    const dividerWidth = 12 // 区切り線の幅
    const overflowButtonWidth = 32 // ...ボタンの幅
    const padding = 24 // バーの左右パディング

    // 利用可能な幅を計算
    const availableWidth = containerWidth - padding - overflowButtonWidth

    // ボタン数を計算（グループごとの区切り線も考慮）
    // ボタン幅と区切り線を考慮して、より多くのボタンを表示
    const buttonsPerGroup = 2.5 // 平均ボタン数を少なく見積もり
    const widthPerGroup = buttonsPerGroup * buttonWidth + dividerWidth
    const maxGroups = Math.floor(availableWidth / widthPerGroup)
    const maxButtons = Math.ceil(maxGroups * buttonsPerGroup * 1.2) // 1.2倍で余裕を持たせる

    setVisibleCount(Math.max(6, maxButtons)) // 最低6ボタンは表示
  }, [])

  useEffect(() => {
    updateVisibleCount()

    const resizeObserver = new ResizeObserver(() => {
      updateVisibleCount()
    })

    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement)
    }

    return () => resizeObserver.disconnect()
  }, [updateVisibleCount])

  // Euler用のナビゲーションバー（itemTypeより先にチェック）
  if (mode === 'euler') {
    return (
      <>
      <div className="floating-nav-bar-container">
        <div className="floating-nav-bar">
          {/* モード切替 */}
          <div className="floating-nav-bar-group">
            <button
              className={`floating-nav-bar-btn ${eulerEditorMode === 'select' ? 'active' : ''}`}
              onClick={() => onEulerModeChange?.('select')}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '選択モード')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">near_me</span>
            </button>
            <button
              className={`floating-nav-bar-btn ${eulerEditorMode === 'add' ? 'active' : ''}`}
              onClick={() => onEulerModeChange?.('add')}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '追加モード（クリックで円を追加）')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">add_circle_outline</span>
            </button>
          </div>

          <div className="floating-nav-bar-divider" />

          {/* 円を追加 */}
          <div className="floating-nav-bar-group">
            <button
              className="floating-nav-bar-btn"
              onClick={() => onAddEulerCircle?.()}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '円（集合）を追加')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">radio_button_unchecked</span>
            </button>
            <button
              className="floating-nav-bar-btn"
              onClick={() => onAddEulerElement?.()}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '要素を追加')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">fiber_manual_record</span>
            </button>
          </div>

        </div>
      </div>
        
        {/* ツールチップ - createPortalでbodyに直接レンダリング */}
        {tooltip && createPortal(
          <div
            className="floating-nav-bar-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none',
              zIndex: 10000,
              marginTop: '-8px'
            }}
            onMouseEnter={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current)
                tooltipTimeoutRef.current = null
              }
            }}
            onMouseLeave={() => {
              setTooltip(null)
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
      </>
    )
  }

  if (!itemType) return null

  const handleSetAttributeClick = (attribute: string | null) => {
    // 複数行選択されている場合
    if (selection && selection.startLine !== selection.endLine && onSetAttributesForRange) {
      const startLine = Math.min(selection.startLine, selection.endLine)
      const endLine = Math.max(selection.startLine, selection.endLine)
      
      // トグル判定: 現在の属性と同じかどうか
      let shouldToggle = false
      
      if (attribute === null) {
        shouldToggle = false
      } else if (attribute === '1.' || attribute === 'A.') {
        if (attribute === '1.') {
          shouldToggle = /^\d+\.$/.test(currentAttribute || '')
        } else if (attribute === 'A.') {
          shouldToggle = /^[A-Z]\.$/.test(currentAttribute || '')
        }
      } else {
        shouldToggle = currentAttribute === attribute
      }
      
      const newAttribute = shouldToggle ? null : attribute
      onSetAttributesForRange(startLine, endLine, newAttribute)
      setShowOverflow(false)
      return
    }
    
    // 単一行の場合
    if (currentLine && onSetAttribute) {
      let shouldToggle = false
      
      if (attribute === null) {
        shouldToggle = false
      } else if (attribute === '1.' || attribute === 'A.') {
        if (attribute === '1.') {
          shouldToggle = /^\d+\.$/.test(currentAttribute || '')
        } else if (attribute === 'A.') {
          shouldToggle = /^[A-Z]\.$/.test(currentAttribute || '')
        }
      } else {
        shouldToggle = currentAttribute === attribute
      }
      
      const newAttribute = shouldToggle ? null : attribute
      onSetAttribute(currentLine, newAttribute)
    }
    setShowOverflow(false)
  }

  // Slide用のナビゲーションバー
  if (itemType === 'slide') {
    const { visible, overflow } = getGroupedButtons(slideButtons, visibleCount)
    const hasOverflow = overflow.length > 0

    // グループIDごとにボタンをレンダリング
    const renderButtonGroups = (buttons: ButtonConfig[], inMenu = false) => {
      const groups: { [key: number]: ButtonConfig[] } = {}
      buttons.forEach(btn => {
        if (!groups[btn.group]) groups[btn.group] = []
        groups[btn.group].push(btn)
      })

      const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b)

      return groupKeys.map((groupId, index) => (
        <div key={groupId} className={inMenu ? 'floating-nav-bar-menu-group' : 'floating-nav-bar-group'}>
          {groups[groupId].map(btn => (
            <button
              key={btn.id}
              className={`floating-nav-bar-btn ${btn.isActive?.(currentAttribute ?? null) ? 'active' : ''}`}
              onClick={() => handleSetAttributeClick(btn.attribute ?? null)}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, btn.title)}
              onMouseLeave={handleTooltipMouseLeave}
            >
              {btn.label}
            </button>
          ))}
          {!inMenu && index < groupKeys.length - 1 && <div className="floating-nav-bar-divider" />}
        </div>
      ))
    }

    return (
      <>
      <div ref={containerRef} className="floating-nav-bar-container">
        <div ref={barRef} className="floating-nav-bar">
          {renderButtonGroups(visible)}

          {/* オーバーフローボタン */}
          {hasOverflow && (
            <>
              <div className="floating-nav-bar-divider" />
              <div className="floating-nav-bar-group" ref={overflowRef}>
                <button
                  className={`floating-nav-bar-btn floating-nav-bar-overflow-btn ${showOverflow ? 'active' : ''}`}
                  onClick={() => setShowOverflow(!showOverflow)}
                   onMouseEnter={(e) => handleTooltipMouseEnter(e, 'その他のオプション')}
                   onMouseLeave={handleTooltipMouseLeave}
                >
                   <span className="material-icons">more_vert</span>
                </button>

                {/* オーバーフローメニュー */}
                {showOverflow && (
                  <div className="floating-nav-bar-overflow-menu">
                    {renderButtonGroups(overflow, true)}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 現在のスライドに移動ボタン */}
          {onScrollToCurrentSlide && (
            <>
              <div className="floating-nav-bar-divider" />
              <div className="floating-nav-bar-group">
                <button
                  className="floating-nav-bar-btn"
                  onClick={onScrollToCurrentSlide}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, '現在のスライドに移動')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">near_me</span>
                </button>
              </div>
            </>
          )}

          {/* 選択テキストからアイテムを作成ボタン */}
          {selection && onCreateItemFromSelection && (
            <>
              <div className="floating-nav-bar-divider" />
              <div className="floating-nav-bar-group">
                <button
                  className="floating-nav-bar-btn floating-nav-bar-btn-accent"
                  onClick={onCreateItemFromSelection}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, '選択テキストをアイテムとして追加')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">inventory_2</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
        
        {/* ツールチップ - createPortalでbodyに直接レンダリング */}
        {tooltip && createPortal(
          <div
            className="floating-nav-bar-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none',
              zIndex: 10000,
              marginTop: '-8px'
            }}
            onMouseEnter={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current)
                tooltipTimeoutRef.current = null
              }
            }}
            onMouseLeave={() => {
              setTooltip(null)
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
      </>
    )
  }

  // Table用ボタン定義（優先順位順・グループ分け）
  interface TableButtonConfig {
    id: string
    icon: string
    title: string
    operation: string
    operationArg?: string
    isActive?: () => boolean
    isDisabled?: () => boolean
    group: number
  }

  const tableButtons: TableButtonConfig[] = [
    // グループ1: セル結合
    { id: 'mergeCells', icon: 'call_merge', title: 'セルを結合', operation: 'mergeCells', isDisabled: () => !tableState?.canMerge, group: 1 },
    { id: 'unmergeCells', icon: 'call_split', title: 'セルの結合を解除', operation: 'unmergeCells', isDisabled: () => !tableState?.canUnmerge, group: 1 },
    // グループ2: 非表示の行を表示
    { id: 'showAllRows', icon: 'visibility', title: `非表示の行を表示 (${tableState?.hiddenRowsCount || 0}件)`, operation: 'showAllRows', isDisabled: () => !tableState?.hiddenRowsCount, group: 2 },
  ]

  // テーブルボタンをグループごとにまとめる
  const getGroupedTableButtons = (buttons: TableButtonConfig[], maxVisible: number) => {
    const visible: TableButtonConfig[] = []
    const overflow: TableButtonConfig[] = []
    let currentCount = 0
    const processedGroups = new Set<number>()

    for (const btn of buttons) {
      if (processedGroups.has(btn.group)) continue
      
      processedGroups.add(btn.group)
      const groupButtons = buttons.filter(b => b.group === btn.group)
      
      if (currentCount + groupButtons.length <= maxVisible) {
        visible.push(...groupButtons)
        currentCount += groupButtons.length
      } else {
        // このグループ以降をオーバーフローに
        const remainingButtons = buttons.filter(b => !visible.includes(b))
        overflow.push(...remainingButtons)
        break
      }
    }

    return { visible, overflow }
  }

  // Table用のナビゲーションバー
  if (itemType === 'table') {
    const { visible: visibleTableButtons, overflow: overflowTableButtons } = getGroupedTableButtons(tableButtons, visibleCount)
    const hasTableOverflow = overflowTableButtons.length > 0

    // テーブルボタンをグループごとにレンダリング
    const renderTableButtonGroups = (buttons: TableButtonConfig[], inMenu = false) => {
      const groups: { [key: number]: TableButtonConfig[] } = {}
      buttons.forEach(btn => {
        if (!groups[btn.group]) groups[btn.group] = []
        groups[btn.group].push(btn)
      })

      const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b)

      return groupKeys.map((groupId, index) => (
        <div key={groupId} className={inMenu ? 'floating-nav-bar-menu-group' : 'floating-nav-bar-group'}>
          {groups[groupId].map(btn => (
            <button
              key={btn.id}
              className={`floating-nav-bar-btn ${btn.isActive?.() ? 'active' : ''}`}
              onClick={() => btn.operationArg ? onTableOperation?.(btn.operation, btn.operationArg) : onTableOperation?.(btn.operation)}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, btn.title)}
              onMouseLeave={handleTooltipMouseLeave}
              disabled={btn.isDisabled?.()}
            >
              <span className="material-icons">{btn.icon}</span>
            </button>
          ))}
          {!inMenu && index < groupKeys.length - 1 && <div className="floating-nav-bar-divider" />}
          </div>
      ))
    }

    return (
      <>
      <div ref={containerRef} className="floating-nav-bar-container">
        <div ref={barRef} className="floating-nav-bar">
          {renderTableButtonGroups(visibleTableButtons)}

          {/* オーバーフローボタン */}
          {hasTableOverflow && (
            <>
          <div className="floating-nav-bar-divider" />
              <div className="floating-nav-bar-group" ref={overflowRef}>
            <button
                  className={`floating-nav-bar-btn floating-nav-bar-overflow-btn ${showOverflow ? 'active' : ''}`}
                  onClick={() => setShowOverflow(!showOverflow)}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, 'その他のオプション')}
              onMouseLeave={handleTooltipMouseLeave}
            >
                  <span className="material-icons">more_vert</span>
            </button>

                {/* オーバーフローメニュー */}
                {showOverflow && (
                  <div className="floating-nav-bar-overflow-menu">
                    {renderTableButtonGroups(overflowTableButtons, true)}
          </div>
                )}
              </div>
            </>
          )}
          </div>
        </div>
        
        {/* ツールチップ - createPortalでbodyに直接レンダリング */}
        {tooltip && createPortal(
          <div
            className="floating-nav-bar-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none',
              zIndex: 10000,
              marginTop: '-8px'
            }}
            onMouseEnter={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current)
                tooltipTimeoutRef.current = null
              }
            }}
            onMouseLeave={() => {
              setTooltip(null)
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
      </>
    )
  }

  // Image用のナビゲーションバー
  if (itemType === 'image') {
    return (
      <>
      <div className="floating-nav-bar-container">
        <div className="floating-nav-bar">
          {/* 切り抜き */}
          <div className="floating-nav-bar-group">
            <button
              className={`floating-nav-bar-btn ${imageState?.isCropping ? 'active' : ''}`}
              onClick={() => onImageOperation?.('toggleCrop')}
                onMouseEnter={(e) => handleTooltipMouseEnter(e, '画像を切り抜き')}
                onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">crop</span>
            </button>
          </div>

          <div className="floating-nav-bar-divider" />

          {/* 表示モード */}
          <div className="floating-nav-bar-group">
            <button
              className={`floating-nav-bar-btn ${imageState?.displayMode === 'contain' ? 'active' : ''}`}
              onClick={() => onImageOperation?.('setDisplayMode', 'contain')}
                onMouseEnter={(e) => handleTooltipMouseEnter(e, 'Contain（全体を表示）')}
                onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">fit_screen</span>
            </button>
            <button
              className={`floating-nav-bar-btn ${imageState?.displayMode === 'cover' ? 'active' : ''}`}
              onClick={() => onImageOperation?.('setDisplayMode', 'cover')}
                onMouseEnter={(e) => handleTooltipMouseEnter(e, 'Cover（領域を埋める）')}
                onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">aspect_ratio</span>
            </button>
          </div>

          </div>
        </div>
        
        {/* ツールチップ - createPortalでbodyに直接レンダリング */}
        {tooltip && createPortal(
          <div
            className="floating-nav-bar-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none',
              zIndex: 10000,
              marginTop: '-8px'
            }}
            onMouseEnter={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current)
                tooltipTimeoutRef.current = null
              }
            }}
            onMouseLeave={() => {
              setTooltip(null)
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
      </>
    )
  }

  // Pictogram用のナビゲーションバー
  if (itemType === 'pictogram') {
    return (
      <>
      <div className="floating-nav-bar-container">
        <div className="floating-nav-bar">
          {/* モード切替 */}
          <div className="floating-nav-bar-group">
            <button
              className={`floating-nav-bar-btn ${pictogramState?.mode === 'select' ? 'active' : ''}`}
              onClick={() => onPictogramOperation?.('setMode', 'select')}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '選択モード (V)')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">near_me</span>
            </button>
            <button
              className={`floating-nav-bar-btn ${pictogramState?.mode === 'connect' ? 'active' : ''}`}
              onClick={() => onPictogramOperation?.('setMode', 'connect')}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '接続モード (C)')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">trending_flat</span>
            </button>
            <button
              className={`floating-nav-bar-btn ${pictogramState?.mode === 'comment' ? 'active' : ''}`}
              onClick={() => onPictogramOperation?.('setMode', 'comment')}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, 'コメントモード (T)')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">chat_bubble_outline</span>
            </button>
          </div>

          <div className="floating-nav-bar-divider" />

          {/* 削除・グループ化 */}
          <div className="floating-nav-bar-group">
            <button
              className="floating-nav-bar-btn"
              onClick={() => onPictogramOperation?.('delete')}
              disabled={!pictogramState?.canDelete}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '削除 (Delete)')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">delete_outline</span>
            </button>
            <button
              className="floating-nav-bar-btn"
              onClick={() => onPictogramOperation?.('group')}
              disabled={!pictogramState?.canGroup}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, 'グループ化 (Ctrl+G)')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">group_work</span>
            </button>
          </div>

          <div className="floating-nav-bar-divider" />

          {/* 要素追加パレット */}
          <div className="floating-nav-bar-group" ref={overflowRef}>
            <button
              className={`floating-nav-bar-btn ${showOverflow ? 'active' : ''}`}
              onClick={() => setShowOverflow(!showOverflow)}
              onMouseEnter={(e) => handleTooltipMouseEnter(e, '要素を追加')}
              onMouseLeave={handleTooltipMouseLeave}
            >
              <span className="material-icons">add</span>
            </button>

            {/* 要素追加メニュー */}
            {showOverflow && (
              <div className="floating-nav-bar-overflow-menu floating-nav-bar-picto-palette">
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('person'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, 'ヒト')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">person</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('company'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, '会社')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">business</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('money'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, 'カネ')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">payments</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('product'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, 'モノ')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">inventory_2</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('info'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, '情報')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">info</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('smartphone'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, 'スマホ')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">smartphone</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('store'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, '店舗')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">storefront</span>
                </button>
                <button
                  className="floating-nav-bar-btn"
                  onClick={() => { onAddPictogramElement?.('other'); setShowOverflow(false) }}
                  onMouseEnter={(e) => handleTooltipMouseEnter(e, 'その他')}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <span className="material-icons">category</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
        
        {/* ツールチップ - createPortalでbodyに直接レンダリング */}
        {tooltip && createPortal(
          <div
            className="floating-nav-bar-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none',
              zIndex: 10000,
              marginTop: '-8px'
            }}
            onMouseEnter={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current)
                tooltipTimeoutRef.current = null
              }
            }}
            onMouseLeave={() => {
              setTooltip(null)
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
      </>
    )
  }

  // Text用は現在実装なし
  return null
}
