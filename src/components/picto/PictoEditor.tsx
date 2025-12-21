import { useState, useCallback, useRef } from 'react'
import type { PictoItem, PictoElement, PictoConnector, PictoElementType, PictoFlowType } from '../../types'
import { PICTO_ELEMENT_CONFIGS, GRID_SIZE } from '../../constants/pictoConfigs'
import { PictoCanvas } from './PictoCanvas'
import { PictoPropertiesPanel } from './PictoPropertiesPanel'
import { FloatingNavBar, type PictogramEditorMode } from '../floatingNavBar/FloatingNavBar'
import './PictoEditor.css'

interface PictoEditorProps {
  item: PictoItem
  onUpdateItem: (updates: Partial<PictoItem>) => void
}

// Generate unique ID
const generateId = (): string => {
  return `picto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Snap position to grid
const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function PictoEditor({ item, onUpdateItem }: PictoEditorProps) {
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([])
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null)
  const [mode, setMode] = useState<PictogramEditorMode>('select')
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<{ type: PictoElementType; x: number; y: number } | null>(null)
  const [showProperties, setShowProperties] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Add element at position
  const handleAddElementAt = useCallback((type: PictoElementType, x: number, y: number) => {
    const config = PICTO_ELEMENT_CONFIGS[type]
    const newElement: PictoElement = {
      id: generateId(),
      type,
      label: config.nameJa,
      position: { x: snapToGrid(x), y: snapToGrid(y) },
      size: config.defaultSize
    }
    onUpdateItem({
      elements: [...item.elements, newElement]
    })
    setSelectedElementIds([newElement.id])
  }, [item.elements, onUpdateItem])

  // Add element from toolbar (centered in visible area)
  const handleAddElementFromToolbar = useCallback((type: PictoElementType) => {
    const config = PICTO_ELEMENT_CONFIGS[type]
    // Calculate center position in the canvas
    const centerX = Math.max(100, (item.canvasSize.width / 2) - (config.defaultSize.width / 2))
    const centerY = Math.max(100, (item.canvasSize.height / 2) - (config.defaultSize.height / 2))
    
    // Offset if elements already exist at center
    const offset = item.elements.length * 20
    handleAddElementAt(type, centerX + offset, centerY + offset)
  }, [item.elements, item.canvasSize, handleAddElementAt])

  // Update element
  const handleUpdateElement = useCallback((elementId: string, updates: Partial<PictoElement>) => {
    onUpdateItem({
      elements: item.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    })
  }, [item.elements, onUpdateItem])

  // Delete selected elements
  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length > 0) {
      // Delete elements and their connected connectors
      const newElements = item.elements.filter(el => !selectedElementIds.includes(el.id))
      const newConnectors = item.connectors.filter(
        conn => !selectedElementIds.includes(conn.fromElementId) && !selectedElementIds.includes(conn.toElementId)
      )
      // Also update groups
      const newGroups = item.groups.map(group => ({
        ...group,
        elementIds: group.elementIds.filter(id => !selectedElementIds.includes(id))
      })).filter(group => group.elementIds.length > 0)
      
      onUpdateItem({
        elements: newElements,
        connectors: newConnectors,
        groups: newGroups
      })
      setSelectedElementIds([])
    } else if (selectedConnectorId) {
      onUpdateItem({
        connectors: item.connectors.filter(conn => conn.id !== selectedConnectorId)
      })
      setSelectedConnectorId(null)
    }
  }, [selectedElementIds, selectedConnectorId, item, onUpdateItem])

  // Add connector
  const handleAddConnector = useCallback((fromId: string, toId: string, flowType: PictoFlowType) => {
    // Check if connector already exists
    const exists = item.connectors.some(
      conn => conn.fromElementId === fromId && conn.toElementId === toId
    )
    if (exists || fromId === toId) return

    const newConnector: PictoConnector = {
      id: generateId(),
      fromElementId: fromId,
      toElementId: toId,
      flowType,
      direction: 'forward'
    }
    onUpdateItem({
      connectors: [...item.connectors, newConnector]
    })
  }, [item.connectors, onUpdateItem])

  // Update connector
  const handleUpdateConnector = useCallback((connectorId: string, updates: Partial<PictoConnector>) => {
    onUpdateItem({
      connectors: item.connectors.map(conn =>
        conn.id === connectorId ? { ...conn, ...updates } : conn
      )
    })
  }, [item.connectors, onUpdateItem])

  // Handle element selection
  const handleElementClick = useCallback((elementId: string, shiftKey: boolean) => {
    if (mode === 'connect') {
      if (connectingFrom === null) {
        setConnectingFrom(elementId)
      } else {
        // Show flow type selector or use default
        handleAddConnector(connectingFrom, elementId, 'product')
        setConnectingFrom(null)
      }
    } else {
      if (shiftKey) {
        setSelectedElementIds(prev =>
          prev.includes(elementId)
            ? prev.filter(id => id !== elementId)
            : [...prev, elementId]
        )
      } else {
        setSelectedElementIds([elementId])
      }
      setSelectedConnectorId(null)
      setShowProperties(true)
    }
  }, [mode, connectingFrom, handleAddConnector])

  // Handle connector selection
  const handleConnectorClick = useCallback((connectorId: string) => {
    setSelectedConnectorId(connectorId)
    setSelectedElementIds([])
    setShowProperties(true)
  }, [])

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(() => {
    setSelectedElementIds([])
    setSelectedConnectorId(null)
    setConnectingFrom(null)
  }, [])

  // Handle marquee selection
  const handleMarqueeSelect = useCallback((elementIds: string[]) => {
    setSelectedElementIds(elementIds)
    setSelectedConnectorId(null)
    if (elementIds.length === 1) {
      setShowProperties(true)
    }
  }, [])

  // Handle element move
  const handleElementMove = useCallback((elementId: string, x: number, y: number) => {
    handleUpdateElement(elementId, {
      position: { x: snapToGrid(x), y: snapToGrid(y) }
    })
  }, [handleUpdateElement])

  // Handle drop from palette
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('picto-element-type') as PictoElementType
    if (type && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      handleAddElementAt(type, x, y)
    }
    setDragPreview(null)
  }, [handleAddElementAt])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('picto-element-type') as PictoElementType
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setDragPreview({
        type: type || 'other',
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragPreview(null)
  }, [])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDeleteSelected()
    } else if (e.key === 'Escape') {
      setSelectedElementIds([])
      setSelectedConnectorId(null)
      setConnectingFrom(null)
      setMode('select')
    }
  }, [handleDeleteSelected])

  // Group selected elements
  const handleGroupSelected = useCallback(() => {
    if (selectedElementIds.length < 2) return
    
    const newGroup = {
      id: generateId(),
      elementIds: [...selectedElementIds],
      label: '',
      color: '#E91E63',
      style: 'solid' as const
    }
    onUpdateItem({
      groups: [...item.groups, newGroup]
    })
  }, [selectedElementIds, item.groups, onUpdateItem])

  // Get selected element/connector for properties panel
  const selectedElement = selectedElementIds.length === 1
    ? item.elements.find(el => el.id === selectedElementIds[0])
    : null
  const selectedConnector = selectedConnectorId
    ? item.connectors.find(conn => conn.id === selectedConnectorId)
    : null

  // Pictogram操作ハンドラ
  const handlePictogramOperation = (operation: string, ...args: unknown[]) => {
    switch (operation) {
      case 'setMode':
        setMode(args[0] as PictogramEditorMode)
        break
      case 'delete':
        handleDeleteSelected()
        break
      case 'group':
        handleGroupSelected()
        break
    }
  }

  // Render the editor content
  const renderEditorContent = () => (
    <>
      <div className="picto-canvas-wrapper">
        <div
          ref={canvasRef}
          className="picto-canvas-container"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <PictoCanvas
            elements={item.elements}
            connectors={item.connectors}
            groups={item.groups}
            comments={item.comments}
            selectedElementIds={selectedElementIds}
            selectedConnectorId={selectedConnectorId}
            connectingFrom={connectingFrom}
            dragPreview={dragPreview}
            canvasSize={item.canvasSize}
            onElementClick={handleElementClick}
            onConnectorClick={handleConnectorClick}
            onCanvasClick={handleCanvasClick}
            onElementMove={handleElementMove}
            onMarqueeSelect={handleMarqueeSelect}
          />
        </div>
        
        {/* Properties Panel (Overlay) */}
        {showProperties && (selectedElement || selectedConnector) && (
          <PictoPropertiesPanel
            selectedElement={selectedElement}
            selectedConnector={selectedConnector}
            onUpdateElement={handleUpdateElement}
            onUpdateConnector={handleUpdateConnector}
            onClose={() => setShowProperties(false)}
          />
        )}
      </div>

      {/* FloatingNavBar - 下部に配置 */}
      <div
        className="picto-floating-navbar"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40
        }}
      >
        <FloatingNavBar
          itemType="pictogram"
          onPictogramOperation={handlePictogramOperation}
          pictogramState={{
            mode,
            canDelete: selectedElementIds.length > 0 || selectedConnectorId !== null,
            canGroup: selectedElementIds.length >= 2
          }}
          onAddPictogramElement={handleAddElementFromToolbar}
        />
      </div>
    </>
  )

  return (
    <div className="picto-editor" tabIndex={0} onKeyDown={handleKeyDown}>
      {renderEditorContent()}
    </div>
  )
}
