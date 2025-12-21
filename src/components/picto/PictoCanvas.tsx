import { useCallback, useState, useRef } from 'react'
import type { PictoElement, PictoConnector, PictoGroup, PictoComment, PictoElementType } from '../../types'
import { PICTO_FLOW_CONFIGS, GRID_SIZE } from '../../constants/pictoConfigs'
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

interface PictoCanvasProps {
  elements: PictoElement[]
  connectors: PictoConnector[]
  groups: PictoGroup[]
  comments: PictoComment[]
  selectedElementIds: string[]
  selectedConnectorId: string | null
  connectingFrom: string | null
  dragPreview: { type: PictoElementType; x: number; y: number } | null
  canvasSize: { width: number; height: number }
  onElementClick: (elementId: string, shiftKey: boolean) => void
  onConnectorClick: (connectorId: string) => void
  onCanvasClick: () => void
  onElementMove: (elementId: string, x: number, y: number) => void
  onMarqueeSelect: (elementIds: string[]) => void
}

export function PictoCanvas({
  elements,
  connectors,
  groups,
  comments,
  selectedElementIds,
  selectedConnectorId,
  connectingFrom,
  dragPreview,
  canvasSize,
  onElementClick,
  onConnectorClick,
  onCanvasClick,
  onElementMove,
  onMarqueeSelect
}: PictoCanvasProps) {
  const [dragging, setDragging] = useState<{ elementId: string; offsetX: number; offsetY: number } | null>(null)
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Get element center position for connector
  const getElementCenter = useCallback((element: PictoElement) => {
    const width = element.size?.width || 50
    const height = element.size?.height || 50
    return {
      x: element.position.x + width / 2,
      y: element.position.y + height / 2
    }
  }, [])

  // Handle element mouse down (start drag)
  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: PictoElement) => {
    e.stopPropagation()
    if (e.button !== 0) return
    
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragging({
      elementId: element.id,
      offsetX: e.clientX - rect.left - element.position.x,
      offsetY: e.clientY - rect.top - element.position.y
    })
  }, [])

  // Handle mouse move (drag or marquee)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()

    // Handle element dragging
    if (dragging) {
      const x = e.clientX - rect.left - dragging.offsetX
      const y = e.clientY - rect.top - dragging.offsetY
      onElementMove(dragging.elementId, x, y)
      return
    }

    // Handle marquee selection
    if (marquee) {
      setMarquee({
        ...marquee,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top
      })
    }
  }, [dragging, marquee, onElementMove])

  // Handle mouse up (end drag or marquee)
  const handleMouseUp = useCallback(() => {
    // End marquee selection
    if (marquee) {
      const minX = Math.min(marquee.startX, marquee.currentX)
      const maxX = Math.max(marquee.startX, marquee.currentX)
      const minY = Math.min(marquee.startY, marquee.currentY)
      const maxY = Math.max(marquee.startY, marquee.currentY)

      // Find elements within the marquee
      const selectedIds = elements.filter(element => {
        const elWidth = element.size?.width || 50
        const elHeight = element.size?.height || 50
        const elCenterX = element.position.x + elWidth / 2
        const elCenterY = element.position.y + elHeight / 2

        return elCenterX >= minX && elCenterX <= maxX &&
               elCenterY >= minY && elCenterY <= maxY
      }).map(el => el.id)

      if (selectedIds.length > 0) {
        onMarqueeSelect(selectedIds)
      }

      setMarquee(null)
    }

    setDragging(null)
  }, [marquee, elements, onMarqueeSelect])

  // Handle canvas mouse down (start marquee)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start marquee if clicking directly on canvas (not on an element)
    if (e.target === svgRef.current && e.button === 0) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMarquee({ startX: x, startY: y, currentX: x, currentY: y })
    }
  }, [])

  // Render grid
  const renderGrid = () => {
    const lines = []
    for (let x = 0; x <= canvasSize.width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasSize.height}
          stroke="var(--app-border-primary)"
          strokeWidth={0.5}
          opacity={0.3}
        />
      )
    }
    for (let y = 0; y <= canvasSize.height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasSize.width}
          y2={y}
          stroke="var(--app-border-primary)"
          strokeWidth={0.5}
          opacity={0.3}
        />
      )
    }
    return <g className="picto-canvas-grid">{lines}</g>
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
        <g key={group.id} className="picto-group">
          <rect
            className="picto-group-rect"
            x={minX - padding}
            y={minY - padding}
            width={maxX - minX + padding * 2}
            height={maxY - minY + padding * 2}
            rx={8}
            stroke={group.color || '#E91E63'}
            strokeDasharray={group.style === 'dashed' ? '8 4' : undefined}
          />
          {group.label && (
            <text
              className="picto-group-label"
              x={minX - padding + 8}
              y={minY - padding - 5}
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
      const isSelected = selectedConnectorId === connector.id

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

      // Adjust start and end points to not overlap with elements
      const fromRadius = 30
      const toRadius = 30
      const startX = from.x + nx * fromRadius + perpX
      const startY = from.y + ny * fromRadius + perpY
      const endX = to.x - nx * toRadius + perpX
      const endY = to.y - ny * toRadius + perpY

      // Arrow head size
      const arrowSize = 12

      // Calculate arrow head points
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

      // Label position (middle of line)
      const labelX = (startX + endX) / 2
      const labelY = (startY + endY) / 2 + (connector.labelPosition === 'below' ? 15 : -8)

      return (
        <g
          key={connector.id}
          className={`picto-connector ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onConnectorClick(connector.id)
          }}
        >
          <line
            className="picto-connector-line"
            x1={lineStartX}
            y1={lineStartY}
            x2={lineEndX}
            y2={lineEndY}
            stroke={flowConfig.color}
            strokeWidth={flowConfig.strokeWidth}
          />
          {/* Forward arrow */}
          {(connector.direction === 'forward' || connector.direction === 'bidirectional') && (
            <polygon
              points={`${endX},${endY} ${arrowHead1X},${arrowHead1Y} ${arrowHead2X},${arrowHead2Y}`}
              fill={flowConfig.color}
            />
          )}
          {/* Backward arrow */}
          {(connector.direction === 'backward' || connector.direction === 'bidirectional') && (
            <polygon
              points={`${startX},${startY} ${startX + arrowSize * Math.cos(arrowAngle + Math.PI - Math.PI / 6)},${startY + arrowSize * Math.sin(arrowAngle + Math.PI - Math.PI / 6)} ${startX + arrowSize * Math.cos(arrowAngle + Math.PI + Math.PI / 6)},${startY + arrowSize * Math.sin(arrowAngle + Math.PI + Math.PI / 6)}`}
              fill={flowConfig.color}
            />
          )}
          {/* Label */}
          {connector.label && (
            <text
              className="picto-connector-label"
              x={labelX}
              y={labelY}
              textAnchor="middle"
            >
              {connector.label}
            </text>
          )}
          {/* Invisible wider line for easier clicking */}
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="transparent"
            strokeWidth={12}
          />
        </g>
      )
    })
  }

  // Render elements
  const renderElements = () => {
    return elements.map(element => {
      const isSelected = selectedElementIds.includes(element.id)
      const isConnecting = connectingFrom === element.id
      const IconComponent = ELEMENT_ICONS[element.type]
      const width = element.size?.width || 50
      const height = element.size?.height || 50

      return (
        <g
          key={element.id}
          className={`picto-element ${isSelected ? 'selected' : ''} ${isConnecting ? 'connecting' : ''}`}
          transform={`translate(${element.position.x}, ${element.position.y})`}
          onMouseDown={(e) => handleElementMouseDown(e, element)}
          onClick={(e) => {
            e.stopPropagation()
            onElementClick(element.id, e.shiftKey)
          }}
        >
          {/* Selection outline */}
          <rect
            className="picto-element-outline"
            x={-4}
            y={-4}
            width={width + 8}
            height={height + 8}
            fill="none"
            stroke="transparent"
            rx={4}
          />
          
          {/* Icon */}
          <foreignObject x={0} y={0} width={width} height={height}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent size={Math.min(width, height) * 0.8} />
            </div>
          </foreignObject>

          {/* Label */}
          <text
            className="picto-element-label"
            x={width / 2}
            y={height + 16}
          >
            {element.label}
          </text>

          {/* Connection points (shown on hover) */}
          <circle className="picto-connection-point" cx={width / 2} cy={0} r={5} />
          <circle className="picto-connection-point" cx={width} cy={height / 2} r={5} />
          <circle className="picto-connection-point" cx={width / 2} cy={height} r={5} />
          <circle className="picto-connection-point" cx={0} cy={height / 2} r={5} />
        </g>
      )
    })
  }

  // Render comments
  const renderComments = () => {
    return comments.map(comment => (
      <g
        key={comment.id}
        className="picto-comment"
        transform={`translate(${comment.position.x}, ${comment.position.y})`}
      >
        {comment.style === 'bubble' ? (
          <>
            <rect
              className="picto-comment-bubble"
              x={0}
              y={0}
              width={120}
              height={40}
              rx={8}
            />
            <polygon
              className="picto-comment-bubble"
              points="10,40 20,50 30,40"
            />
          </>
        ) : (
          <rect
            x={0}
            y={0}
            width={120}
            height={40}
            fill="var(--app-bg-primary)"
            stroke="var(--app-border-primary)"
            strokeDasharray="4 2"
            rx={4}
          />
        )}
        <text
          className="picto-comment-text"
          x={10}
          y={25}
        >
          {comment.text}
        </text>
      </g>
    ))
  }

  // Render drag preview
  const renderDragPreview = () => {
    if (!dragPreview) return null
    const IconComponent = ELEMENT_ICONS[dragPreview.type]
    
    return (
      <g
        className="picto-drag-preview"
        transform={`translate(${dragPreview.x - 25}, ${dragPreview.y - 25})`}
      >
        <foreignObject x={0} y={0} width={50} height={50}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconComponent size={40} />
          </div>
        </foreignObject>
      </g>
    )
  }

  // Render marquee selection rectangle
  const renderMarquee = () => {
    if (!marquee) return null
    
    const x = Math.min(marquee.startX, marquee.currentX)
    const y = Math.min(marquee.startY, marquee.currentY)
    const width = Math.abs(marquee.currentX - marquee.startX)
    const height = Math.abs(marquee.currentY - marquee.startY)

    return (
      <rect
        className="picto-marquee"
        x={x}
        y={y}
        width={width}
        height={height}
      />
    )
  }

  // Handle click - only trigger if not a marquee drag
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only call onCanvasClick if there was no marquee selection
    if (!marquee) {
      onCanvasClick()
    }
  }, [marquee, onCanvasClick])

  return (
    <svg
      ref={svgRef}
      className="picto-canvas-svg"
      width={canvasSize.width}
      height={canvasSize.height}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      {renderGrid()}
      {renderGroups()}
      {renderConnectors()}
      {renderElements()}
      {renderComments()}
      {renderDragPreview()}
      {renderMarquee()}
    </svg>
  )
}
