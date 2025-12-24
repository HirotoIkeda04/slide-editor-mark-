import { useState, useCallback } from 'react'
import type { EulerItem, EulerCircle, EulerElement } from '../../types'
import { DEFAULT_CIRCLE_RADIUS, EULER_COLOR_PALETTE } from '../../constants/eulerConfigs'
import { EulerCanvas } from './EulerCanvas'
import { EulerPropertiesPanel } from './EulerPropertiesPanel'
import { FloatingNavBar } from '../floatingNavBar/FloatingNavBar'
import './EulerEditor.css'

interface EulerEditorProps {
  item: EulerItem
  onUpdateItem: (updates: Partial<EulerItem>) => void
}

// Generate unique ID
const generateId = (): string => {
  return `euler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export type EditorMode = 'select' | 'addCircle' | 'addElement'
export type SelectionType = 'circle' | 'element' | null

export function EulerEditor({ item, onUpdateItem }: EulerEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectionType, setSelectionType] = useState<SelectionType>(null)
  const [mode, setMode] = useState<EditorMode>('select')

  // Get selected circle or element
  const selectedCircle = selectionType === 'circle' && selectedId
    ? item.circles.find(c => c.id === selectedId) || null
    : null
  
  const selectedElement = selectionType === 'element' && selectedId
    ? (item.elements || []).find(e => e.id === selectedId) || null
    : null

  // Select circle
  const handleSelectCircle = useCallback((circleId: string) => {
    setSelectedId(circleId)
    setSelectionType('circle')
  }, [])

  // Select element
  const handleSelectElement = useCallback((elementId: string) => {
    setSelectedId(elementId)
    setSelectionType('element')
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedId(null)
    setSelectionType(null)
  }, [])

  // Add circle at position
  const handleAddCircle = useCallback((x: number, y: number) => {
    const colorIndex = item.circles.length % EULER_COLOR_PALETTE.length
    const newCircle: EulerCircle = {
      id: generateId(),
      label: `集合 ${item.circles.length + 1}`,
      position: { x, y },
      radius: DEFAULT_CIRCLE_RADIUS,
      color: EULER_COLOR_PALETTE[colorIndex]
    }
    onUpdateItem({
      circles: [...item.circles, newCircle]
    })
    handleSelectCircle(newCircle.id)
    setMode('select')
  }, [item.circles, onUpdateItem, handleSelectCircle])

  // Add circle from toolbar
  const handleAddCircleFromToolbar = useCallback(() => {
    const centerX = item.canvasSize.width / 2
    const centerY = item.canvasSize.height / 2
    const offset = item.circles.length * 30
    handleAddCircle(centerX + offset, centerY + offset)
  }, [item.canvasSize, item.circles.length, handleAddCircle])

  // Add element at position
  const handleAddElement = useCallback((x: number, y: number) => {
    const elements = item.elements || []
    const newElement: EulerElement = {
      id: generateId(),
      label: String.fromCharCode(97 + elements.length % 26), // a, b, c, ...
      position: { x, y },
      shape: 'label',
      color: '#333333'
    }
    onUpdateItem({
      elements: [...elements, newElement]
    })
    handleSelectElement(newElement.id)
    setMode('select')
  }, [item.elements, onUpdateItem, handleSelectElement])

  // Add element from toolbar
  const handleAddElementFromToolbar = useCallback(() => {
    const centerX = item.canvasSize.width / 2
    const centerY = item.canvasSize.height / 2
    const elements = item.elements || []
    const offset = elements.length * 20
    handleAddElement(centerX + offset, centerY + offset)
  }, [item.canvasSize, item.elements, handleAddElement])

  // Update circle
  const handleUpdateCircle = useCallback((circleId: string, updates: Partial<EulerCircle>) => {
    onUpdateItem({
      circles: item.circles.map(c =>
        c.id === circleId ? { ...c, ...updates } : c
      )
    })
  }, [item.circles, onUpdateItem])

  // Update element
  const handleUpdateElement = useCallback((elementId: string, updates: Partial<EulerElement>) => {
    const elements = item.elements || []
    onUpdateItem({
      elements: elements.map(e =>
        e.id === elementId ? { ...e, ...updates } : e
      )
    })
  }, [item.elements, onUpdateItem])

  // Delete selected item
  const handleDelete = useCallback(() => {
    if (!selectedId) return
    
    if (selectionType === 'circle') {
      onUpdateItem({
        circles: item.circles.filter(c => c.id !== selectedId)
      })
    } else if (selectionType === 'element') {
      const elements = item.elements || []
      onUpdateItem({
        elements: elements.filter(e => e.id !== selectedId)
      })
    }
    clearSelection()
  }, [selectedId, selectionType, item.circles, item.elements, onUpdateItem, clearSelection])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 入力フィールド内での編集中は削除ショートカットを無視
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      // Escapeキーのみ処理（選択解除）
      if (e.key === 'Escape') {
        target.blur()
        clearSelection()
        setMode('select')
      }
      return
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId) {
        e.preventDefault()
        handleDelete()
      }
    } else if (e.key === 'Escape') {
      clearSelection()
      setMode('select')
    }
  }, [selectedId, handleDelete, clearSelection])

  // Handle mode change from FloatingNavBar (compatibility with old 'add' mode)
  const handleModeChange = useCallback((newMode: 'select' | 'add') => {
    if (newMode === 'add') {
      setMode('addCircle')
    } else {
      setMode('select')
    }
  }, [])

  return (
    <div className="euler-editor" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="euler-editor-content">
        {/* Canvas */}
        <div className="euler-canvas-container">
          <EulerCanvas
            item={item}
            selectedCircleId={selectionType === 'circle' ? selectedId : null}
            selectedElementId={selectionType === 'element' ? selectedId : null}
            onSelectCircle={handleSelectCircle}
            onSelectElement={handleSelectElement}
            onClearSelection={clearSelection}
            onUpdateCircle={handleUpdateCircle}
            onUpdateElement={handleUpdateElement}
            onAddCircle={handleAddCircle}
            onAddElement={handleAddElement}
            mode={mode}
          />
        </div>

        {/* Properties Panel */}
        <EulerPropertiesPanel
          circle={selectedCircle}
          element={selectedElement}
          onUpdateCircle={(updates) => {
            if (selectedId && selectionType === 'circle') {
              handleUpdateCircle(selectedId, updates)
            }
          }}
          onUpdateElement={(updates) => {
            if (selectedId && selectionType === 'element') {
              handleUpdateElement(selectedId, updates)
            }
          }}
          onDelete={handleDelete}
        />
      </div>

      {/* Floating NavBar - 画面下部中央に固定 */}
      <div className="euler-navbar-wrapper">
        <FloatingNavBar
          itemType="euler"
          mode="euler"
          eulerEditorMode={mode === 'addCircle' || mode === 'addElement' ? 'add' : 'select'}
          onEulerModeChange={handleModeChange}
          onAddEulerCircle={handleAddCircleFromToolbar}
          onAddEulerElement={handleAddElementFromToolbar}
        />
      </div>
    </div>
  )
}
