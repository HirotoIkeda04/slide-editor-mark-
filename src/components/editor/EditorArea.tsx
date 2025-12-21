import { useRef, useState, type ReactNode } from 'react'
import type { Item, EditorLine, ConsoleMessage, EditorSelection, ImpressionCode, ImpressionStyleVars, StylePins } from '../../types'
import { findMatchingPreset } from '../../constants/impressionConfigs'
import { Editor } from './Editor'
import { ImpressionPanel } from '../impression/ImpressionPanel'
import { ItemDetailPanel } from '../items/ItemDetailPanel'
import { ItemTabBar } from '../items/ItemTabBar'
import { Toast } from '../toast/Toast'
import { FloatingNavBar } from '../floatingNavBar/FloatingNavBar'
import { ChatFAB } from '../chat/ChatFAB'
import { EulerIcon } from '../euler/EulerIcon'
import './EditorArea.css'

const MAIN_SLIDE_ITEM_ID = 'main-slide'

interface EditorAreaProps {
  // レイアウト関連
  width: number  // パーセント値 (例: 50)
  
  // アイテム関連
  items: Item[]
  selectedItemId: string | null
  onSelectItem: (itemId: string | null) => void
  onLoad: () => void  // 読み込みボタン
  onEditItem: (item: Item) => void
  onUpdateItem: (itemId: string, updates: Partial<Item>) => void
  onDeleteItem?: (itemId: string) => void
  existingNames: string[]
  
  // 新しいアイテム作成
  onCreateItem: (itemData: Partial<Item>) => void
  
  // Tone & Manner関連
  isTonmanaSelected: boolean
  onSelectTonmana: () => void
  impressionCode: ImpressionCode
  onImpressionCodeChange: (code: ImpressionCode) => void
  styleOverrides: Partial<ImpressionStyleVars>
  onStyleOverride: (overrides: Partial<ImpressionStyleVars>) => void
  stylePins: StylePins
  onStylePinChange: (pins: Partial<StylePins>) => void
  selectedBiomeId: string
  onBiomeChange: (biomeId: string) => void
  
  // エディタ関連
  lines: EditorLine[]
  setLines: (lines: EditorLine[]) => void
  isComposing: boolean
  setIsComposing: (isComposing: boolean) => void
  consoleMessages: ConsoleMessage[]
  scrollToLine: number | null
  onCurrentLineChange: (lineIndex: number, attribute: string | null) => void
  onSelectionChange: (selection: EditorSelection | null) => void
  
  // FloatingNavBar関連
  currentLineIndex: number
  currentAttribute: string | null
  selection: EditorSelection | null
  onSetAttribute: (lineNumber: number, attribute: string | null) => void
  onSetAttributesForRange: (startLine: number, endLine: number, attribute: string | null) => void
  onScrollToCurrentSlide: () => void
  onCreateItemFromSelection: () => void
  
  // ChatFAB関連
  editorContent: string
  onApplyEdit: (content: string) => void
  onCreateTable: (name: string, headers: string[] | undefined, data: string[][]) => void
  
  // Toast関連
  onScrollToLine: (lineIndex: number) => void
  
  // ヘッダー編集関連
  editingHeaderItemId: string | null
  setEditingHeaderItemId: (id: string | null) => void
  editingHeaderName: string
  setEditingHeaderName: (name: string) => void
  headerNameError: string
  setHeaderNameError: (error: string) => void
  headerNameInputRef: React.RefObject<HTMLInputElement | null>
}

