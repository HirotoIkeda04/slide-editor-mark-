import type { Item } from '../../types'
import './MentionPopup.css'

interface MentionPopupProps {
  items: Item[]
  searchQuery: string
  selectedIndex: number
  position: { x: number; y: number }
  showAbove?: boolean  // 上に表示するかどうか
  onSelect: (item: Item) => void
  onClose: () => void
}

// アイテムタイプに対応するアイコンを取得
const getItemIcon = (type: Item['type']): string => {
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
      return 'donut_small'
    default:
      return 'inventory_2'
  }
}

// アイテムタイプの表示名を取得
const getItemTypeLabel = (type: Item['type']): string => {
  switch (type) {
    case 'slide':
      return 'スライド'
    case 'table':
      return 'テーブル'
    case 'image':
      return '画像'
    case 'text':
      return 'テキスト'
    case 'picto':
      return 'ピクト'
    case 'euler':
      return 'オイラー'
    default:
      return 'その他'
  }
}

export const MentionPopup = ({
  items,
  searchQuery,
  selectedIndex,
  position,
  showAbove = false,
  onSelect,
  onClose,
}: MentionPopupProps) => {
  // 位置スタイルの計算
  const positionStyle = showAbove
    ? { left: position.x, bottom: window.innerHeight - position.y }
    : { left: position.x, top: position.y }

  if (items.length === 0) {
    return (
      <div
        className={`mention-popup ${showAbove ? 'mention-popup-above' : ''}`}
        style={positionStyle}
      >
        <div className="mention-popup-empty">
          {searchQuery ? `"${searchQuery}" に一致するアイテムがありません` : 'アイテムがありません'}
        </div>
      </div>
    )
  }

  // アイテムをタイプ別にグループ化
  const groupedItems = items.reduce((acc, item) => {
    const type = item.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(item)
    return acc
  }, {} as Record<string, Item[]>)

  // グループの表示順序
  const typeOrder: Item['type'][] = ['slide', 'table', 'image', 'text', 'picto', 'euler', 'new']
  const sortedTypes = Object.keys(groupedItems).sort(
    (a, b) => typeOrder.indexOf(a as Item['type']) - typeOrder.indexOf(b as Item['type'])
  )

  // フラットなインデックスを計算するためのマップ
  let flatIndex = 0
  const indexMap = new Map<Item, number>()
  for (const type of sortedTypes) {
    for (const item of groupedItems[type]) {
      indexMap.set(item, flatIndex)
      flatIndex++
    }
  }

  return (
    <div
      className={`mention-popup ${showAbove ? 'mention-popup-above' : ''}`}
      style={positionStyle}
      onMouseDown={(e) => e.preventDefault()} // フォーカスを奪わない
    >
      <div className="mention-popup-header">
        <span className="mention-popup-header-icon material-icons">alternate_email</span>
        <span>アイテムを挿入</span>
      </div>
      <div className="mention-popup-content">
        {sortedTypes.map((type) => (
          <div key={type} className="mention-popup-group">
            <div className="mention-popup-group-label">
              <span className="material-icons">{getItemIcon(type as Item['type'])}</span>
              <span>{getItemTypeLabel(type as Item['type'])}</span>
            </div>
            {groupedItems[type].map((item) => {
              const itemIndex = indexMap.get(item)!
              const isSelected = itemIndex === selectedIndex
              return (
                <div
                  key={item.id}
                  className={`mention-popup-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(item)}
                  onMouseEnter={(e) => {
                    // マウスホバーで選択状態を更新しない（キーボード操作を優先）
                    e.currentTarget.classList.add('hovered')
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.classList.remove('hovered')
                  }}
                >
                  <span className="mention-popup-item-name">{item.name}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mention-popup-footer">
        <span className="mention-popup-hint">
          <kbd>↑</kbd><kbd>↓</kbd> 選択
        </span>
        <span className="mention-popup-hint">
          <kbd>Tab</kbd> 確定
        </span>
        <span className="mention-popup-hint">
          <kbd>Esc</kbd> 閉じる
        </span>
      </div>
    </div>
  )
}
