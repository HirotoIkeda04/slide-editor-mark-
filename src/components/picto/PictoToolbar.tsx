import { useState, useRef, useEffect } from 'react'
import type { EditorMode } from './PictoEditor'
import type { PictoElementType } from '../../types'
import { PICTO_ELEMENT_CONFIGS } from '../../constants/pictoConfigs'
import { PersonIcon } from './elements/PersonIcon'
import { CompanyIcon } from './elements/CompanyIcon'
import { MoneyIcon } from './elements/MoneyIcon'
import { ProductIcon } from './elements/ProductIcon'
import { InfoIcon } from './elements/InfoIcon'
import { SmartphoneIcon } from './elements/SmartphoneIcon'
import { StoreIcon } from './elements/StoreIcon'
import { OtherIcon } from './elements/OtherIcon'

const ELEMENT_ICONS: Record<PictoElementType, React.FC<{ size?: number }>> = {
  person: PersonIcon,
  company: CompanyIcon,
  money: MoneyIcon,
  product: ProductIcon,
  info: InfoIcon,
  smartphone: SmartphoneIcon,
  store: StoreIcon,
  other: OtherIcon
}

interface PictoToolbarProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onDelete: () => void
  onGroup: () => void
  canDelete: boolean
  canGroup: boolean
  onAddElement: (type: PictoElementType) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export function PictoToolbar({
  mode,
  onModeChange,
  onDelete,
  onGroup,
  canDelete,
  canGroup,
  onAddElement,
  isExpanded,
  onToggleExpand
}: PictoToolbarProps) {
  const [showPalette, setShowPalette] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  // Close palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPalette && paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPalette])

  const handleElementClick = (type: PictoElementType) => {
    onAddElement(type)
    setShowPalette(false)
  }

  return (
    <div className="picto-toolbar">
      <div className="picto-toolbar-group">
        <button
          className={`picto-toolbar-btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => onModeChange('select')}
          title="選択モード (V)"
        >
          <span className="material-icons">near_me</span>
        </button>
        <button
          className={`picto-toolbar-btn ${mode === 'connect' ? 'active' : ''}`}
          onClick={() => onModeChange('connect')}
          title="接続モード (C)"
        >
          <span className="material-icons">trending_flat</span>
        </button>
        <button
          className={`picto-toolbar-btn ${mode === 'comment' ? 'active' : ''}`}
          onClick={() => onModeChange('comment')}
          title="コメントモード (T)"
        >
          <span className="material-icons">chat_bubble_outline</span>
        </button>
      </div>

      <div className="picto-toolbar-divider" />

      <div className="picto-toolbar-group">
        <button
          className="picto-toolbar-btn"
          onClick={onDelete}
          disabled={!canDelete}
          title="削除 (Delete)"
        >
          <span className="material-icons">delete_outline</span>
        </button>
        <button
          className="picto-toolbar-btn"
          onClick={onGroup}
          disabled={!canGroup}
          title="グループ化 (Ctrl+G)"
        >
          <span className="material-icons">group_work</span>
        </button>
      </div>

      <div className="picto-toolbar-divider" />

      {/* Element Palette Dropdown */}
      <div className="picto-toolbar-palette-wrapper" ref={paletteRef}>
        <button
          className={`picto-toolbar-btn picto-toolbar-add-btn ${showPalette ? 'active' : ''}`}
          onClick={() => setShowPalette(!showPalette)}
          title="要素を追加"
        >
          <span className="material-icons">add</span>
        </button>

        {showPalette && (
          <div className="picto-palette-dropdown">
            {Object.values(PICTO_ELEMENT_CONFIGS).map(config => {
              const IconComponent = ELEMENT_ICONS[config.type]
              return (
                <button
                  key={config.type}
                  className="picto-palette-dropdown-item"
                  onClick={() => handleElementClick(config.type)}
                  title={config.nameJa}
                >
                  <div className="picto-palette-dropdown-icon">
                    <IconComponent size={24} />
                  </div>
                  <span className="picto-palette-dropdown-label">{config.nameJa}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="picto-toolbar-spacer" />

      {/* Expand Button */}
      <button
        className={`picto-toolbar-btn ${isExpanded ? 'active' : ''}`}
        onClick={onToggleExpand}
        title={isExpanded ? "縮小" : "拡大"}
      >
        <span className="material-icons">{isExpanded ? 'close_fullscreen' : 'open_in_full'}</span>
      </button>
    </div>
  )
}
