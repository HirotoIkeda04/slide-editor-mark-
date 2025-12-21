import type { EulerItem, EulerCircle } from '../../types'
import { CIRCLE_FILL_OPACITY, CIRCLE_STROKE_WIDTH, LABEL_FONT_SIZE } from '../../constants/eulerConfigs'

interface EulerRendererProps {
  item: EulerItem
  scale?: number
  fitToContent?: boolean
}

const ELEMENT_DOT_RADIUS = 6
const ELEMENT_FONT_SIZE = 14
const LABEL_OFFSET = 20

export function EulerRenderer({ item, scale = 1, fitToContent = true }: EulerRendererProps) {
  const { circles, elements = [], canvasSize } = item

  // Calculate label position outside the circle, avoiding overlap with other circles
  const getLabelPosition = (circle: EulerCircle, allCircles: EulerCircle[]): { x: number; y: number; textAnchor: string } => {
    const candidates = [
      { angle: -90, name: 'top', textAnchor: 'middle' },      // 上
      { angle: 90, name: 'bottom', textAnchor: 'middle' },    // 下
      { angle: 180, name: 'left', textAnchor: 'end' },        // 左
      { angle: 0, name: 'right', textAnchor: 'start' },       // 右
      { angle: -45, name: 'topRight', textAnchor: 'start' },  // 右上
      { angle: -135, name: 'topLeft', textAnchor: 'end' },    // 左上
      { angle: 45, name: 'bottomRight', textAnchor: 'start' },// 右下
      { angle: 135, name: 'bottomLeft', textAnchor: 'end' },  // 左下
    ]

    // Check if a label position overlaps with any other circle
    const checkOverlap = (labelX: number, labelY: number): number => {
      let overlapScore = 0
      const labelWidth = (circle.label?.length || 1) * LABEL_FONT_SIZE * 0.6
      const labelHeight = LABEL_FONT_SIZE

      for (const other of allCircles) {
        if (other.id === circle.id) continue
        
        // Distance from label center to other circle center
        const dx = labelX - other.position.x
        const dy = labelY - other.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // If label is inside another circle, add to overlap score
        if (dist < other.radius + Math.max(labelWidth, labelHeight) / 2) {
          overlapScore += (other.radius + Math.max(labelWidth, labelHeight) / 2 - dist)
        }
      }
      return overlapScore
    }

    let bestCandidate = candidates[0]
    let bestScore = Infinity

    for (const candidate of candidates) {
      const angleRad = (candidate.angle * Math.PI) / 180
      const labelX = circle.position.x + Math.cos(angleRad) * (circle.radius + LABEL_OFFSET)
      const labelY = circle.position.y + Math.sin(angleRad) * (circle.radius + LABEL_OFFSET)
      
      const score = checkOverlap(labelX, labelY)
      if (score < bestScore) {
        bestScore = score
        bestCandidate = candidate
      }
    }

    const angleRad = (bestCandidate.angle * Math.PI) / 180
    return {
      x: circle.position.x + Math.cos(angleRad) * (circle.radius + LABEL_OFFSET),
      y: circle.position.y + Math.sin(angleRad) * (circle.radius + LABEL_OFFSET),
      textAnchor: bestCandidate.textAnchor
    }
  }

  // Calculate bounding box of all circles and elements (including labels outside)
  const calculateBoundingBox = () => {
    if (circles.length === 0 && elements.length === 0) {
      return { minX: 0, minY: 0, maxX: canvasSize.width, maxY: canvasSize.height }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    circles.forEach(circle => {
      const left = circle.position.x - circle.radius
      const right = circle.position.x + circle.radius
      const top = circle.position.y - circle.radius
      const bottom = circle.position.y + circle.radius

      minX = Math.min(minX, left)
      minY = Math.min(minY, top)
      maxX = Math.max(maxX, right)
      maxY = Math.max(maxY, bottom)

      // Include label position in bounding box
      if (circle.label) {
        const labelPos = getLabelPosition(circle, circles)
        const labelWidth = circle.label.length * LABEL_FONT_SIZE * 0.6
        minX = Math.min(minX, labelPos.x - labelWidth / 2)
        maxX = Math.max(maxX, labelPos.x + labelWidth / 2)
        minY = Math.min(minY, labelPos.y - LABEL_FONT_SIZE / 2)
        maxY = Math.max(maxY, labelPos.y + LABEL_FONT_SIZE / 2)
      }
    })

    elements.forEach(element => {
      const left = element.position.x - ELEMENT_DOT_RADIUS
      const right = element.position.x + ELEMENT_DOT_RADIUS + (element.shape === 'label' ? 50 : 0) // ラベル分の余白
      const top = element.position.y - ELEMENT_DOT_RADIUS
      const bottom = element.position.y + ELEMENT_DOT_RADIUS

      minX = Math.min(minX, left)
      minY = Math.min(minY, top)
      maxX = Math.max(maxX, right)
      maxY = Math.max(maxY, bottom)
    })

    // Add padding around the content
    const padding = 20
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    }
  }

  // Render circles
  const renderCircles = () => {
    return circles.map(circle => {
      // Convert hex color to rgba for fill
      const fillColor = circle.color + Math.round(CIRCLE_FILL_OPACITY * 255).toString(16).padStart(2, '0')
      const labelPos = getLabelPosition(circle, circles)

      return (
        <g key={circle.id}>
          <circle
            cx={circle.position.x}
            cy={circle.position.y}
            r={circle.radius}
            fill={fillColor}
            stroke={circle.color}
            strokeWidth={CIRCLE_STROKE_WIDTH}
          />
          {circle.label && (
            <text
              x={labelPos.x}
              y={labelPos.y}
              fontSize={LABEL_FONT_SIZE}
              textAnchor={labelPos.textAnchor}
              dominantBaseline="middle"
              fill={circle.color}
              fontWeight="600"
            >
              {circle.label}
            </text>
          )}
        </g>
      )
    })
  }

  // Render elements
  const renderElements = () => {
    return elements.map(element => {
      const color = element.color || '#333333'

      return (
        <g key={element.id}>
          {/* Dot (for 'dot' and 'label' shapes) */}
          {(element.shape === 'dot' || element.shape === 'label') && (
            <circle
              cx={element.position.x}
              cy={element.position.y}
              r={ELEMENT_DOT_RADIUS}
              fill={color}
              stroke="white"
              strokeWidth={1}
            />
          )}

          {/* Label (for 'label' shape - dot + text) */}
          {element.shape === 'label' && element.label && (
            <text
              x={element.position.x + ELEMENT_DOT_RADIUS + 4}
              y={element.position.y}
              fontSize={ELEMENT_FONT_SIZE}
              textAnchor="start"
              dominantBaseline="middle"
              fill={color}
              fontWeight="500"
            >
              {element.label}
            </text>
          )}

          {/* Text only (for 'text' shape) */}
          {element.shape === 'text' && element.label && (
            <text
              x={element.position.x}
              y={element.position.y}
              fontSize={ELEMENT_FONT_SIZE}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontWeight="500"
            >
              {element.label}
            </text>
          )}
        </g>
      )
    })
  }

  // Calculate viewBox based on content or use fixed canvas size
  const bbox = fitToContent ? calculateBoundingBox() : { minX: 0, minY: 0, maxX: canvasSize.width, maxY: canvasSize.height }
  const viewBoxWidth = bbox.maxX - bbox.minX
  const viewBoxHeight = bbox.maxY - bbox.minY

  return (
    <svg
      width={viewBoxWidth}
      height={viewBoxHeight}
      viewBox={`${bbox.minX} ${bbox.minY} ${viewBoxWidth} ${viewBoxHeight}`}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      {renderCircles()}
      {renderElements()}
    </svg>
  )
}
