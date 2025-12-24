import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage, ChatMode, ClaudeModel, AIEditToolInput, Item } from '../../types'
import { sendChatMessageStream, applyToolToContent, extractTableFromResponse, generateTableNameWithAI } from '../../utils/ai'
import { useMentionPopup } from '../../hooks'
import { MentionPopup } from '../common/MentionPopup'
import './ChatPanel.css'

interface ChatPanelProps {
  editorContent: string
  onApplyEdit: (content: string) => void
  onCreateTable?: (name: string, headers: string[] | undefined, data: string[][]) => void
  existingItemNames?: string[]
  // フローティングモード用のprops
  isFloating?: boolean
  onClose?: () => void
  initialMode?: ChatMode
  initialModel?: ClaudeModel
  // 外部からの状態管理用（ChatFABとの連携）
  messages?: ChatMessage[]
  onMessagesChange?: (messages: ChatMessage[]) => void
  pendingMessage?: string | null
  pendingImages?: string[]
  onPendingMessageProcessed?: () => void
  // @メンション補完用のアイテムリスト
  items?: Item[]
}

// モード設定（Material Icons）
const MODE_CONFIG: Record<ChatMode, { label: string; icon: string; description: string }> = {
  write: { 
    label: 'Write', 
    icon: 'add', 
    description: '新規作成・全文書き換え'
  },
  edit: { 
    label: 'Edit', 
    icon: 'edit', 
    description: '部分的な編集'
  },
  ask: { 
    label: 'Ask', 
    icon: 'chat_bubble_outline', 
    description: '質問への回答のみ'
  }
}

const MODEL_CONFIG: Record<ClaudeModel, { label: string; description: string }> = {
  'claude-3-haiku-20240307': {
    label: 'Haiku',
    description: '高速'
  },
  'claude-sonnet-4-20250514': {
    label: 'Sonnet 4',
    description: '推奨'
  },
  'claude-opus-4-5-20251101': {
    label: 'Opus 4.5',
    description: '高性能'
  }
}

// デフォルトモデルをlocalStorageから読み込む
const getDefaultModel = (): ClaudeModel => {
  const saved = localStorage.getItem('claude-model')
  if (saved && saved in MODEL_CONFIG) {
    return saved as ClaudeModel
  }
  return 'claude-sonnet-4-20250514'
}

// デフォルトモードをlocalStorageから読み込む
const getDefaultMode = (): ChatMode => {
  const saved = localStorage.getItem('chat-mode')
  if (saved && saved in MODE_CONFIG) {
    return saved as ChatMode
  }
  return 'edit'
}

// ツール使用の表示コンポーネント
interface ToolUseDisplayProps {
  toolName: string
  toolInput?: AIEditToolInput
  isStreaming?: boolean
  onApply?: () => void
  applied?: boolean
}

