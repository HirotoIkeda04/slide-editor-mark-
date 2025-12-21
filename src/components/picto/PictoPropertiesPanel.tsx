import type { PictoElement, PictoConnector, PictoFlowType, PictoConnectorDirection } from '../../types'
import { PICTO_FLOW_CONFIGS } from '../../constants/pictoConfigs'

interface PictoPropertiesPanelProps {
  selectedElement: PictoElement | null | undefined
  selectedConnector: PictoConnector | null | undefined
  onUpdateElement: (elementId: string, updates: Partial<PictoElement>) => void
  onUpdateConnector: (connectorId: string, updates: Partial<PictoConnector>) => void
  onClose?: () => void
}

export function PictoPropertiesPanel({
  selectedElement,
  selectedConnector,
  onUpdateElement,
  onUpdateConnector,
  onClose
}: PictoPropertiesPanelProps) {
  // Don't render if nothing is selected
  if (!selectedElement && !selectedConnector) {
    return null
  }

  if (selectedElement) {
    return (
      <div className="picto-properties">
        <div className="picto-properties-header">
          <div className="picto-properties-title">要素のプロパティ</div>
          {onClose && (
            <button className="picto-properties-close" onClick={onClose} title="閉じる">
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        
        <div className="picto-properties-group">
          <label className="picto-properties-label">ラベル</label>
          <input
            type="text"
            className="picto-properties-input"
            value={selectedElement.label}
            onChange={(e) => onUpdateElement(selectedElement.id, { label: e.target.value })}
          />
        </div>

        <div className="picto-properties-group">
          <label className="picto-properties-label">位置 X</label>
          <input
            type="number"
            className="picto-properties-input"
            value={selectedElement.position.x}
            onChange={(e) => onUpdateElement(selectedElement.id, {
              position: { ...selectedElement.position, x: Number(e.target.value) }
            })}
          />
        </div>

        <div className="picto-properties-group">
          <label className="picto-properties-label">位置 Y</label>
          <input
            type="number"
            className="picto-properties-input"
            value={selectedElement.position.y}
            onChange={(e) => onUpdateElement(selectedElement.id, {
              position: { ...selectedElement.position, y: Number(e.target.value) }
            })}
          />
        </div>
      </div>
    )
  }

  if (selectedConnector) {
    return (
      <div className="picto-properties">
        <div className="picto-properties-header">
          <div className="picto-properties-title">コネクタのプロパティ</div>
          {onClose && (
            <button className="picto-properties-close" onClick={onClose} title="閉じる">
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        
        <div className="picto-properties-group">
          <label className="picto-properties-label">ラベル</label>
          <input
            type="text"
            className="picto-properties-input"
            value={selectedConnector.label || ''}
            onChange={(e) => onUpdateConnector(selectedConnector.id, { label: e.target.value })}
            placeholder="販売、支払いなど"
          />
        </div>

        <div className="picto-properties-group">
          <label className="picto-properties-label">流れの種類</label>
          <select
            className="picto-properties-select"
            value={selectedConnector.flowType}
            onChange={(e) => onUpdateConnector(selectedConnector.id, { 
              flowType: e.target.value as PictoFlowType 
            })}
          >
            {Object.values(PICTO_FLOW_CONFIGS).map(config => (
              <option key={config.type} value={config.type}>
                {config.nameJa}
              </option>
            ))}
          </select>
        </div>

        <div className="picto-properties-group">
          <label className="picto-properties-label">方向</label>
          <select
            className="picto-properties-select"
            value={selectedConnector.direction}
            onChange={(e) => onUpdateConnector(selectedConnector.id, { 
              direction: e.target.value as PictoConnectorDirection 
            })}
          >
            <option value="forward">順方向 →</option>
            <option value="backward">逆方向 ←</option>
            <option value="bidirectional">双方向 ↔</option>
          </select>
        </div>

        <div className="picto-properties-group">
          <label className="picto-properties-label">ラベル位置</label>
          <select
            className="picto-properties-select"
            value={selectedConnector.labelPosition || 'above'}
            onChange={(e) => onUpdateConnector(selectedConnector.id, { 
              labelPosition: e.target.value as 'above' | 'below' 
            })}
          >
            <option value="above">上</option>
            <option value="below">下</option>
          </select>
        </div>
      </div>
    )
  }

  return null
}
