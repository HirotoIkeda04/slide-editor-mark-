import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage, ChatMode, ClaudeModel, AIEditToolInput } from '../../types'
import { sendChatMessageStream, applyToolToContent, extractTableFromResponse, generateTableNameWithAI } from '../../utils/ai'
import './ChatPanel.css'

interface ChatPanelProps {
  editorContent: string
  onApplyEdit: (content: string) => void
  onCreateTable?: (name: string, headers: string[] | undefined, data: string[][]) => void
  existingItemNames?: string[]
}

// モード設定
const MODE_CONFIG: Record<ChatMode, { label: string; icon: string; description: string }> = {
  write: { 
    label: 'Write', 
    icon: '✦', 
    description: '新規作成・全文書き換え'
  },
  edit: { 
    label: 'Edit', 
    icon: '✎', 
    description: '部分的な編集'
  },
  ask: { 
    label: 'Ask', 
    icon: '?', 
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
      case 'replace_content': return '📝'
      case 'search_replace': return '🔄'
      case 'insert_after': return '➕'
      case 'delete_content': return '🗑️'
      default: return '🔧'
    }
  }

  return (
    <div className="tool-use-display">
      <div className="tool-use-header">
        <span className="tool-use-icon">{getToolIcon(toolName)}</span>
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

export const ChatPanel = ({ editorContent, onApplyEdit, onCreateTable, existingItemNames }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [mode, setMode] = useState<ChatMode>(getDefaultMode())
  const [model, setModel] = useState<ClaudeModel>(getDefaultModel())
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

  // editorContentを最新の状態で参照できるようにする
  useEffect(() => {
    editorContentRef.current = editorContent
  }, [editorContent])

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
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return

    // 画像がある場合はcontentを配列形式に
    const content: ChatMessage['content'] = selectedImages.length > 0
      ? [
          ...(input.trim() ? [{ type: 'text' as const, text: input.trim() }] : []),
          ...selectedImages.map(dataUrl => {
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
      : input.trim()

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      images: selectedImages.length > 0 ? selectedImages : undefined
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
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full chat-panel">
      {/* チャットヘッダー */}
      <div className="chat-header">
        <div className="flex items-center gap-1.5">
          <div className="chat-ai-icon">✨</div>
          <h3 className="text-sm chat-header-title">AI Assistant</h3>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 chat-messages">
        {messages.length === 0 && !streamingText && (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">💬</div>
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
            onChange={(e) => setInput(e.target.value)}
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
                  <span className="chat-mode-icon">{MODE_CONFIG[mode].icon}</span>
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
                        <span className="chat-mode-option-icon">{config.icon}</span>
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
      </div>
    </div>
  )
}
