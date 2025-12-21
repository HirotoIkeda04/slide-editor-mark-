import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { ImpressionCode, ImpressionStyleVars, StylePins, ImpressionSubAttributes, TonmanaFilterCategory } from '../../types'
import { 
  getDisplayName,
  impressionCodeToString,
  stringToImpressionCode,
  impressionCodesEqual,
} from '../../constants/impressionConfigs'
import { tonmanaBiomes, getBiomeById, getDefaultBiome } from '../../constants/tonmanaBiomes'
import { generateStyleVars } from '../../utils/impressionStyle'
import { ImpressionDetail } from './ImpressionDetail'
import { TonmanaCategoryTabs } from './TonmanaCategoryTabs'
import { TonmanaChipList } from './TonmanaChipList'
import './ImpressionPanel.css'

interface ImpressionPanelProps {
  code: ImpressionCode
  onCodeChange: (code: ImpressionCode) => void
  styleOverrides?: Partial<ImpressionStyleVars>
  onStyleOverride?: (overrides: Partial<ImpressionStyleVars>) => void
  stylePins?: StylePins
  onStylePinChange?: (pins: Partial<StylePins>) => void
  selectedBiomeId?: string
  onBiomeChange?: (biomeId: string) => void
  usedBiomeIds?: string[]
}

