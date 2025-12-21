import type { PictoItem, PictoElement, PictoElementType } from '../../types'
import { PICTO_FLOW_CONFIGS } from '../../constants/pictoConfigs'
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

interface PictoRendererProps {
  item: PictoItem
  scale?: number
  fitToContent?: boolean
}

export function PictoRenderer({ item, scale = 1, fitToContent = true }: PictoRendererProps) {
  const { elements, connectors, groups, comments, canvasSize } = item

  // Calculate bounding box of all elements
  const calculateBoundingBox = () => {
    if (elements.length === 0) {
      return { minX: 0, minY: 0, maxX: canvasSize.width, maxY: canvasSize.height }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    // Include elements
    elements.forEach(el => {
      const width = el.size?.width || 50
      const height = el.size?.height || 50
      const labelHeight = 20 // Space for label below element

      minX = Math.min(minX, el.position.x)
      minY = Math.min(minY, el.position.y)
      maxX = Math.max(maxX, el.position.x + width)
      maxY = Math.max(maxY, el.position.y + height + labelHeight)
    })

    // Include comments
    comments.forEach(comment => {
      const commentWidth = 120
      const commentHeight = comment.style === 'bubble' ? 50 : 40

      minX = Math.min(minX, comment.position.x)
      minY = Math.min(minY, comment.position.y)
      maxX = Math.max(maxX, comment.position.x + commentWidth)
      maxY = Math.max(maxY, comment.position.y + commentHeight)
    })

    // Include groups (with their labels)
    groups.forEach(group => {
      const groupElements = elements.filter(el => group.elementIds.includes(el.id))
      if (groupElements.length === 0) return

      groupElements.forEach(el => {
        const width = el.size?.width || 50
        const height = el.size?.height || 50
        minX = Math.min(minX, el.position.x - 15) // group padding
        minY = Math.min(minY, el.position.y - 30) // group padding + label
        maxX = Math.max(maxX, el.position.x + width + 15)
        maxY = Math.max(maxY, el.position.y + height + 35) // include element label
      })
    })

    // Add padding around the content
    const padding = 15
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    }
  }

  // Get element center position for connector
  const getElementCenter = (element: PictoElement) => {
    const width = element.size?.width || 50
    const height = element.size?.height || 50
    return {
      x: element.position.x + width / 2,
      y: element.position.y + height / 2
    }
  }

  // Render groups
  const renderGroups = () => {
    return groups.map(group => {
      const groupElements = elements.filter(el => group.elementIds.includes(el.id))
      if (groupElements.length === 0) return null

      // Calculate bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      groupElements.forEach(el => {
        const width = el.size?.width || 50
        const height = el.size?.height || 50
        minX = Math.min(minX, el.position.x)
        minY = Math.min(minY, el.position.y)
        maxX = Math.max(maxX, el.position.x + width)
        maxY = Math.max(maxY, el.position.y + height)
      })

      const padding = 15
      return (
        <g key={group.id}>
          <rect
            x={minX - padding}
            y={minY - padding}
            width={maxX - minX + padding * 2}
            height={maxY - minY + padding * 2}
            rx={8}
            fill="none"
            stroke={group.color || '#E91E63'}
            strokeWidth={2}
            strokeDasharray={group.style === 'dashed' ? '8 4' : undefined}
          />
          {group.label && (
            <text
              x={minX - padding + 8}
              y={minY - padding - 5}
              fontSize={10}
              fill={group.color || '#E91E63'}
            >
              {group.label}
            </text>
          )}
        </g>
      )
    })
  }

  // Render connectors
  // Generate pair key for grouping connectors between same elements
  const pairKey = (fromId: string, toId: string) => [fromId, toId].sort().join('-')

  // Group connectors by element pairs
  const connectorGroups = new Map<string, typeof connectors>()
  connectors.forEach(conn => {
    const key = pairKey(conn.fromElementId, conn.toElementId)
    if (!connectorGroups.has(key)) {
      connectorGroups.set(key, [])
    }
    connectorGroups.get(key)!.push(conn)
  })

  // Get offset for a connector based on its position in the group
  const getConnectorOffset = (connector: typeof connectors[0]) => {
    const key = pairKey(connector.fromElementId, connector.toElementId)
    const group = connectorGroups.get(key) || []
    const index = group.findIndex(c => c.id === connector.id)
    const total = group.length
    if (total <= 1) return 0
    const spacing = 16
    // Ensure minimum separation of spacing between lines
    return (index - (total - 1) / 2) * spacing * 2
  }

  const renderConnectors = () => {
    return connectors.map(connector => {
      const fromElement = elements.find(el => el.id === connector.fromElementId)
      const toElement = elements.find(el => el.id === connector.toElementId)
      if (!fromElement || !toElement) return null

      const from = getElementCenter(fromElement)
      const to = getElementCenter(toElement)
      const flowConfig = PICTO_FLOW_CONFIGS[connector.flowType]

      // Calculate arrow path
      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.sqrt(dx * dx + dy * dy)
      const nx = dx / len
      const ny = dy / len

      // Calculate perpendicular offset for parallel connectors
      // Use consistent normal direction based on sorted pair order
      const offset = getConnectorOffset(connector)
      const sortedPair = [connector.fromElementId, connector.toElementId].sort()
      const isReversed = sortedPair[0] !== connector.fromElementId
      const effectiveOffset = isReversed ? -offset : offset
      const perpX = -ny * effectiveOffset
      const perpY = nx * effectiveOffset

      // Adjust start and end points
      const fromRadius = 30
      const toRadius = 30
      const startX = from.x + nx * fromRadius + perpX
      const startY = from.y + ny * fromRadius + perpY
      const endX = to.x - nx * toRadius + perpX
      const endY = to.y - ny * toRadius + perpY

      // Arrow head size
      const arrowSize = 12
      const arrowAngle = Math.atan2(dy, dx)
      const arrowHead1X = endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6)
      const arrowHead1Y = endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      const arrowHead2X = endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6)
      const arrowHead2Y = endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)

      // Adjust line endpoints so line doesn't pierce through arrowheads
      const hasForwardArrow = connector.direction === 'forward' || connector.direction === 'bidirectional'
      const hasBackwardArrow = connector.direction === 'backward' || connector.direction === 'bidirectional'
      const lineStartX = hasBackwardArrow ? startX + nx * arrowSize : startX
      const lineStartY = hasBackwardArrow ? startY + ny * arrowSize : startY
      const lineEndX = hasForwardArrow ? endX - nx * arrowSize : endX
      const lineEndY = hasForwardArrow ? endY - ny * arrowSize : endY

      // Label position
      const labelX = (startX + endX) / 2
      const labelY = (startY + endY) / 2 + (connector.labelPosition === 'below' ? 15 : -8)

      return (
        <g key={connector.id}>
          <line
            x1={lineStartX}
            y1={lineStartY}
            x2={lineEndX}
            y2={lineEndY}
            stroke={flowConfig.color}
            strokeWidth={flowConfig.strokeWidth}
          />
          {/* Forward arrow */}
          {hasForwardArrow && (
            <polygon
              points={`${endX},${endY} ${arrowHead1X},${arrowHead1Y} ${arrowHead2X},${arrowHead2Y}`}
              fill={flowConfig.color}
            />
          )}
          {/* Backward arrow */}
          {hasBackwardArrow && (
            <polygon
              points={`${startX},${startY} ${startX + arrowSize * Math.cos(arrowAngle + Math.PI - Math.PI / 6)},${startY + arrowSize * Math.sin(arrowAngle + Math.PI - Math.PI / 6)} ${startX + arrowSize * Math.cos(arrowAngle + Math.PI + Math.PI / 6)},${startY + arrowSize * Math.sin(arrowAngle + Math.PI + Math.PI / 6)}`}
              fill={flowConfig.color}
            />
          )}
          {/* Label */}
          {connector.label && (
            <text
              x={labelX}
              y={labelY}
              fontSize={10}
              textAnchor="middle"
              fill="#666"
            >
              {connector.label}
            </text>
          )}
        </g>
      )
    })
  }

  // Render elements
  const renderElements = () => {
    return elements.map(element => {
      const IconComponent = ELEMENT_ICONS[element.type]
      const width = element.size?.width || 50
      const height = element.size?.height || 50

      return (
        <g
          key={element.id}
          transform={`translate(${element.position.x}, ${element.position.y})`}
        >
          <foreignObject x={0} y={0} width={width} height={height}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent size={Math.min(width, height) * 0.8} />
            </div>
          </foreignObject>
          <text
            x={width / 2}
            y={height + 14}
            fontSize={11}
            textAnchor="middle"
            fill="#333"
          >
            {element.label}
          </text>
        </g>
      )
    })
  }

  // Render comments
  const renderComments = () => {
    return comments.map(comment => (
      <g
        key={comment.id}
        transform={`translate(${comment.position.x}, ${comment.position.y})`}
      >
        {comment.style === 'bubble' ? (
          <>
            <rect
              x={0}
              y={0}
              width={120}
              height={40}
              rx={8}
              fill="white"
              stroke="#ddd"
            />
            <polygon
              points="10,40 20,50 30,40"
              fill="white"
              stroke="#ddd"
            />
          </>
        ) : (
          <rect
            x={0}
            y={0}
            width={120}
            height={40}
            fill="white"
            stroke="#ddd"
            strokeDasharray="4 2"
            rx={4}
          />
        )}
        <text
          x={10}
          y={25}
          fontSize={11}
          fill="#333"
        >
          {comment.text}
        </text>
      </g>
    ))
  }

  // Calculate viewBox based on content or use fixed canvas size
  const bbox = fitToContent ? calculateBoundingBox() : { minX: 0, minY: 0, maxX: canvasSize.width, maxY: canvasSize.height }
  const viewBoxWidth = bbox.maxX - bbox.minX
  const viewBoxHeight = bbox.maxY - bbox.minY

  return (
    <svg
      width={fitToContent ? undefined : canvasSize.width * scale}
      height={fitToContent ? undefined : canvasSize.height * scale}
      viewBox={`${bbox.minX} ${bbox.minY} ${viewBoxWidth} ${viewBoxHeight}`}
      style={{ 
        display: 'block', 
        width: '100%', 
        height: 'auto',
        maxHeight: fitToContent ? '400px' : undefined
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {renderGroups()}
      {renderConnectors()}
      {renderElements()}
      {renderComments()}
    </svg>
  )
}
