import { useRef, useState, useCallback, useEffect } from 'react'
import type { EulerItem, EulerCircle, EulerElement } from '../../types'
import {
  CIRCLE_FILL_OPACITY,
  CIRCLE_STROKE_WIDTH,
  LABEL_FONT_SIZE,
  RESIZE_HANDLE_SIZE,
  MIN_CIRCLE_RADIUS,
  MAX_CIRCLE_RADIUS
} from '../../constants/eulerConfigs'
import type { EditorMode } from './EulerEditor'

interface EulerCanvasProps {
  item: EulerItem
  selectedCircleId: string | null
  selectedElementId: string | null
  onSelectCircle: (id: string) => void
  onSelectElement: (id: string) => void
  onClearSelection: () => void
  onUpdateCircle: (circleId: string, updates: Partial<EulerCircle>) => void
  onUpdateElement: (elementId: string, updates: Partial<EulerElement>) => void
  onAddCircle: (x: number, y: number) => void
  onAddElement: (x: number, y: number) => void
  mode: EditorMode
}

const ELEMENT_DOT_RADIUS = 6
const ELEMENT_FONT_SIZE = 14

export function EulerCanvas({
  item,
  selectedCircleId,
  selectedElementId,
  onSelectCircle,
  onSelectElement,
  onClearSelection,
  onUpdateCircle,
  onUpdateElement,
  onAddCircle,
  onAddElement,
  mode
}: EulerCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragType, setDragType] = useState<'circle' | 'element' | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [initialPosition, setInitialPosition] = useState<{ x: number; y: number } | null>(null)
  const [initialRadius, setInitialRadius] = useState<number | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Minimum distance between elements to avoid overlap
  const MIN_ELEMENT_DISTANCE = ELEMENT_DOT_RADIUS * 4

  // Check if a position overlaps with other elements
  const checkElementCollision = useCallback((
    pos: { x: number; y: number },
    elementId: string,
    elements: EulerElement[]
  ): boolean => {
    return elements.some(el => {
      if (el.id === elementId) return false
      const dx = pos.x - el.position.x
      const dy = pos.y - el.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      return dist < MIN_ELEMENT_DISTANCE
    })
  }, [MIN_ELEMENT_DISTANCE])

  // Find a non-overlapping position using spiral search
  const findNonOverlappingPosition = useCallback((
    pos: { x: number; y: number },
    elementId: string,
    elements: EulerElement[]
  ): { x: number; y: number } => {
    if (!checkElementCollision(pos, elementId, elements)) {
      return pos
    }

    // Spiral search for free position
    const step = MIN_ELEMENT_DISTANCE / 2
    let angle = 0
    let radius = step

    for (let i = 0; i < 50; i++) {
      const testX = pos.x + Math.cos(angle) * radius
      const testY = pos.y + Math.sin(angle) * radius

      if (!checkElementCollision({ x: testX, y: testY }, elementId, elements)) {
        return { x: testX, y: testY }
      }

      angle += Math.PI / 4 // 45 degree increments
      if (angle >= Math.PI * 2) {
        angle = 0
        radius += step
      }
    }

    // If no free position found, return original
    return pos
  }, [checkElementCollision, MIN_ELEMENT_DISTANCE])

  // Get mouse position relative to SVG
  const getMousePosition = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = item.canvasSize.width / rect.width
    const scaleY = item.canvasSize.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }, [item.canvasSize])

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      if (mode === 'addCircle') {
        const pos = getMousePosition(e)
        onAddCircle(pos.x, pos.y)
      } else if (mode === 'addElement') {
        const pos = getMousePosition(e)
        // Find non-overlapping position for new element
        const elements = item.elements || []
        const adjustedPos = findNonOverlappingPosition(pos, '', elements)
        onAddElement(adjustedPos.x, adjustedPos.y)
      } else {
        onClearSelection()
      }
    }
  }, [mode, getMousePosition, onAddCircle, onAddElement, onClearSelection, item.elements, findNonOverlappingPosition])

  // Handle circle mouse down
  const handleCircleMouseDown = useCallback((e: React.MouseEvent, circleId: string) => {
    e.stopPropagation()
    onSelectCircle(circleId)

    const circle = item.circles.find(c => c.id === circleId)
    if (!circle) return

    const pos = getMousePosition(e)
    setDragStart(pos)
    setInitialPosition({ x: circle.position.x, y: circle.position.y })
    setDraggedId(circleId)
    setDragType('circle')
    setIsDragging(true)
  }, [item.circles, getMousePosition, onSelectCircle, onSelectElement])

  // Handle element mouse down
  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    onSelectElement(elementId)

    const elements = item.elements || []
    const element = elements.find(el => el.id === elementId)
    if (!element) return

    const pos = getMousePosition(e)
    setDragStart(pos)
    setInitialPosition({ x: element.position.x, y: element.position.y })
    setDraggedId(elementId)
    setDragType('element')
    setIsDragging(true)
  }, [item.elements, getMousePosition, onSelectCircle, onSelectElement])

  // Handle resize handle mouse down
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, circleId: string) => {
    e.stopPropagation()
    const circle = item.circles.find(c => c.id === circleId)
    if (!circle) return

    const pos = getMousePosition(e)
    setDragStart(pos)
    setInitialRadius(circle.radius)
    setInitialPosition({ x: circle.position.x, y: circle.position.y })
    setDraggedId(circleId)
    setDragType('circle')
    setIsResizing(true)
  }, [item.circles, getMousePosition])

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart || !draggedId) return

      const pos = getMousePosition(e)
      const dx = pos.x - dragStart.x
      const dy = pos.y - dragStart.y

      if (isDragging && initialPosition) {
        const newX = initialPosition.x + dx
        const newY = initialPosition.y + dy

        if (dragType === 'circle') {
          onUpdateCircle(draggedId, {
            position: { x: newX, y: newY }
          })
        } else if (dragType === 'element') {
          onUpdateElement(draggedId, {
            position: { x: newX, y: newY }
          })
        }
      } else if (isResizing && initialRadius && initialPosition && dragType === 'circle') {
        // Calculate distance from center
        const distX = pos.x - initialPosition.x
        const distY = pos.y - initialPosition.y
        const newRadius = Math.sqrt(distX * distX + distY * distY)
        const clampedRadius = Math.max(MIN_CIRCLE_RADIUS, Math.min(MAX_CIRCLE_RADIUS, newRadius))
        onUpdateCircle(draggedId, { radius: clampedRadius })
      }
    }

    const handleMouseUp = () => {
      // Apply collision avoidance for elements on drop
      if (isDragging && dragType === 'element' && draggedId) {
        const elements = item.elements || []
        const element = elements.find(el => el.id === draggedId)
        if (element) {
          const newPos = findNonOverlappingPosition(element.position, draggedId, elements)
          if (newPos.x !== element.position.x || newPos.y !== element.position.y) {
            onUpdateElement(draggedId, { position: newPos })
          }
        }
      }

      setIsDragging(false)
      setIsResizing(false)
      setDragStart(null)
      setInitialPosition(null)
      setInitialRadius(null)
      setDraggedId(null)
      setDragType(null)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, initialPosition, initialRadius, draggedId, dragType, getMousePosition, onUpdateCircle, onUpdateElement, item.elements, findNonOverlappingPosition])

  // Calculate label position outside the circle, avoiding overlap with other circles
  const getLabelPosition = useCallback((circle: EulerCircle, allCircles: EulerCircle[]): { x: number; y: number; textAnchor: string } => {
    const labelOffset = 20 // Distance from circle edge
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
      const labelX = circle.position.x + Math.cos(angleRad) * (circle.radius + labelOffset)
      const labelY = circle.position.y + Math.sin(angleRad) * (circle.radius + labelOffset)
      
      const score = checkOverlap(labelX, labelY)
      if (score < bestScore) {
        bestScore = score
        bestCandidate = candidate
      }
    }

    const angleRad = (bestCandidate.angle * Math.PI) / 180
    return {
      x: circle.position.x + Math.cos(angleRad) * (circle.radius + labelOffset),
      y: circle.position.y + Math.sin(angleRad) * (circle.radius + labelOffset),
      textAnchor: bestCandidate.textAnchor
    }
  }, [])

  // Render circles
  const renderCircles = () => {
    return item.circles.map(circle => {
      const isSelected = circle.id === selectedCircleId
      const fillColor = circle.color + Math.round(CIRCLE_FILL_OPACITY * 255).toString(16).padStart(2, '0')
      const labelPos = getLabelPosition(circle, item.circles)

      return (
        <g key={circle.id}>
          {/* Circle */}
          <circle
            cx={circle.position.x}
            cy={circle.position.y}
            r={circle.radius}
            fill={fillColor}
            stroke={isSelected ? '#1976D2' : circle.color}
            strokeWidth={isSelected ? CIRCLE_STROKE_WIDTH + 1 : CIRCLE_STROKE_WIDTH}
            style={{ cursor: mode === 'select' ? 'move' : 'default' }}
            onMouseDown={(e) => handleCircleMouseDown(e, circle.id)}
          />

          {/* Label - outside the circle with circle color */}
          {circle.label && (
            <text
              x={labelPos.x}
              y={labelPos.y}
              fontSize={LABEL_FONT_SIZE}
              textAnchor={labelPos.textAnchor}
              dominantBaseline="middle"
              fill={circle.color}
              fontWeight="600"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {circle.label}
            </text>
          )}

          {/* Resize handle */}
          {isSelected && (
            <circle
              cx={circle.position.x + circle.radius}
              cy={circle.position.y}
              r={RESIZE_HANDLE_SIZE}
              fill="#1976D2"
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'ew-resize' }}
              onMouseDown={(e) => handleResizeMouseDown(e, circle.id)}
            />
          )}
        </g>
      )
    })
  }

  // Render elements
  const renderElements = () => {
    const elements = item.elements || []
    return elements.map(element => {
      const isSelected = element.id === selectedElementId
      const color = element.color || '#333333'

      return (
        <g key={element.id} style={{ cursor: mode === 'select' ? 'pointer' : 'default' }}>
          {/* Clickable area (larger for easier selection) */}
          <circle
            cx={element.position.x}
            cy={element.position.y}
            r={element.shape === 'text' ? ELEMENT_FONT_SIZE : ELEMENT_DOT_RADIUS + 10}
            fill="rgba(0,0,0,0)"
            style={{ pointerEvents: 'all' }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          />

          {/* Dot (for 'dot' and 'label' shapes) */}
          {(element.shape === 'dot' || element.shape === 'label') && (
            <circle
              cx={element.position.x}
              cy={element.position.y}
              r={ELEMENT_DOT_RADIUS}
              fill={color}
              stroke={isSelected ? '#1976D2' : 'white'}
              strokeWidth={isSelected ? 2 : 1}
              style={{ pointerEvents: 'none' }}
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
              style={{ pointerEvents: 'none', userSelect: 'none' }}
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
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {element.label}
            </text>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <circle
              cx={element.position.x}
              cy={element.position.y}
              r={ELEMENT_DOT_RADIUS + 4}
              fill="none"
              stroke="#1976D2"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}
        </g>
      )
    })
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${item.canvasSize.width} ${item.canvasSize.height}`}
      style={{
        display: 'block',
        backgroundColor: '#fafafa',
        cursor: mode === 'addCircle' || mode === 'addElement' ? 'crosshair' : 'default'
      }}
      preserveAspectRatio="xMidYMid meet"
      onClick={handleCanvasClick}
    >
      {renderCircles()}
      {renderElements()}
    </svg>
  )
}