export const ImpressionPanel = ({
  code,
  onCodeChange,
  styleOverrides,
  onStyleOverride,
  stylePins,
  onStylePinChange,
  selectedBiomeId: externalBiomeId,
  onBiomeChange,
  usedBiomeIds = [],
}: ImpressionPanelProps) => {
  // 選択中のバイオームID（外部制御または内部状態）
  const [internalBiomeId, setInternalBiomeId] = useState<string>(getDefaultBiome().id)
  const selectedBiomeId = externalBiomeId ?? internalBiomeId
  
  // 前回のコード（履歴）
  const [previousCode, setPreviousCode] = useState<ImpressionCode | null>(null)
  
  // サブ属性
  const [subAttributes, setSubAttributes] = useState<ImpressionSubAttributes>({})
  
  // Spotify風ドリルダウンの選択フィルターカテゴリ（配列で階層管理）
  const [selectedCategories, setSelectedCategories] = useState<TonmanaFilterCategory[]>([])
  
  // 編集用state
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingCode, setIsEditingCode] = useState(false)
  const [customName, setCustomName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [editCodeValue, setEditCodeValue] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)
  
  // 入力フィールドのref
  const nameInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  
  // 現在選択中のバイオームを取得
  const currentBiome = useMemo(() => 
    getBiomeById(selectedBiomeId) ?? getDefaultBiome(), 
    [selectedBiomeId]
  )
  
  // 現在のスタイル変数
  const styleVars = useMemo(() => {
    const base = generateStyleVars(code, subAttributes, selectedBiomeId)
    if (styleOverrides) {
      return { ...base, ...styleOverrides }
    }
    return base
  }, [code, subAttributes, styleOverrides, selectedBiomeId])
  
  // 現在の表示名を取得
  const currentDisplayName = useMemo(() => getDisplayName(code), [code])
  
  // 見本を選択
  const handleSelect = useCallback((newCode: ImpressionCode) => {
    if (!impressionCodesEqual(newCode, code)) {
      setPreviousCode(code)
      onCodeChange(newCode)
    }
  }, [code, onCodeChange])
  
  // バイオームを選択
  const handleBiomeClick = useCallback((biomeId: string) => {
    const biome = tonmanaBiomes.find(b => b.id === biomeId)
    if (biome) {
      // バイオームIDを更新
      if (onBiomeChange) {
        onBiomeChange(biomeId)
      } else {
        setInternalBiomeId(biomeId)
      }
      
      // Tech系の場合はサブ属性を設定
      if (biome.baseStyle === 'Tech') {
        setSubAttributes(prev => ({ ...prev, colorTemperature: 'cool' }))
      }
    }
  }, [onBiomeChange])
  
  // 名前編集開始
  const handleNameDoubleClick = useCallback(() => {
    const displayName = customName || currentBiome.nameJa
    setEditNameValue(displayName)
    setIsEditingName(true)
  }, [customName, currentBiome.nameJa])
  
  // 名前編集確定
  const handleNameEditConfirm = useCallback(() => {
    const trimmed = editNameValue.trim()
    if (trimmed && trimmed !== currentBiome.nameJa) {
      setCustomName(trimmed)
    } else if (trimmed === currentBiome.nameJa) {
      setCustomName(null)  // プリセット名と同じならカスタム名をクリア
    }
    setIsEditingName(false)
  }, [editNameValue, currentBiome.nameJa])
  
  // 名前編集キャンセル
  const handleNameEditCancel = useCallback(() => {
    setIsEditingName(false)
  }, [])
  
  // 名前編集キー操作
  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNameEditConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleNameEditCancel()
    }
  }, [handleNameEditConfirm, handleNameEditCancel])
  
  // コード編集開始
  const handleCodeDoubleClick = useCallback(() => {
    setEditCodeValue(impressionCodeToString(code))
    setIsEditingCode(true)
  }, [code])
  
  // コード編集確定
  const handleCodeEditConfirm = useCallback(() => {
    const parsed = stringToImpressionCode(editCodeValue.toUpperCase())
    if (parsed) {
      // 各軸が1-5の範囲かチェック
      const isValid = 
        parsed.energy >= 1 && parsed.energy <= 5 &&
        parsed.formality >= 1 && parsed.formality <= 5 &&
        parsed.classicModern >= 1 && parsed.classicModern <= 5 &&
        parsed.decoration >= 1 && parsed.decoration <= 5
      
      if (isValid && !impressionCodesEqual(parsed, code)) {
        setPreviousCode(code)
        onCodeChange(parsed)
      }
    }
    setIsEditingCode(false)
  }, [editCodeValue, code, onCodeChange])
  
  // コード編集キャンセル
  const handleCodeEditCancel = useCallback(() => {
    setIsEditingCode(false)
  }, [])
  
  // コード編集キー操作
  const handleCodeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCodeEditConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCodeEditCancel()
    }
  }, [handleCodeEditConfirm, handleCodeEditCancel])
  
  // クリップボードにコピー
  const handleCopyToClipboard = useCallback(async () => {
    const displayName = customName || currentBiome.nameJa
    const text = `${displayName} (${currentBiome.name})`
    
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 1500)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }, [customName, currentBiome])
  
  // 編集開始時にフォーカス
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])
  
  useEffect(() => {
    if (isEditingCode && codeInputRef.current) {
      codeInputRef.current.focus()
      codeInputRef.current.select()
    }
  }, [isEditingCode])
  
  return (
    <div className="impression-panel">
      {/* 適用中のTone & Manner */}
      <div className="impression-section">
        <div className="impression-section-title">適用中のTone & Manner</div>
        <div className="impression-current">
          {/* Tone & Manner名（ダブルクリックで編集） */}
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              className="impression-current-name-input"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleNameEditConfirm}
            />
          ) : (
            <span 
              className="impression-current-name"
              onDoubleClick={handleNameDoubleClick}
              title="ダブルクリックで編集"
            >
              {customName || currentBiome.nameJa}
            </span>
          )}
          
          {/* コード（ダブルクリックで編集） */}
          {isEditingCode ? (
            <input
              ref={codeInputRef}
              type="text"
              className="impression-current-code-input"
              value={editCodeValue}
              onChange={(e) => setEditCodeValue(e.target.value.toUpperCase())}
              onKeyDown={handleCodeKeyDown}
              onBlur={handleCodeEditConfirm}
              placeholder="E3F3C3D3"
              maxLength={8}
            />
          ) : (
            <span 
              className="impression-current-code"
              onDoubleClick={handleCodeDoubleClick}
              title="ダブルクリックで編集"
            >
              {currentBiome.name}
            </span>
          )}
          
          {/* クリップボードにコピー */}
          <button
            className={`impression-copy-btn ${copyFeedback ? 'copied' : ''}`}
            onClick={handleCopyToClipboard}
            title="クリップボードにコピー"
          >
            <span className="material-icons">
              {copyFeedback ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
        
        {/* フィルターカテゴリタブ（階層構造） */}
        <div style={{ marginTop: '0.75rem' }}>
          <TonmanaCategoryTabs
            selectedCategories={selectedCategories}
            onCategoryAdd={(cat) => setSelectedCategories(prev => [...prev, cat])}
            onCategoriesClear={() => setSelectedCategories([])}
            usedBiomeIds={usedBiomeIds}
          />
        </div>
        
        {/* Tone & Mannerチップ一覧（常に表示、フィルターで絞り込み） */}
        <div style={{ marginTop: '0.5rem' }}>
          <TonmanaChipList
            categories={selectedCategories}
            selectedBiomeId={selectedBiomeId}
            onBiomeSelect={handleBiomeClick}
            usedBiomeIds={usedBiomeIds}
          />
        </div>
      </div>
      
      {/* カラー情報 */}
      <div className="impression-section">
        <ImpressionDetail
          selectedBiomeId={selectedBiomeId}
        />
      </div>
    </div>
  )
}
