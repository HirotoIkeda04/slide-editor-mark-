import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage, ChatMode, ClaudeModel, Item } from '../../types'
import { ChatPanel } from './ChatPanel'
import './ChatFAB.css'

// FABの3つの状態
type FABState = 'fab' | 'bar' | 'panel'

interface ChatFABProps {
  editorContent: string
  onApplyEdit: (content: string) => void
  onCreateTable?: (name: string, headers: string[] | undefined, data: string[][]) => void
  existingItemNames?: string[]
  items?: Item[]  // @メンション補完用のアイテムリスト
}

// モード設定（Material Icons）
const MODE_CONFIG: Record<ChatMode, { label: string; icon: string }> = {
  write: { label: 'Write', icon: 'add' },
  edit: { label: 'Edit', icon: 'edit' },
  ask: { label: 'Ask', icon: 'chat_bubble_outline' }
}

// モデル設定
const MODEL_CONFIG: Record<ClaudeModel, { label: string; shortLabel: string }> = {
  'claude-3-haiku-20240307': { label: 'Haiku', shortLabel: 'H' },
  'claude-sonnet-4-20250514': { label: 'Sonnet 4', shortLabel: 'S4' },
  'claude-opus-4-5-20251101': { label: 'Opus 4.5', shortLabel: 'O4' }
}

// デフォルトモードをlocalStorageから読み込む
const getDefaultMode = (): ChatMode => {
  const saved = localStorage.getItem('chat-mode')
  if (saved && saved in MODE_CONFIG) {
    return saved as ChatMode
  }
  return 'edit'
}

// デフォルトモデルをlocalStorageから読み込む
const getDefaultModel = (): ClaudeModel => {
  const saved = localStorage.getItem('claude-model')
  if (saved && saved in MODEL_CONFIG) {
    return saved as ClaudeModel
  }
  return 'claude-sonnet-4-20250514'
}