const ToolUseDisplay = ({ toolName, toolInput, isStreaming, onApply, applied }: ToolUseDisplayProps) => {
  const getToolLabel = (name: string) => {
    switch (name) {
      case 'replace_content': return '全文置換'
      case 'search_replace': return '検索・置換'
      case 'insert_after': return '挿入'
      case 'delete_content': return '削除'
      default: return name
    }
  }

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'replace_content': return 'edit_note'
      case 'search_replace': return 'find_replace'
      case 'insert_after': return 'add_circle_outline'
      case 'delete_content': return 'delete_outline'
      default: return 'build'
    }
  }

  return (
    <div className="tool-use-display">
      <div className="tool-use-header">
        <span className="tool-use-icon material-icons">{getToolIcon(toolName)}</span>
        <span className="tool-use-label">{getToolLabel(toolName)}</span>
        {isStreaming && <span className="tool-use-streaming">処理中...</span>}
      </div>
      {toolInput && !isStreaming && (
        <div className="tool-use-content">
          {toolName === 'replace_content' && (
            <div className="tool-use-preview">
              <div className="tool-use-preview-label">新しいコンテンツ</div>
              <pre className="tool-use-preview-content">
                {(toolInput as { content: string }).content.substring(0, 200)}
                {(toolInput as { content: string }).content.length > 200 && '...'}
              </pre>
            </div>
          )}
          {toolName === 'search_replace' && (
            <>
              <div className="tool-use-diff">
                <div className="tool-use-diff-delete">
                  <span className="diff-prefix">−</span>
                  <span>{(toolInput as { search: string }).search}</span>
                </div>
                <div className="tool-use-diff-add">
                  <span className="diff-prefix">+</span>
                  <span>{(toolInput as { replace: string }).replace}</span>
                </div>
              </div>
            </>
          )}
          {toolName === 'insert_after' && (
            <>
              <div className="tool-use-preview">
                <div className="tool-use-preview-label">挿入位置の後</div>
                <pre className="tool-use-preview-content">
                  {(toolInput as { after: string }).after.substring(0, 100)}
                </pre>
              </div>
              <div className="tool-use-diff">
                <div className="tool-use-diff-add">
                  <span className="diff-prefix">+</span>
                  <span>{(toolInput as { content: string }).content}</span>
                </div>
              </div>
            </>
          )}
          {toolName === 'delete_content' && (
            <div className="tool-use-diff">
              <div className="tool-use-diff-delete">
                <span className="diff-prefix">−</span>
                <span>{(toolInput as { content: string }).content}</span>
              </div>
            </div>
          )}
          {onApply && (
            <button
              onClick={onApply}
              className={`chat-apply-button ${applied ? 'chat-apply-button-applied' : ''}`}
              disabled={applied}
            >
              <span className="chat-apply-icon">✓</span>
              {applied ? '適用済み' : '適用する'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export const ChatPanel = ({ 
  editorContent, 
  onApplyEdit, 
  onCreateTable, 
  existingItemNames,
  isFloating = false,
  onClose,
  initialMode,
  initialModel,
  messages: externalMessages,
  onMessagesChange,
  pendingMessage,
  pendingImages,
  onPendingMessageProcessed,
  items = [],
}: ChatPanelProps) => {
  // 内部状態（外部から提供されない場合に使用）
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([])
  
  // 外部/内部状態の切り替え
  const messages = externalMessages ?? internalMessages
  const setMessages = useCallback((update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof update === 'function') {
      const currentMessages = externalMessages ?? internalMessages
      const newMessages = update(currentMessages)
      if (onMessagesChange) {
        onMessagesChange(newMessages)
      } else {
        setInternalMessages(newMessages)
      }
    } else {
      if (onMessagesChange) {
        onMessagesChange(update)
      } else {
        setInternalMessages(update)
      }
    }
  }, [externalMessages, internalMessages, onMessagesChange])
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [mode, setMode] = useState<ChatMode>(initialMode ?? getDefaultMode())
  const [model, setModel] = useState<ClaudeModel>(initialModel ?? getDefaultModel())
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [pendingToolCalls, setPendingToolCalls] = useState<Array<{ name: string; input: AIEditToolInput }>>([])
  const [appliedToolIndices, setAppliedToolIndices] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorContentRef = useRef(editorContent)

  // @メンション補完機能
  const handleMentionInsert = useCallback((itemName: string, replaceStart: number, replaceEnd: number) => {
    // @から検索クエリまでを置換して@アイテム名にする
    const newInput = input.slice(0, replaceStart) + '@' + itemName + input.slice(replaceEnd)
    setInput(newInput)
    
    // カーソルを挿入したアイテム名の後ろに移動
    const newCursorPos = replaceStart + 1 + itemName.length
    setTimeout(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }, [input])

  const mentionPopup = useMentionPopup({
    items,
    onInsert: handleMentionInsert,
  })

  // editorContentを最新の状態で参照できるようにする
  useEffect(() => {
    editorContentRef.current = editorContent
  }, [editorContent])

  // initialModeが変更されたらmodeを更新
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
    }
  }, [initialMode])

  // initialModelが変更されたらmodelを更新
  useEffect(() => {
    if (initialModel) {
      setModel(initialModel)
    }
  }, [initialModel])

  // pendingMessage/pendingImages用のref
  const pendingMessageRef = useRef<string | null>(null)
  const pendingImagesRef = useRef<string[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText])

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const minHeight = 24
      const maxHeight = 160
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleModeSelect = (newMode: ChatMode) => {
    setMode(newMode)
    setShowModeDropdown(false)
    localStorage.setItem('chat-mode', newMode)
  }

  const handleModelSelect = (newModel: ClaudeModel) => {
    setModel(newModel)
    setShowModelDropdown(false)
    localStorage.setItem('claude-model', newModel)
  }

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

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleApplyTool = useCallback((toolIndex: number) => {
    const tool = pendingToolCalls[toolIndex]
    if (!tool) return

    const result = applyToolToContent(editorContentRef.current, tool.name, tool.input)
    if (result.success) {
      onApplyEdit(result.content)
      setAppliedToolIndices(prev => new Set(prev).add(toolIndex))
    } else if (result.error) {
      // エラーメッセージを表示
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `⚠️ ${result.error}`
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }, [pendingToolCalls, onApplyEdit])

  const handleSend = async () => {
    // pendingMessage/pendingImagesがある場合はそれを使用
    const messageText = pendingMessageRef.current || input.trim()
    const imagesToSend = pendingImagesRef.current.length > 0 ? pendingImagesRef.current : selectedImages
    pendingMessageRef.current = null
    pendingImagesRef.current = []
    
    if ((!messageText && imagesToSend.length === 0) || isLoading) return

    // 画像がある場合はcontentを配列形式に
    const content: ChatMessage['content'] = imagesToSend.length > 0
      ? [
          ...(messageText ? [{ type: 'text' as const, text: messageText }] : []),
          ...imagesToSend.map(dataUrl => {
            const match = dataUrl.match(/^data:image\/([^;]+);base64,(.+)$/)
            if (!match) {
              throw new Error('無効な画像形式です')
            }
            const [, mediaType, base64Data] = match
            return {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: `image/${mediaType}`,
                data: base64Data
              }
            }
          })
        ]
      : messageText

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      images: imagesToSend.length > 0 ? imagesToSend : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSelectedImages([])
    setIsLoading(true)
    setStreamingText('')
    setPendingToolCalls([])
    setAppliedToolIndices(new Set())

    try {
      const allMessages: ChatMessage[] = [...messages, userMessage]
      let fullText = ''
      const toolCalls: Array<{ name: string; input: AIEditToolInput }> = []

      for await (const event of sendChatMessageStream(allMessages, editorContent, mode, model)) {
        switch (event.type) {
          case 'text':
            fullText += event.content || ''
            setStreamingText(fullText)
            break
          case 'tool_use_start':
            // Tool use started
            break
          case 'tool_use_end':
            if (event.toolName && event.toolInput) {
              toolCalls.push({ name: event.toolName, input: event.toolInput })
              setPendingToolCalls([...toolCalls])
            }
            break
          case 'error':
            throw new Error(event.error)
          case 'done':
            break
        }
      }

      // ストリーミング完了後、メッセージを追加
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullText || (toolCalls.length > 0 ? '編集を提案します。' : '応答がありませんでした。')
      }

      // 表データを抽出
      if (onCreateTable && fullText) {
        const tableData = extractTableFromResponse(fullText)
        if (tableData) {
          try {
            let tableName = await generateTableNameWithAI(tableData.headers, tableData.data)
            
            if (existingItemNames && existingItemNames.length > 0) {
              let finalName = tableName
              let counter = 1
              while (existingItemNames.includes(finalName)) {
                finalName = `${tableName}_${counter}`
                counter++
              }
              tableName = finalName
            }
            
            onCreateTable(tableName, tableData.headers, tableData.data)
            
            const notificationMessage: ChatMessage = {
              role: 'assistant',
              content: `表「${tableName}」を作成しました。`
            }
            setMessages(prev => [...prev, assistantMessage, notificationMessage])
            setStreamingText('')
            return
          } catch (error) {
            console.log('Table name generation failed:', error)
          }
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      setStreamingText('')

    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingText('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // @メンション補完のキーイベントを先に処理
    if (mentionPopup.handleKeyDown(e)) {
      return
    }
    
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  // pendingMessage/pendingImagesを処理（ChatFABからの入力を送信）
  useEffect(() => {
    if ((pendingMessage || (pendingImages && pendingImages.length > 0)) && !isLoading) {
      pendingMessageRef.current = pendingMessage || null
      pendingImagesRef.current = pendingImages || []
      onPendingMessageProcessed?.()
      // 次のフレームで送信
      requestAnimationFrame(() => {
        handleSend()
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage, pendingImages])

  return (
    <div className={`flex flex-col h-full chat-panel ${isFloating ? 'chat-panel-floating' : ''}`}>
      {/* チャットヘッダー */}
      <div className="chat-header">
        <div className="flex items-center gap-1.5">
          <span className="chat-ai-icon material-icons">auto_awesome</span>
          <h3 className="text-sm chat-header-title">AI Assistant</h3>
        </div>
        {isFloating && onClose && (
          <button
            className="chat-close-button"
            onClick={onClose}
            title="閉じる"
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 chat-messages">
        {messages.length === 0 && !streamingText && (
          <div className="chat-empty-state">
            <span className="chat-empty-icon material-icons">forum</span>
            <p className="chat-empty-text">AIアシスタントに編集を依頼</p>
            <p className="chat-empty-subtext">スライドの内容を編集・改善します</p>
          </div>
        )}
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} chat-message-wrapper`}
          >
            <div className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {typeof message.content === 'string' ? (
                  message.content
                ) : (
                  <>
                    {message.content.map((item, itemIdx) => {
                      if (item.type === 'text' && item.text) {
                        return <div key={itemIdx}>{item.text}</div>
                      } else if (item.type === 'image' && item.source) {
                        const dataUrl = `data:${item.source.media_type};base64,${item.source.data}`
                        return (
                          <img
                            key={itemIdx}
                            src={dataUrl}
                            alt="Uploaded image"
                            style={{ maxWidth: '100%', borderRadius: '0.5rem', marginTop: '0.5rem' }}
                          />
                        )
                      }
                      return null
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ストリーミング中のテキスト表示 */}
        {streamingText && (
          <div className="flex justify-start chat-message-wrapper">
            <div className="chat-message chat-message-assistant">
              <div className="whitespace-pre-wrap leading-relaxed">
                {streamingText}
                <span className="streaming-cursor">▌</span>
              </div>
            </div>
          </div>
        )}

        {/* ツール使用の表示 */}
        {pendingToolCalls.length > 0 && (
          <div className="flex justify-start chat-message-wrapper">
            <div className="chat-message chat-message-assistant" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
              {pendingToolCalls.map((tool, idx) => (
                <ToolUseDisplay
                  key={idx}
                  toolName={tool.name}
                  toolInput={tool.input}
                  onApply={() => handleApplyTool(idx)}
                  applied={appliedToolIndices.has(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {isLoading && !streamingText && pendingToolCalls.length === 0 && (
          <div className="flex justify-start">
            <div className="chat-loading">
              <div className="chat-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              思考中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="chat-input-area">
        {/* 選択された画像のプレビュー */}
        {selectedImages.length > 0 && (
          <div className="chat-image-preview-container">
            {selectedImages.map((dataUrl, index) => (
              <div key={index} className="chat-image-preview">
                <img src={dataUrl} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="chat-image-remove"
                  onClick={() => handleRemoveImage(index)}
                  aria-label="画像を削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              const newValue = e.target.value
              const cursorPos = e.target.selectionStart || 0
              setInput(newValue)
              
              // @メンション補完の処理
              const inputRect = e.target.getBoundingClientRect()
              mentionPopup.handleChange(newValue, cursorPos, inputRect)
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={mode === 'write' ? '例: 自己紹介スライドを作成して...' : mode === 'edit' ? '例: 見出しを短くして...' : '例: このスライドの構成について教えて...'}
            className="chat-textarea"
            rows={1}
          />
          <div className="chat-input-buttons">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <div className="chat-selectors-group">
              {/* モードセレクター */}
              <div className="chat-mode-selector" ref={modeDropdownRef}>
                <button
                  className="chat-mode-button"
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                >
                  <span className="chat-mode-icon material-icons">{MODE_CONFIG[mode].icon}</span>
                  <span className="chat-mode-label">{MODE_CONFIG[mode].label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {showModeDropdown && (
                  <div className="chat-mode-dropdown">
                    {(Object.entries(MODE_CONFIG) as [ChatMode, typeof MODE_CONFIG[ChatMode]][]).map(([key, config]) => (
                      <button
                        key={key}
                        className={`chat-mode-option ${mode === key ? 'active' : ''}`}
                        onClick={() => handleModeSelect(key)}
                        data-tooltip={config.description}
                      >
                        <span className="chat-mode-option-icon material-icons">{config.icon}</span>
                        <span className="chat-mode-option-label">{config.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* モデルセレクター */}
              <div className="chat-model-selector" ref={modelDropdownRef}>
                <button
                  className="chat-model-button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                >
                  <span className="chat-model-label">{MODEL_CONFIG[model].label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {showModelDropdown && (
                  <div className="chat-model-dropdown">
                    {(Object.entries(MODEL_CONFIG) as [ClaudeModel, typeof MODEL_CONFIG[ClaudeModel]][]).map(([key, config]) => (
                      <button
                        key={key}
                        className={`chat-model-option ${model === key ? 'active' : ''}`}
                        onClick={() => handleModelSelect(key)}
                        title={config.description}
                      >
                        <span className="chat-model-option-check">
                          {model === key && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                        </span>
                        <span className="chat-model-option-label">{config.label}</span>
                        <span className="chat-model-option-desc">{config.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="chat-image-button"
              title="画像を追加"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
              className="chat-send-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* @メンション補完ポップアップ */}
        {mentionPopup.isOpen && (
          <MentionPopup
            items={mentionPopup.filteredItems}
            searchQuery={mentionPopup.searchQuery}
            selectedIndex={mentionPopup.selectedIndex}
            position={mentionPopup.position}
            showAbove={mentionPopup.showAbove}
            onSelect={(item) => {
              handleMentionInsert(
                item.name,
                0, // will be recalculated in the hook
                mentionPopup.searchQuery.length + 1
              )
              mentionPopup.close()
            }}
            onClose={mentionPopup.close}
          />
        )}
      </div>
    </div>
  )
}
