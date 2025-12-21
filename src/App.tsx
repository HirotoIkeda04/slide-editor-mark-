import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Slide, SlideFormat, Tone, ConsoleMessage, Item, EditorLine, EditorSelection, ImpressionCode, ImpressionStyleVars, StylePins, NewItem } from './types'
import { NEW_ITEM_ID } from './types'
import { generateConsoleMessages } from './utils/validation'
import { loadPresentation } from './utils/slides'
import { extractSlideLayout, splitSlidesByHeading, getSlideStartLines } from './utils/markdown'
import { formatConfigs } from './constants/formatConfigs'
import { createItem, updateItem, deleteItem, generateUniqueItemName } from './utils/items'
import { parseMarkdownTable } from './utils/tableUtils'
import { saveItemsToLocalStorage, loadItemsFromLocalStorage } from './utils/fileSystem'
import { contentToLines, linesToContent, linesToAttributeMap } from './utils/attributes'
import { DEFAULT_IMPRESSION_CODE, findMatchingPreset } from './constants/impressionConfigs'
import type { SlideItem } from './types'
import { ThemeProvider } from './contexts/ThemeContext'

const MAIN_SLIDE_ITEM_ID = 'main-slide'

// 新しいアイテムプレースホルダーを作成
const createNewItemPlaceholder = (): NewItem => ({
  id: NEW_ITEM_ID,
  name: '新しいアイテム',
  type: 'new',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})
import { Toolbar } from './components/toolbar/Toolbar'
import { ExportModal } from './components/modal/ExportModal'
import { HelpModal } from './components/modal/HelpModal'
import { FormatTabs } from './components/preview/FormatTabs'
import { Preview } from './components/preview/Preview'
import { SlideCarousel } from './components/slideCarousel/SlideCarousel'
import { EditorArea } from './components/editor/EditorArea'
import { ItemModal } from './components/items/ItemModal'
import { SlideShowView } from './components/slideshow/SlideShowView'
import './App.css'

// Default content
const DEFAULT_CONTENT = `#ttl プレゼンテーションタイトル

あなたのプレゼンテーションをここに作成

#agd 目次

# セクション1

## セクション1-a

- ポイント1
- ポイント2
- ポイント3

## セクション1-b

- ポイント1
- ポイント2
- ポイント3

# セクション2

! 重要な内容をここに記述

1. 最初のステップ
2. 次のステップ
3. 最後のステップ

#! まとめ

- 結論1
- 結論2
- 結論3

ご清聴ありがとうございました`

