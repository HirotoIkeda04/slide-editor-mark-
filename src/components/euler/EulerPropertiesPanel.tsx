import type { EulerCircle, EulerElement } from '../../types'
import { EULER_COLOR_PALETTE, MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS } from '../../constants/eulerConfigs'

// 要素用のカラーパレット
const ELEMENT_COLOR_PALETTE = [
  '#333333',  // Dark gray
  '#1976D2',  // Blue
  '#D32F2F',  // Red
  '#388E3C',  // Green
  '#7B1FA2',  // Purple
  '#F57C00',  // Orange
  '#00796B',  // Teal
  '#C2185B',  // Pink
]

interface EulerPropertiesPanelProps {
  circle: EulerCircle | null
  element: EulerElement | null
  onUpdateCircle: (updates: Partial<EulerCircle>) => void
  onUpdateElement: (updates: Partial<EulerElement>) => void
  onDelete: () => void
}

export function EulerPropertiesPanel({
  circle,
  element,
  onUpdateCircle,
  onUpdateElement,
  onDelete
}: EulerPropertiesPanelProps) {
  // 円のプロパティ
  if (circle) {
    return (
      <div className="euler-properties-panel">
        <div className="euler-properties-row">
          <span className="euler-properties-type">円（集合）</span>

          {/* Label */}
          <div className="euler-properties-field">
            <label>ラベル</label>
            <input
              type="text"
              value={circle.label}
              onChange={(e) => onUpdateCircle({ label: e.target.value })}
              placeholder="ラベル..."
            />
          </div>

          {/* Radius */}
          <div className="euler-properties-field">
            <label>半径: {circle.radius}px</label>
            <input
              type="range"
              min={MIN_CIRCLE_RADIUS}
              max={MAX_CIRCLE_RADIUS}
              value={circle.radius}
              onChange={(e) => onUpdateCircle({ radius: Number(e.target.value) })}
            />
          </div>

          {/* Color */}
          <div className="euler-properties-field">
            <label>色</label>
            <div className="euler-color-palette">
              {EULER_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className={`euler-color-button ${circle.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateCircle({ color })}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Delete button */}
          <button
            className="euler-delete-button"
            onClick={onDelete}
            title="削除"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>
    )
  }

  // 要素のプロパティ
  if (element) {
    return (
      <div className="euler-properties-panel">
        <div className="euler-properties-row">
          <span className="euler-properties-type">要素</span>

          {/* Label */}
          <div className="euler-properties-field">
            <label>ラベル</label>
            <input
              type="text"
              value={element.label}
              onChange={(e) => onUpdateElement({ label: e.target.value })}
              placeholder="ラベル..."
            />
          </div>

          {/* Shape */}
          <div className="euler-properties-field">
            <label>表示</label>
            <select
              value={element.shape}
              onChange={(e) => onUpdateElement({ shape: e.target.value as 'dot' | 'label' | 'text' })}
            >
              <option value="label">点+ラベル</option>
              <option value="dot">点のみ</option>
              <option value="text">文字のみ</option>
            </select>
          </div>

          {/* Color */}
          <div className="euler-properties-field">
            <label>色</label>
            <div className="euler-color-palette">
              {ELEMENT_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  className={`euler-color-button ${(element.color || '#333333') === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateElement({ color })}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Delete button */}
          <button
            className="euler-delete-button"
            onClick={onDelete}
            title="削除"
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>
    )
  }

  // 何も選択されていない場合
  return (
    <div className="euler-properties-panel euler-properties-empty">
      <span className="material-icons">info</span>
      <p>円または要素を選択してプロパティを編集</p>
    </div>
  )
}