export const ChatFAB = ({ 
  editorContent, 
  onApplyEdit, 
  onCreateTable, 
  existingItemNames,
  items = [],
}: ChatFABProps) => {
  const [fabState, setFabState] = useState<FABState>('fab')
  const [barInput, setBarInput] = useState('')
  const [mode, setMode] = useState<ChatMode>(getDefaultMode())
  const [model, setModel] = useState<ClaudeModel>(getDefaultModel())
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  
  // メッセージ履歴をChatFABで管理（ChatPanelと共有）
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  
  const barInputRef = useRef<HTMLTextAreaElement>(null)
  const fabContainerRef = useRef<HTMLDivElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 外側クリックでbar/panelを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabContainerRef.current && !fabContainerRef.current.contains(event.target as Node)) {
        if (fabState === 'bar') {
          setFabState('fab')
          setBarInput('')
          setSelectedImages([])
        }
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [fabState])

  // barに展開したときにinputにフォーカス
  useEffect(() => {
    if (fabState === 'bar' && barInputRef.current) {
      barInputRef.current.focus()
    }
  }, [fabState])

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = barInputRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const minHeight = 20
      const maxHeight = 80
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }, [barInput])

  // FABクリック時の処理
  const handleFABClick = () => {
    if (fabState === 'fab') {
      setFabState('bar')
    }
  }

  // Barでの送信ボタンクリック or Enter
  const handleBarSubmit = () => {
    if (!barInput.trim() && selectedImages.length === 0) return
    
    // メッセージと画像を保存してパネルを開く
    setPendingMessage(barInput.trim() || null)
    setPendingImages([...selectedImages])
    setBarInput('')
    setSelectedImages([])
    setFabState('panel')
  }

  // 画像選択ハンドラー
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(new Error(`${file.name}は画像ファイルではありません`))
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          resolve(dataUrl)
        }
        reader.onerror = () => reject(new Error(`${file.name}の読み込みに失敗しました`))
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises)
      .then(dataUrls => {
        setSelectedImages(prev => [...prev, ...dataUrls])
      })
      .catch(error => {
        console.error('画像の読み込みエラー:', error)
      })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 画像削除ハンドラー
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Barでのキーダウン処理
  const handleBarKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleBarSubmit()
    } else if (e.key === 'Escape') {
      setFabState('fab')
      setBarInput('')
    }
  }

  // Barでの展開ボタンクリック（チャット履歴を見るため）
  const handleExpandClick = () => {
    setFabState('panel')
  }

  // パネルを閉じる
  const handleClosePanel = useCallback(() => {
    setFabState('fab')
    setBarInput('')
    setPendingMessage(null)
    setPendingImages([])
  }, [])

  // モード選択
  const handleModeSelect = (newMode: ChatMode) => {
    setMode(newMode)
    setShowModeDropdown(false)
    localStorage.setItem('chat-mode', newMode)
  }

  // モデル選択
  const handleModelSelect = (newModel: ClaudeModel) => {
    setModel(newModel)
    setShowModelDropdown(false)
    localStorage.setItem('claude-model', newModel)
  }

  // pendingMessageがクリアされたことを検知するコールバック
  const handlePendingMessageProcessed = useCallback(() => {
    setPendingMessage(null)
    setPendingImages([])
  }, [])

  return (
    <div 
      ref={fabContainerRef}
      className={`chat-fab-container chat-fab-state-${fabState}`}
    >
      {/* FAB状態: 丸いボタン */}
      {fabState === 'fab' && (
        <button
          className="chat-fab-button"
          onClick={handleFABClick}
          title="AIアシスタント"
        >
          <span className="material-icons chat-fab-icon">auto_awesome</span>
        </button>
      )}

      {/* Bar状態: 入力フィールドを含むバー */}
      {fabState === 'bar' && (
        <div className="chat-fab-bar-wrapper">
          {/* 選択された画像のプレビュー */}
          {selectedImages.length > 0 && (
            <div className="chat-fab-image-preview-container">
              {selectedImages.map((dataUrl, index) => (
                <div key={index} className="chat-fab-image-preview">
                  <img src={dataUrl} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="chat-fab-image-remove"
                    onClick={() => handleRemoveImage(index)}
                    aria-label="画像を削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="chat-fab-bar">
            {/* 入力フィールド（上部） */}
            <div className="chat-fab-input-area">
              <textarea
                ref={barInputRef}
                className="chat-fab-bar-input"
                value={barInput}
                onChange={(e) => setBarInput(e.target.value)}
                onKeyDown={handleBarKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={mode === 'write' ? '例: 自己紹介スライドを作成して...' : mode === 'edit' ? '例: もっと簡潔にして...' : '例: この内容について教えて...'}
                rows={1}
              />
            </div>

            {/* コントロールバー（下部） */}
            <div className="chat-fab-controls">
              {/* 左側: モードセレクター + モデル */}
              <div className="chat-fab-controls-left">
                {/* モードセレクター */}
                <div className="chat-fab-mode-selector" ref={modeDropdownRef}>
                  <button
                    className="chat-fab-mode-button"
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    title={`モード: ${MODE_CONFIG[mode].label}`}
                  >
                    <span className="chat-fab-mode-icon material-icons">{MODE_CONFIG[mode].icon}</span>
                    <svg className="chat-fab-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {showModeDropdown && (
                    <div className="chat-fab-mode-dropdown">
                      {(Object.entries(MODE_CONFIG) as [ChatMode, typeof MODE_CONFIG[ChatMode]][]).map(([key, config]) => (
                        <button
                          key={key}
                          className={`chat-fab-mode-option ${mode === key ? 'active' : ''}`}
                          onClick={() => handleModeSelect(key)}
                        >
                          <span className="chat-fab-mode-option-icon material-icons">{config.icon}</span>
                          <span className="chat-fab-mode-option-label">{config.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* モデルセレクター */}
                <div className="chat-fab-model-selector" ref={modelDropdownRef}>
                  <button
                    className="chat-fab-model-button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    title={`モデル: ${MODEL_CONFIG[model].label}`}
                  >
                    <span className="chat-fab-model-label">{MODEL_CONFIG[model].shortLabel}</span>
                  </button>
                  {showModelDropdown && (
                    <div className="chat-fab-model-dropdown">
                      {(Object.entries(MODEL_CONFIG) as [ClaudeModel, typeof MODEL_CONFIG[ClaudeModel]][]).map(([key, config]) => (
                        <button
                          key={key}
                          className={`chat-fab-model-option ${model === key ? 'active' : ''}`}
                          onClick={() => handleModelSelect(key)}
                        >
                          <span className="chat-fab-model-option-check">
                            {model === key && '✓'}
                          </span>
                          <span className="chat-fab-model-option-label">{config.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 右側: 画像・展開・送信ボタン */}
              <div className="chat-fab-controls-right">
                {/* 画像入力 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="chat-fab-image-button"
                  onClick={() => fileInputRef.current?.click()}
                  title="画像を追加"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>

                {/* 展開ボタン（履歴がある場合表示） */}
                {messages.length > 0 && (
                  <button
                    className="chat-fab-expand-button"
                    onClick={handleExpandClick}
                    title="チャット履歴を表示"
                  >
                    <span className="material-icons">expand_less</span>
                  </button>
                )}

                {/* 送信ボタン */}
                <button
                  className="chat-fab-send-button"
                  onClick={handleBarSubmit}
                  disabled={!barInput.trim() && selectedImages.length === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel状態: フローティングチャットパネル */}
      {fabState === 'panel' && (
        <div className="chat-fab-panel">
          <ChatPanel
            editorContent={editorContent}
            onApplyEdit={onApplyEdit}
            onCreateTable={onCreateTable}
            existingItemNames={existingItemNames}
            isFloating={true}
            onClose={handleClosePanel}
            initialMode={mode}
            initialModel={model}
            messages={messages}
            onMessagesChange={setMessages}
            pendingMessage={pendingMessage}
            pendingImages={pendingImages}
            onPendingMessageProcessed={handlePendingMessageProcessed}
            items={items}
          />
        </div>
      )}
    </div>
  )
}
