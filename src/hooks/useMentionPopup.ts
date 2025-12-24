import { useState, useCallback, useMemo } from 'react'
import type { Item } from '../types'

interface UseMentionPopupOptions {
  items: Item[]
  onInsert: (itemName: string, replaceStart: number, replaceEnd: number) => void
}

interface UseMentionPopupReturn {
  isOpen: boolean
  searchQuery: string
  selectedIndex: number
  position: { x: number; y: number }
  showAbove: boolean  // 上に表示するかどうか
  filteredItems: Item[]
  handleKeyDown: (e: React.KeyboardEvent) => boolean // trueならイベント消費
  handleChange: (value: string, cursorPos: number, inputRect: DOMRect) => void
  close: () => void
}

export const useMentionPopup = ({
  items,
  onInsert,
}: UseMentionPopupOptions): UseMentionPopupReturn => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showAbove, setShowAbove] = useState(false)  // 上に表示するかどうか
  const [mentionStart, setMentionStart] = useState(-1) // @の位置

  // 検索クエリでアイテムをフィルタリング
  // 'new' タイプと 'main-slide' は除外（自己参照を防ぐ）
  const filteredItems = useMemo(() => {
    const baseFilter = (item: Item) => item.type !== 'new' && item.id !== 'main-slide'
    
    if (!searchQuery) {
      return items.filter(baseFilter)
    }
    const query = searchQuery.toLowerCase()
    return items.filter(
      item => baseFilter(item) && item.name.toLowerCase().includes(query)
    )
  }, [items, searchQuery])

  // ポップアップを閉じる
  const close = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
    setSelectedIndex(0)
    setMentionStart(-1)
  }, [])

  // アイテムを選択して挿入
  const selectItem = useCallback((index: number) => {
    const item = filteredItems[index]
    if (item && mentionStart >= 0) {
      // @から現在位置までを置換（@は含める）
      const replaceEnd = mentionStart + 1 + searchQuery.length
      onInsert(item.name, mentionStart, replaceEnd)
      close()
    }
  }, [filteredItems, mentionStart, searchQuery, onInsert, close])

  // キーボードイベントのハンドラー
  const handleKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
    // #region agent log
    if (e.key === 'Enter') { fetch('http://127.0.0.1:7242/ingest/3d96004e-9efe-481b-a1bb-1edda335d827',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMentionPopup.ts:handleKeyDown',message:'Enter in mentionPopup',data:{isOpen,filteredItemsLength:filteredItems.length,searchQuery},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{}); }
    // #endregion
    if (!isOpen) return false

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
        return true

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
        return true

      case 'Tab':
      case 'Enter':
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3d96004e-9efe-481b-a1bb-1edda335d827',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMentionPopup.ts:EnterCase',message:'Enter case reached',data:{filteredItemsLength:filteredItems.length,selectedIndex,willConsumeEnter:filteredItems.length>0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (filteredItems.length > 0) {
          e.preventDefault()
          selectItem(selectedIndex)
          return true
        }
        close()
        return false

      case 'Escape':
        e.preventDefault()
        close()
        return true

      default:
        return false
    }
  }, [isOpen, filteredItems.length, selectedIndex, selectItem, close])

  // 入力変更時のハンドラー
  const handleChange = useCallback((
    value: string,
    cursorPos: number,
    inputRect: DOMRect
  ) => {
    // カーソル位置より前のテキストを取得
    const textBeforeCursor = value.slice(0, cursorPos)
    
    // 最後の@を探す（スペースより後にある場合のみ）
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex === -1) {
      // @がない場合は閉じる
      if (isOpen) close()
      return
    }

    // @より前にスペースがあるか、または@が先頭にあるかチェック
    const textBeforeAt = textBeforeCursor.slice(0, lastAtIndex)
    const isValidPosition = lastAtIndex === 0 || /\s$/.test(textBeforeAt)

    if (!isValidPosition) {
      // @の前がスペースでない場合は閉じる
      if (isOpen) close()
      return
    }

    // @より後のテキスト（検索クエリ）
    const queryText = textBeforeCursor.slice(lastAtIndex + 1)

    // スペースが含まれている場合は閉じる
    if (queryText.includes(' ')) {
      if (isOpen) close()
      return
    }

    // ポップアップを開く/更新
    if (!isOpen) {
      setIsOpen(true)
      setMentionStart(lastAtIndex)
    }

    setSearchQuery(queryText)
    setSelectedIndex(0) // 検索クエリが変わったら選択をリセット

    // ポップアップの位置を計算
    // カーソル位置に基づいて計算（文字幅は約7.2px）
    const charWidth = 7.2
    const cursorX = inputRect.left + (cursorPos - lastAtIndex) * charWidth
    
    // ポップアップの推定高さ（最大300px + マージン）
    const popupHeight = 300
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - inputRect.bottom
    const spaceAbove = inputRect.top
    
    // 下に十分なスペースがない場合は上に表示
    const shouldShowAbove = spaceBelow < popupHeight && spaceAbove > spaceBelow
    setShowAbove(shouldShowAbove)
    
    const cursorY = shouldShowAbove 
      ? inputRect.top - 4  // 上に表示する場合は入力欄の上端
      : inputRect.bottom + 4  // 下に表示する場合は入力欄の下端

    setPosition({
      x: Math.max(0, cursorX - 20), // 少し左にオフセット
      y: cursorY,
    })
  }, [isOpen, close])

  return {
    isOpen,
    searchQuery,
    selectedIndex,
    position,
    showAbove,
    filteredItems,
    handleKeyDown,
    handleChange,
    close,
  }
}
