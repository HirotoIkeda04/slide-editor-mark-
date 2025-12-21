import { PICTO_ELEMENT_CONFIGS } from '../../constants/pictoConfigs'
import type { PictoElementType } from '../../types'
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

export function PictoElementPalette() {
  const handleDragStart = (e: React.DragEvent, type: PictoElementType) => {
    e.dataTransfer.setData('picto-element-type', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="picto-palette">
      <div className="picto-palette-title">要素</div>
      <div className="picto-palette-grid">
        {Object.values(PICTO_ELEMENT_CONFIGS).map(config => {
          const IconComponent = ELEMENT_ICONS[config.type]
          return (
            <div
              key={config.type}
              className="picto-palette-item"
              draggable
              onDragStart={(e) => handleDragStart(e, config.type)}
              title={config.nameJa}
            >
              <div className="picto-palette-item-icon">
                <IconComponent size={32} />
              </div>
              <span className="picto-palette-item-label">{config.nameJa}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