function App() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentFormat, setCurrentFormat] = useState<SlideFormat>('webinar')
  
  // 印象コードシステム
  const [impressionCode, setImpressionCode] = useState<ImpressionCode>(DEFAULT_IMPRESSION_CODE)
  const [styleOverrides, setStyleOverrides] = useState<Partial<ImpressionStyleVars>>({})
  const [stylePins, setStylePins] = useState<StylePins>({})
  const [isTonmanaSelected, setIsTonmanaSelected] = useState(false)
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>('plain-gray')
  
  // スタイルオーバーライドを更新するハンドラー
  const handleStyleOverride = useCallback((overrides: Partial<ImpressionStyleVars>) => {
    setStyleOverrides(prev => ({ ...prev, ...overrides }))
  }, [])
  
  // ピン留め状態を更新するハンドラー
  const handleStylePinChange = useCallback((pins: Partial<StylePins>) => {
    setStylePins(prev => ({ ...prev, ...pins }))
  }, [])
  
  // 印象コード変更時のハンドラー（ピン留めされていない項目をクリア）
  const handleImpressionCodeChange = useCallback((newCode: ImpressionCode) => {
    setImpressionCode(newCode)
    // ピン留めされていない項目をstyleOverridesからクリア
    setStyleOverrides(prev => {
      const filtered: Partial<ImpressionStyleVars> = {}
      if (stylePins.primary && prev.primary !== undefined) {
        filtered.primary = prev.primary
      }
      if (stylePins.background && prev.background !== undefined) {
        filtered.background = prev.background
      }
      if (stylePins.accent && prev.accent !== undefined) {
        filtered.accent = prev.accent
      }
      if (stylePins.fontFamily && prev.fontFamily !== undefined) {
        filtered.fontFamily = prev.fontFamily
      }
      if (stylePins.borderRadius && prev.borderRadius !== undefined) {
        filtered.borderRadius = prev.borderRadius
      }
      return filtered
    })
  }, [stylePins])
  
  // Legacy: 印象コードからToneを導出（後方互換性のため）
  const currentTone = useMemo((): Tone => {
    const preset = findMatchingPreset(impressionCode)
    if (preset) {
      // プリセットIDが旧Tone型と一致する場合はそれを使用
      if (['simple', 'casual', 'luxury', 'warm'].includes(preset.id)) {
        return preset.id as Tone
      }
    }
    // デフォルトは'simple'
    return 'simple'
  }, [impressionCode])
  
  const [items, setItems] = useState<Item[]>([createNewItemPlaceholder()])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(MAIN_SLIDE_ITEM_ID)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  
  // Line-based editor state
  const [lines, setLines] = useState<EditorLine[]>(() => contentToLines(DEFAULT_CONTENT))
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentAttribute, setCurrentAttribute] = useState<string | null>(null)
  const [selection, setSelection] = useState<EditorSelection | null>(null)
  const [scrollToLine, setScrollToLine] = useState<number | null>(null)
  
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [isComposing, setIsComposing] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)
  const lastSyncedContentRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)
  const [isBulkExporting, setIsBulkExporting] = useState(false)
  const [isPptExporting, setIsPptExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showSlideShow, setShowSlideShow] = useState(false)
  const [editingHeaderItemId, setEditingHeaderItemId] = useState<string | null>(null)
  const [editingHeaderName, setEditingHeaderName] = useState('')
  const [headerNameError, setHeaderNameError] = useState('')
  const headerNameInputRef = useRef<HTMLInputElement>(null)
  
  // Undo/Redo用の履歴管理
  const historyRef = useRef<EditorLine[][]>([])
  const historyIndexRef = useRef(-1)
  const isUndoRedoRef = useRef(false)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  // エディタエリアの幅（パーセント）
  const [editorWidth, setEditorWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const resizeContainerRef = useRef<HTMLDivElement>(null)

  // Derived editorContent from lines (for compatibility) - memoized for performance
  const editorContent = useMemo(() => linesToContent(lines), [lines])
  
  // Derived attributeMap from lines (for compatibility) - memoized for performance
  const attributeMap = useMemo(() => linesToAttributeMap(lines), [lines])

  // アイテムの初期化
  useEffect(() => {
    const loadedItems = loadItemsFromLocalStorage()
    
    // 'new' タイプのアイテムを除外（localStorageには保存されないはずだが念のため）
    const filteredItems = loadedItems.filter(item => item.type !== 'new')
    
    // メインスライドアイテムが存在しない場合は作成
    const mainSlideItem = filteredItems.find(item => item.id === MAIN_SLIDE_ITEM_ID)
    if (!mainSlideItem) {
      const newMainSlideItem = createItem('Main Slides', 'slide', {
        content: editorContent
      } as Partial<SlideItem>)
      newMainSlideItem.id = MAIN_SLIDE_ITEM_ID
      // 新しいアイテムプレースホルダーを追加
      setItems([newMainSlideItem, ...filteredItems, createNewItemPlaceholder()])
      setSelectedItemId(MAIN_SLIDE_ITEM_ID)
      lastSyncedContentRef.current = editorContent
    } else {
      // メインスライドアイテムが存在する場合、エディタの内容を同期
      if (mainSlideItem.type === 'slide') {
        setLines(contentToLines(mainSlideItem.content))
        lastSyncedContentRef.current = mainSlideItem.content
      }
      // 新しいアイテムプレースホルダーを追加
      setItems([...filteredItems, createNewItemPlaceholder()])
      setSelectedItemId(MAIN_SLIDE_ITEM_ID)
    }
    
    isInitializedRef.current = true
  }, [])

  // 履歴にエディタ内容を追加する関数
  const addToHistory = useCallback((newLines: EditorLine[]) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(newLines.map(l => ({ ...l })))
    if (historyRef.current.length > 100) {
      historyRef.current = historyRef.current.slice(-100)
    }
    historyIndexRef.current = historyRef.current.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  // Undo処理
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }
      isUndoRedoRef.current = true
      historyIndexRef.current--
      const previousLines = historyRef.current[historyIndexRef.current]
      setLines(previousLines.map(l => ({ ...l })))
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 0)
    }
  }, [])

  // Redo処理
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true
      historyIndexRef.current++
      const nextLines = historyRef.current[historyIndexRef.current]
      setLines(nextLines.map(l => ({ ...l })))
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
      setTimeout(() => {
        isUndoRedoRef.current = false
      }, 0)
    }
  }, [])

  // エディタ内容の変更を履歴に記録（デバウンス付き）
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (isUndoRedoRef.current) return
    
    if (historyRef.current.length === 0) {
      addToHistory(lines)
      return
    }
    
    // Compare with current history entry
    const currentHistory = historyRef.current[historyIndexRef.current]
    const isSame = currentHistory && 
      currentHistory.length === lines.length &&
      currentHistory.every((l, i) => 
        l.id === lines[i].id && 
        l.attribute === lines[i].attribute && 
        l.text === lines[i].text
      )
    
    if (isSame) return
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(() => {
      addToHistory(lines)
    }, 200)
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [lines, addToHistory])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // エディタの内容とメインスライドアイテムを同期（エディタ→アイテム）
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (isSyncingRef.current) return
    
    const mainSlideItem = items.find(item => item.id === MAIN_SLIDE_ITEM_ID)
    if (mainSlideItem && mainSlideItem.type === 'slide') {
      if (mainSlideItem.content !== editorContent) {
        isSyncingRef.current = true
        setItems(prevItems => updateItem(prevItems, MAIN_SLIDE_ITEM_ID, {
          content: editorContent
        } as Partial<SlideItem>))
        lastSyncedContentRef.current = editorContent
        setTimeout(() => {
          isSyncingRef.current = false
        }, 0)
      }
    }
  }, [editorContent, items])

  // メインスライドアイテムとエディタの内容を同期（アイテム→エディタ）
  // 注意: この同期は外部からの変更（AI編集など）のみを対象とする
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (isSyncingRef.current) return
    
    const mainSlideItem = items.find(item => item.id === MAIN_SLIDE_ITEM_ID)
    if (mainSlideItem && mainSlideItem.type === 'slide') {
      if (lastSyncedContentRef.current !== mainSlideItem.content) {
        isSyncingRef.current = true
        setLines(contentToLines(mainSlideItem.content))
        lastSyncedContentRef.current = mainSlideItem.content
        setTimeout(() => {
          isSyncingRef.current = false
        }, 0)
      }
    }
  }, [items])

  // 選択されているアイテムが存在するかチェック
  useEffect(() => {
    if (items.length === 0) return
    
    if (selectedItemId) {
      const selectedItem = items.find(item => item.id === selectedItemId)
      if (!selectedItem && selectedItemId !== MAIN_SLIDE_ITEM_ID) {
        setSelectedItemId(MAIN_SLIDE_ITEM_ID)
      }
    } else if (selectedItemId === null) {
      const mainSlideItem = items.find(item => item.id === MAIN_SLIDE_ITEM_ID)
      if (mainSlideItem) {
        setSelectedItemId(MAIN_SLIDE_ITEM_ID)
      }
    }
  }, [items, selectedItemId])

  // ヘッダー編集: アイテムが変更されたら編集状態をリセット
  useEffect(() => {
    setEditingHeaderItemId(null)
    setHeaderNameError('')
  }, [selectedItemId])

  // ヘッダー編集: 編集モードに入ったときにフォーカスを設定
  useEffect(() => {
    if (editingHeaderItemId && headerNameInputRef.current) {
      headerNameInputRef.current.focus()
      headerNameInputRef.current.select()
    }
  }, [editingHeaderItemId])

  // アイテムをlocalStorageに保存（'new' タイプは除外）
  useEffect(() => {
    if (!isInitializedRef.current) return
    const hasMainSlide = items.some(item => item.id === MAIN_SLIDE_ITEM_ID)
    if (!hasMainSlide) return
    // 'new' タイプのアイテムは保存しない
    const itemsToSave = items.filter(item => item.type !== 'new')
    saveItemsToLocalStorage(itemsToSave)
  }, [items])

  // スライドのパース
  useEffect(() => {
    const slideSplitLevel = formatConfigs[currentFormat].slideSplitLevel
    const slideTexts = splitSlidesByHeading(editorContent, slideSplitLevel, attributeMap)
    const parsedSlides = slideTexts
      .map((text) => {
        const trimmedContent = text.trim()
        return {
          content: trimmedContent,
          layout: extractSlideLayout(trimmedContent)
        }
      })
    
    setSlides(parsedSlides)
    if (currentIndex >= parsedSlides.length) {
      setCurrentIndex(Math.max(0, parsedSlides.length - 1))
    }
  }, [editorContent, currentIndex, currentFormat, attributeMap])

  // 各スライドの開始行を計算（現在のスライドに移動機能用）
  const slideStartLines = useMemo(() => {
    const slideSplitLevel = formatConfigs[currentFormat].slideSplitLevel
    return getSlideStartLines(editorContent, slideSplitLevel, attributeMap)
  }, [editorContent, currentFormat, attributeMap])

  // コンソールメッセージの生成
  useEffect(() => {
    const messages = generateConsoleMessages(editorContent)
    setConsoleMessages(messages)
  }, [editorContent])

  // Handle current line change from editor
  const handleCurrentLineChange = useCallback((lineIndex: number, attribute: string | null) => {
    setCurrentLineIndex(lineIndex)
    setCurrentAttribute(attribute)
  }, [])

  // Handle selection change from editor
  const handleSelectionChange = useCallback((newSelection: EditorSelection | null) => {
    setSelection(newSelection)
  }, [])

  // Set attribute for current line (from FloatingNavBar)
  const handleSetAttribute = useCallback((lineNumber: number, attribute: string | null) => {
    const lineIndex = lineNumber - 1
    if (lineIndex < 0 || lineIndex >= lines.length) return
    
    const newLines = [...lines]
    newLines[lineIndex] = { ...newLines[lineIndex], attribute }
    setLines(newLines)
  }, [lines])

  // Set attributes for range (from FloatingNavBar)
  const handleSetAttributesForRange = useCallback((startLine: number, endLine: number, attribute: string | null) => {
    const startIndex = startLine - 1
    const endIndex = endLine - 1
    
    const newLines = [...lines]
    for (let i = startIndex; i <= endIndex && i < lines.length; i++) {
      if (i >= 0) {
        newLines[i] = { ...newLines[i], attribute }
      }
    }
    setLines(newLines)
  }, [lines])

  // アイテム管理のハンドラー
  const handleEditItem = (item: Item) => {
    if (item.id === MAIN_SLIDE_ITEM_ID) {
      return
    }
    setEditingItem(item)
    setShowItemModal(true)
  }

  const handleCreateItem = (itemData: Partial<Item>) => {
    const newItem = createItem(
      itemData.name!,
      itemData.type!,
      itemData
    )
    // 'new' アイテムを除外し、新しいアイテムを追加、新しい 'new' プレースホルダーを追加
    setItems(prev => {
      const itemsWithoutNew = prev.filter(item => item.id !== NEW_ITEM_ID)
      return [...itemsWithoutNew, newItem, createNewItemPlaceholder()]
    })
    setSelectedItemId(newItem.id)  // 作成したアイテムを選択
  }

  const handleUpdateItem = (itemId: string, updates: Partial<Item>) => {
    setItems(prev => updateItem(prev, itemId, updates))
  }

  const handleDeleteItem = (itemId: string) => {
    // メインスライドと'new'タイプのアイテムは削除できない
    if (itemId === MAIN_SLIDE_ITEM_ID) {
      return
    }
    const itemToDelete = items.find(item => item.id === itemId)
    if (itemToDelete && itemToDelete.type === 'new') {
      return
    }
    
    setItems(prev => {
      const updatedItems = deleteItem(prev, itemId)
      // 削除後に選択が無効になった場合はメインスライドを選択
      if (selectedItemId === itemId) {
        setSelectedItemId(MAIN_SLIDE_ITEM_ID)
      }
      return updatedItems
    })
  }

  const handleSaveItem = (itemData: Partial<Item>) => {
    if (editingItem) {
      setItems(prev => updateItem(prev, editingItem.id, itemData))
    } else {
      const newItem = createItem(
        itemData.name!,
        itemData.type!,
        itemData
      )
      setItems(prev => [...prev, newItem])
    }
    setShowItemModal(false)
    setEditingItem(null)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentIndex(prevIndex => {
      if (direction === 'prev' && prevIndex > 0) {
        return prevIndex - 1
      } else if (direction === 'next' && prevIndex < slides.length - 1) {
        return prevIndex + 1
      }
      return prevIndex
    })
  }

  const handleCreateTable = (name: string, headers: string[] | undefined, data: string[][]) => {
    const newTableItem = createItem(name, 'table', {
      headers,
      data
    })
    
    // 'new' アイテムの前に挿入し、新しいプレースホルダーを再生成
    setItems(prevItems => {
      const itemsWithoutNew = prevItems.filter(item => item.id !== NEW_ITEM_ID)
      return [...itemsWithoutNew, newTableItem, createNewItemPlaceholder()]
    })
    
    setSelectedItemId(newTableItem.id)
  }

  // Handle content update from external sources (e.g., AI chat)
  const handleSetEditorContent = useCallback((content: string) => {
    setLines(contentToLines(content))
  }, [])

  // 現在のスライドに対応するエディタ行にスクロール
  const handleScrollToCurrentSlide = useCallback(() => {
    if (slideStartLines.length > 0 && currentIndex < slideStartLines.length) {
      const targetLine = slideStartLines[currentIndex]
      setScrollToLine(targetLine)
      // スクロール後にリセット（連続クリック対応）
      setTimeout(() => setScrollToLine(null), 100)
    }
  }, [slideStartLines, currentIndex])

  // 選択範囲からテキストを抽出
  const extractSelectedText = useCallback((sel: EditorSelection, lineData: EditorLine[]): string => {
    const { startLine, startChar, endLine, endChar } = sel
    let text = ''

    for (let i = startLine; i <= endLine; i++) {
      const line = lineData[i]
      if (!line) continue
      
      const lineText = line.text
      let start = 0
      let end = lineText.length

      if (i === startLine) start = startChar
      if (i === endLine) end = endChar

      text += lineText.slice(start, end)
      if (i < endLine) text += '\n'
    }

    return text
  }, [])

  // 選択テキストからアイテムを作成
  const handleCreateItemFromSelection = useCallback(() => {
    if (!selection) return

    const selectedText = extractSelectedText(selection, lines)
    if (!selectedText.trim()) return

    const existingNames = items.map(item => item.name)

    // Markdownテーブル形式かどうかを判定
    const parsedTable = parseMarkdownTable(selectedText)

    if (parsedTable && (parsedTable.headers.length > 0 || parsedTable.data.length > 0)) {
      // テーブルアイテムとして作成
      const name = generateUniqueItemName('Table', existingNames)
      const newItem = createItem(name, 'table', {
        data: parsedTable.data,
        headers: parsedTable.hasHeaders ? parsedTable.headers : undefined
      })
      // 'new' アイテムの前に挿入し、新しいプレースホルダーを再生成
      setItems(prev => {
        const itemsWithoutNew = prev.filter(item => item.id !== NEW_ITEM_ID)
        return [...itemsWithoutNew, newItem, createNewItemPlaceholder()]
      })
      setSelectedItemId(newItem.id)
      setSelection(null)
    } else {
      // テキストアイテムとして作成
      const name = generateUniqueItemName('Text', existingNames)
      const newItem = createItem(name, 'text', {
        content: selectedText
      })
      // 'new' アイテムの前に挿入し、新しいプレースホルダーを再生成
      setItems(prev => {
        const itemsWithoutNew = prev.filter(item => item.id !== NEW_ITEM_ID)
        return [...itemsWithoutNew, newItem, createNewItemPlaceholder()]
      })
      setSelectedItemId(newItem.id)
      setSelection(null)
    }
  }, [selection, lines, items, extractSelectedText])

  // リサイズハンドラ
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  // リサイズ中の処理
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeContainerRef.current) return
      
      const containerRect = resizeContainerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const mouseX = e.clientX - containerRect.left
      
      // プレビュー側の幅をマウス位置から計算
      const previewWidthPercent = (mouseX / containerWidth) * 100
      // エディタ側の幅
      const editorWidthPercent = 100 - previewWidthPercent
      
      // 最小幅30%、最大幅70%に制限
      const clampedEditorWidth = Math.min(Math.max(editorWidthPercent, 30), 70)
      setEditorWidth(clampedEditorWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <ThemeProvider>
    <div className="h-screen max-h-screen flex flex-col overflow-hidden">
      <Toolbar
        onShowHelp={() => setShowHelpModal(true)}
        onShowExport={() => setShowExportModal(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        slides={slides}
        currentIndex={currentIndex}
        currentFormat={currentFormat}
        previewRef={previewRef}
        isBulkExporting={isBulkExporting}
        isPptExporting={isPptExporting}
        editorContent={editorContent}
        setCurrentIndex={setCurrentIndex}
        setIsBulkExporting={setIsBulkExporting}
        setIsPptExporting={setIsPptExporting}
      />

      <HelpModal
        show={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* スライドショー表示 */}
      {showSlideShow && (
        <SlideShowView
          slides={slides}
          currentIndex={currentIndex}
          currentFormat={currentFormat}
          currentTone={currentTone}
          impressionCode={impressionCode}
          styleOverrides={styleOverrides}
          selectedBiomeId={selectedBiomeId}
          items={items}
          onClose={() => setShowSlideShow(false)}
          onNavigate={setCurrentIndex}
        />
      )}

      {/* メインエリア */}
      {!showSlideShow && (
      <div 
        ref={resizeContainerRef}
        className={`flex-1 flex overflow-hidden ${isResizing ? 'select-none' : ''}`}
      >
        {/* プレビュー */}
        <div className="flex flex-col p-4" style={{ width: `${100 - editorWidth}%` }}>
          {/* プレビューエリア */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, position: 'relative' }}
          >
            {/* FormatTabs を左上に絶対配置 */}
            <FormatTabs
              currentFormat={currentFormat}
              onFormatChange={setCurrentFormat}
            />
            <Preview
              slides={slides}
              currentIndex={currentIndex}
              currentFormat={currentFormat}
              currentTone={currentTone}
              impressionCode={impressionCode}
              styleOverrides={styleOverrides}
              selectedBiomeId={selectedBiomeId}
              previewRef={previewRef}
              items={items}
              onNavigate={handleNavigate}
              onStartSlideShow={() => {
                if (slides.length > 0) {
                  setShowSlideShow(true)
                } else {
                  alert('スライドがありません')
                }
              }}
            />
          </div>

          {/* プレビューとカルーセルの区切り線 */}
          <div className="preview-carousel-divider" />

          <SlideCarousel
            slides={slides}
            currentIndex={currentIndex}
            currentFormat={currentFormat}
            currentTone={currentTone}
            impressionCode={impressionCode}
            styleOverrides={styleOverrides}
            selectedBiomeId={selectedBiomeId}
            items={items}
            setCurrentIndex={setCurrentIndex}
          />
        </div>

        {/* リサイズハンドル */}
        <div 
          className="resize-handle"
          onMouseDown={handleResizeStart}
        />

        {/* エディター + アイテムタブバー */}
        <EditorArea
          width={editorWidth}
          items={items}
          selectedItemId={selectedItemId}
          onLoad={() => loadPresentation(handleSetEditorContent, setCurrentIndex)}
          onSelectItem={(itemId) => {
            setSelectedItemId(itemId)
            setIsTonmanaSelected(false)
          }}
          onEditItem={handleEditItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          existingNames={items.map(item => item.name)}
          onCreateItem={handleCreateItem}
          isTonmanaSelected={isTonmanaSelected}
          onSelectTonmana={() => {
            setIsTonmanaSelected(true)
            setSelectedItemId(null)
          }}
          impressionCode={impressionCode}
          onImpressionCodeChange={handleImpressionCodeChange}
          styleOverrides={styleOverrides}
          onStyleOverride={handleStyleOverride}
          stylePins={stylePins}
          onStylePinChange={handleStylePinChange}
          selectedBiomeId={selectedBiomeId}
          onBiomeChange={setSelectedBiomeId}
          lines={lines}
          setLines={setLines}
          isComposing={isComposing}
          setIsComposing={setIsComposing}
          consoleMessages={consoleMessages}
          scrollToLine={scrollToLine}
          onCurrentLineChange={handleCurrentLineChange}
          onSelectionChange={handleSelectionChange}
          currentLineIndex={currentLineIndex}
          currentAttribute={currentAttribute}
          selection={selection}
          onSetAttribute={handleSetAttribute}
          onSetAttributesForRange={handleSetAttributesForRange}
          onScrollToCurrentSlide={handleScrollToCurrentSlide}
          onCreateItemFromSelection={handleCreateItemFromSelection}
          editorContent={editorContent}
          onApplyEdit={handleSetEditorContent}
          onCreateTable={handleCreateTable}
          onScrollToLine={(lineIndex) => {
            setScrollToLine(lineIndex)
            setTimeout(() => setScrollToLine(null), 100)
          }}
          editingHeaderItemId={editingHeaderItemId}
          setEditingHeaderItemId={setEditingHeaderItemId}
          editingHeaderName={editingHeaderName}
          setEditingHeaderName={setEditingHeaderName}
          headerNameError={headerNameError}
          setHeaderNameError={setHeaderNameError}
          headerNameInputRef={headerNameInputRef}
        />
        </div>
      )}

      {/* アイテムモーダル */}
      <ItemModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setEditingItem(null)
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
        existingNames={items.map(item => item.name)}
      />
    </div>
    </ThemeProvider>
  )
}

export default App