export const EditorArea = ({
  width,
  items,
  selectedItemId,
  onSelectItem,
  onLoad,
  onEditItem,
  onUpdateItem,
  onDeleteItem,
  existingNames,
  onCreateItem,
  isTonmanaSelected,
  onSelectTonmana,
  impressionCode,
  onImpressionCodeChange,
  styleOverrides,
  onStyleOverride,
  stylePins,
  onStylePinChange,
  selectedBiomeId,
  onBiomeChange,
  lines,
  setLines,
  isComposing,
  setIsComposing,
  consoleMessages,
  scrollToLine,
  onCurrentLineChange,
  onSelectionChange,
  currentLineIndex,
  currentAttribute,
  selection,
  onSetAttribute,
  onSetAttributesForRange,
  onScrollToCurrentSlide,
  onCreateItemFromSelection,
  editorContent,
  onApplyEdit,
  onCreateTable,
  onScrollToLine,
  editingHeaderItemId,
  setEditingHeaderItemId,
  editingHeaderName,
  setEditingHeaderName,
  headerNameError,
  setHeaderNameError,
  headerNameInputRef,
}: EditorAreaProps) => {
  // テーブル用: Markdownインポートトリガー
  const [markdownImportTrigger, setMarkdownImportTrigger] = useState(0)

  // アイテムアイコンの取得
  const getItemIcon = (type: Item['type']): string | null => {
    switch (type) {
      case 'slide':
        return 'slideshow'
      case 'table':
        return 'table_chart'
      case 'image':
        return 'image'
      case 'text':
        return 'notes'
      case 'picto':
        return 'schema'
      case 'euler':
        return null // カスタムアイコンを使用
      default:
        return 'inventory_2'
    }
  }

  const renderItemIcon = (type: Item['type']) => {
    if (type === 'euler') {
      return <EulerIcon size={16} color="var(--app-highlight)" />
    }
    return <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--app-highlight)' }}>{getItemIcon(type)}</span>
  }

  // ヘッダー名のダブルクリックハンドラー
  const handleHeaderNameDoubleClick = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (item.id === MAIN_SLIDE_ITEM_ID) return
    setEditingHeaderItemId(item.id)
    setEditingHeaderName(item.name)
    setHeaderNameError('')
    setTimeout(() => {
      headerNameInputRef.current?.focus()
      headerNameInputRef.current?.select()
    }, 0)
  }

  // ヘッダー名のバリデーション
  const validateHeaderName = (value: string, currentItem: Item): boolean => {
    if (!value.trim()) {
      setHeaderNameError('Name is required')
      return false
    }
    const isDuplicate = items.some(
      i => i.name === value && currentItem.name !== value
    )
    if (isDuplicate) {
      setHeaderNameError('Name already exists')
      return false
    }
    setHeaderNameError('')
    return true
  }

  // ヘッダー名の変更ハンドラー
  const handleHeaderNameChange = (value: string, item: Item) => {
    setEditingHeaderName(value)
    validateHeaderName(value, item)
  }

  // ヘッダー名の保存ハンドラー
  const handleHeaderNameSave = (item: Item) => {
    if (validateHeaderName(editingHeaderName, item) && editingHeaderName.trim() !== item.name) {
      onUpdateItem(item.id, { name: editingHeaderName.trim() })
    }
    setEditingHeaderItemId(null)
    setHeaderNameError('')
  }

  // ヘッダー名のキャンセルハンドラー
  const handleHeaderNameCancel = (item: Item) => {
    setEditingHeaderName(item.name)
    setHeaderNameError('')
    setEditingHeaderItemId(null)
  }

  // ヘッダー名のキーダウンハンドラー
  const handleHeaderNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, item: Item) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleHeaderNameSave(item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleHeaderNameCancel(item)
    }
  }

  // ファイルヘッダーのレンダリング
  const renderFileHeader = () => {
    if (!selectedItemId && !isTonmanaSelected) return null

    // Tone & Manner選択時
    if (isTonmanaSelected) {
      const preset = findMatchingPreset(impressionCode)
      return (
        <div className="editor-file-header" style={{ borderBottom: '1px solid var(--app-border-primary)', backgroundColor: 'var(--color-dark-800)' }}>
          <div className="flex items-center gap-2">
            <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--app-highlight)' }}>palette</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--app-text-secondary)', fontWeight: 500 }}>
              Tone & Manner
            </span>
          </div>
        </div>
      )
    }

    const selectedItem = items.find(item => item.id === selectedItemId)
    if (!selectedItem) return null

    return (
      <div className="editor-file-header" style={{ borderBottom: '1px solid var(--app-border-primary)', backgroundColor: 'var(--color-dark-800)' }}>
        <div className="flex items-center gap-2">
          {renderItemIcon(selectedItem.type)}
          {editingHeaderItemId === selectedItem.id ? (
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={headerNameInputRef}
                type="text"
                value={editingHeaderName}
                onChange={(e) => handleHeaderNameChange(e.target.value, selectedItem)}
                onKeyDown={(e) => handleHeaderNameKeyDown(e, selectedItem)}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--app-text-primary)',
                  fontWeight: 500,
                  background: 'transparent',
                  border: headerNameError ? '1px solid var(--app-error)' : '1px solid transparent',
                  borderRadius: '0.25rem',
                  padding: 0,
                  margin: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  lineHeight: '1.5',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.border = headerNameError ? '1px solid var(--app-error)' : '1px solid var(--app-highlight)'
                  e.target.style.background = 'var(--app-bg-secondary)'
                  e.target.style.padding = '0.125rem 0.25rem'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid transparent'
                  e.target.style.background = 'transparent'
                  e.target.style.padding = '0'
                  handleHeaderNameSave(selectedItem)
                }}
              />
              {headerNameError && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.25rem',
                  fontSize: '0.625rem',
                  color: 'var(--app-error)',
                  whiteSpace: 'nowrap'
                }}>
                  {headerNameError}
                </div>
              )}
            </div>
          ) : (
            <span 
              style={{ fontSize: '0.875rem', color: 'var(--app-text-secondary)', fontWeight: 500, cursor: selectedItem.id === MAIN_SLIDE_ITEM_ID ? 'default' : 'text' }}
              onDoubleClick={(e) => handleHeaderNameDoubleClick(selectedItem, e)}
              title={selectedItem.id === MAIN_SLIDE_ITEM_ID ? '' : 'Double-click to edit name'}
            >
              {selectedItem.name}
            </span>
          )}
        </div>
        {/* 読み込みボタン（Main Slides選択時のみ） */}
        {selectedItem.id === MAIN_SLIDE_ITEM_ID && (
          <button
            className="editor-header-load-btn"
            onClick={onLoad}
            title="読み込み"
          >
            <span className="material-icons">folder_open</span>
          </button>
        )}
        {/* Markdownからインポートボタン（テーブル選択時のみ） */}
        {selectedItem.type === 'table' && (
          <button
            className="editor-header-load-btn"
            onClick={() => setMarkdownImportTrigger(prev => prev + 1)}
            title="Markdownからインポート"
          >
            <span className="material-icons">upload_file</span>
          </button>
        )}
      </div>
    )
  }

  // メインコンテンツのレンダリング
  const renderMainContent = () => {
    if (isTonmanaSelected) {
      return (
        <ImpressionPanel
          code={impressionCode}
          onCodeChange={onImpressionCodeChange}
          styleOverrides={styleOverrides}
          onStyleOverride={onStyleOverride}
          stylePins={stylePins}
          onStylePinChange={onStylePinChange}
          selectedBiomeId={selectedBiomeId}
          onBiomeChange={onBiomeChange}
        />
      )
    }

    if (selectedItemId && selectedItemId !== MAIN_SLIDE_ITEM_ID) {
      const selectedItem = items.find(item => item.id === selectedItemId) || null
      return (
        <ItemDetailPanel
          item={selectedItem}
          onEdit={onEditItem}
          onUpdateItem={onUpdateItem}
          onCreateItem={onCreateItem}
          existingNames={existingNames}
          markdownImportTrigger={markdownImportTrigger}
        />
      )
    }

    return (
      <Editor
        lines={lines}
        setLines={setLines}
        isComposing={isComposing}
        setIsComposing={setIsComposing}
        errorMessages={consoleMessages}
        onCurrentLineChange={onCurrentLineChange}
        onSelectionChange={onSelectionChange}
        scrollToLine={scrollToLine}
        items={items}
      />
    )
  }

  // エディタ表示中かどうか
  const isEditorVisible = !isTonmanaSelected && (!selectedItemId || selectedItemId === MAIN_SLIDE_ITEM_ID)

  // プレビュー側の幅（パーセント）
  const previewWidth = 100 - width

  // Toast/NavBarの配置計算
  // 行番号カラム(60px)を除いたテキスト部分の中央に配置
  const floatingLeft = `calc(${previewWidth}% + 60px + (${width}% - 36px - 60px) / 2)`
  const floatingWidth = `calc(${width}% - 200px)`

  return (
    <div className="editor-area" style={{ width: `${width}%` }}>
      {/* ファイルヘッダー */}
      {renderFileHeader()}

      {/* メインコンテンツ + タブバー */}
      <div className="editor-area-main">
        {/* コンテンツエリア */}
        <div className="editor-area-content">
          {renderMainContent()}
        </div>

        {/* アイテムタブバー */}
        <div className="editor-area-tabbar">
          <ItemTabBar
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={(itemId) => {
              onSelectItem(itemId)
            }}
            onUpdateItem={onUpdateItem}
            onDelete={onDeleteItem}
            existingNames={existingNames}
            isTonmanaSelected={isTonmanaSelected}
            onSelectTonmana={onSelectTonmana}
          />
        </div>
      </div>

      {/* Toast - エディタ表示時のみ */}
      {isEditorVisible && (
        <div 
          className="editor-area-toast"
          style={{
            left: floatingLeft,
            width: floatingWidth,
          }}
        >
          <div className="pointer-events-auto w-full">
            <Toast 
              messages={consoleMessages} 
              onScrollToLine={onScrollToLine}
            />
          </div>
        </div>
      )}

      {/* FloatingNavBar - エディタ表示時のみ */}
      {isEditorVisible && (
        <div 
          className="editor-area-navbar"
          style={{
            left: floatingLeft,
            width: floatingWidth,
          }}
        >
          <div className="pointer-events-auto w-full">
            <FloatingNavBar
              itemType="slide"
              currentLine={currentLineIndex + 1}
              currentAttribute={currentAttribute}
              selection={selection ? {
                startLine: selection.startLine + 1,
                endLine: selection.endLine + 1
              } : null}
              onSetAttribute={onSetAttribute}
              onSetAttributesForRange={onSetAttributesForRange}
              onScrollToCurrentSlide={onScrollToCurrentSlide}
              onCreateItemFromSelection={onCreateItemFromSelection}
            />
          </div>
        </div>
      )}

      {/* ChatFAB */}
      <ChatFAB
        editorContent={editorContent}
        onApplyEdit={onApplyEdit}
        onCreateTable={onCreateTable}
        existingItemNames={existingNames}
        items={items}
      />
    </div>
  )
}
