import { useState, useEffect, useRef, useCallback } from 'react'
import type { Item } from '../../types'
import { NEW_ITEM_ID } from '../../types'
import { useThemeContext } from '../../contexts/ThemeContext'
import { EulerIcon } from '../euler/EulerIcon'
import './Sidebar.css'

const MAIN_SLIDE_ITEM_ID = 'main-slide'
const TONMANA_ID = 'tonmana'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  itemId: string | null
}

interface SidebarProps {
  items: Item[]
  selectedItemId: string | null
  isTonmanaSelected: boolean
  projectName: string
  onProjectNameChange: (name: string) => void
  onSelectItem: (itemId: string | null) => void
  onSelectTonmana: () => void
  onDeleteItem?: (itemId: string) => void
  onRenameItem?: (itemId: string) => void
  onDuplicateItem?: (itemId: string) => void
  onShowHelp: () => void
}

export const Sidebar = ({
  items,
  selectedItemId,
  isTonmanaSelected,
  projectName,
  onProjectNameChange,
  onSelectItem,
  onSelectTonmana,
  onDeleteItem,
  onRenameItem,
  onDuplicateItem,
  onShowHelp,
}: SidebarProps) => {
  const { isDark, toggleTheme } = useThemeContext()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    itemId: null,
  })
  const contextMenuRef = useRef<HTMLDivElement>(null)
  
  // Project name editing state
  const [isEditingProjectName, setIsEditingProjectName] = useState(false)
  const [editingProjectNameValue, setEditingProjectNameValue] = useState(projectName)
  const projectNameInputRef = useRef<HTMLInputElement>(null)
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditingProjectName && projectNameInputRef.current) {
      projectNameInputRef.current.focus()
      projectNameInputRef.current.select()
    }
  }, [isEditingProjectName])
  
  // Handle project name double click to edit
  const handleProjectNameDoubleClick = useCallback(() => {
    setEditingProjectNameValue(projectName)
    setIsEditingProjectName(true)
  }, [projectName])
  
  // Handle project name save
  const handleProjectNameSave = useCallback(() => {
    const trimmed = editingProjectNameValue.trim()
    if (trimmed && trimmed !== projectName) {
      onProjectNameChange(trimmed)
    } else {
      setEditingProjectNameValue(projectName)
    }
    setIsEditingProjectName(false)
  }, [editingProjectNameValue, projectName, onProjectNameChange])
  
  // Handle project name key down
  const handleProjectNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleProjectNameSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditingProjectNameValue(projectName)
      setIsEditingProjectName(false)
    }
  }, [handleProjectNameSave, projectName])

  // Get item icon
  const getItemIcon = (type: Item['type']): string | null => {
    switch (type) {
      case 'slide':
        return 'description'
      case 'table':
        return 'table_chart'
      case 'image':
        return 'image'
      case 'text':
        return 'notes'
      case 'picto':
        return 'schema'
      case 'euler':
        return null // Custom icon
      case 'new':
        return 'add_circle_outline'
      default:
        return 'inventory_2'
    }
  }

  // Render item icon
  const renderItemIcon = (type: Item['type']) => {
    if (type === 'euler') {
      return <EulerIcon size={18} />
    }
    return <span className="material-icons">{getItemIcon(type)}</span>
  }

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't show context menu for main slide or new item
    if (itemId === MAIN_SLIDE_ITEM_ID || itemId === NEW_ITEM_ID) {
      return
    }
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId,
    })
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.visible])

  // Close context menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [contextMenu.visible])

  // Handle delete
  const handleDelete = useCallback((itemId: string) => {
    if (onDeleteItem) {
      if (confirm('このアイテムを削除しますか？')) {
        onDeleteItem(itemId)
      }
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [onDeleteItem])

  // Handle rename
  const handleRename = useCallback((itemId: string) => {
    if (onRenameItem) {
      onRenameItem(itemId)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [onRenameItem])

  // Handle duplicate
  const handleDuplicate = useCallback((itemId: string) => {
    if (onDuplicateItem) {
      onDuplicateItem(itemId)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [onDuplicateItem])

  // Separate items
  const mainSlideItem = items.find(item => item.id === MAIN_SLIDE_ITEM_ID)
  const newItem = items.find(item => item.id === NEW_ITEM_ID)
  const otherItems = items.filter(item => item.id !== MAIN_SLIDE_ITEM_ID && item.id !== NEW_ITEM_ID)

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">M</div>
        <span className="sidebar-logo-text">MARK</span>
      </div>
      
      {/* Project Name */}
      <div className="sidebar-project-name">
        {isEditingProjectName ? (
          <input
            ref={projectNameInputRef}
            type="text"
            className="sidebar-project-name-input"
            value={editingProjectNameValue}
            onChange={(e) => setEditingProjectNameValue(e.target.value)}
            onKeyDown={handleProjectNameKeyDown}
            onBlur={handleProjectNameSave}
          />
        ) : (
          <span
            className="sidebar-project-name-text"
            onDoubleClick={handleProjectNameDoubleClick}
            title="ダブルクリックで編集"
          >
            {projectName}
          </span>
        )}
      </div>
      
      <div className="sidebar-divider" />

      {/* Main Section */}
      <div className="sidebar-section sidebar-section-main">
        {/* Base Category */}
        <div className="sidebar-category-label">
          <span className="sidebar-category-text">Base</span>
        </div>

        {/* Document (Main Slides) */}
        {mainSlideItem && (
          <button
            className={`sidebar-item ${selectedItemId === MAIN_SLIDE_ITEM_ID && !isTonmanaSelected ? 'active' : ''}`}
            onClick={() => onSelectItem(MAIN_SLIDE_ITEM_ID)}
          >
            <div className="sidebar-item-icon">
              {renderItemIcon(mainSlideItem.type)}
            </div>
            <span className="sidebar-item-label">ドキュメント</span>
          </button>
        )}

        {/* Tone & Manner */}
        <button
          className={`sidebar-item ${isTonmanaSelected ? 'active' : ''}`}
          onClick={onSelectTonmana}
        >
          <div className="sidebar-item-icon">
            <span className="material-icons">palette</span>
          </div>
          <span className="sidebar-item-label">Tone & Manner</span>
        </button>

        {/* Components Category */}
        <div className="sidebar-category-label">
          <span className="sidebar-category-text">Components</span>
        </div>

        {/* Other Items (Components) */}
        {otherItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${selectedItemId === item.id && !isTonmanaSelected ? 'active' : ''}`}
            onClick={() => onSelectItem(item.id)}
            onContextMenu={(e) => handleContextMenu(e, item.id)}
          >
            <div className="sidebar-item-icon">
              {renderItemIcon(item.type)}
            </div>
            <span className="sidebar-item-label">{item.name}</span>
            {onDeleteItem && (
              <button
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(item.id)
                }}
                title="削除"
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </button>
        ))}

        {/* New Component */}
        {newItem && (
          <button
            className={`sidebar-item new-item ${selectedItemId === NEW_ITEM_ID ? 'active' : ''}`}
            onClick={() => onSelectItem(NEW_ITEM_ID)}
          >
            <div className="sidebar-item-icon">
              <span className="material-icons">add_circle_outline</span>
            </div>
            <span className="sidebar-item-label">新規コンポーネント</span>
          </button>
        )}
      </div>

      {/* Bottom Section */}
      <div className="sidebar-section sidebar-section-bottom">
        {/* Theme Toggle */}
        <button
          className="sidebar-item"
          onClick={toggleTheme}
          title={isDark ? 'ライトモード' : 'ダークモード'}
        >
          <div className="sidebar-item-icon">
            <span className="material-icons">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </div>
          <span className="sidebar-item-label">
            {isDark ? 'ライトモード' : 'ダークモード'}
          </span>
        </button>

        {/* Help */}
        <button
          className="sidebar-item"
          onClick={onShowHelp}
          title="使い方"
        >
          <div className="sidebar-item-icon">
            <span className="material-icons">help_outline</span>
          </div>
          <span className="sidebar-item-label">使い方</span>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.itemId && (
        <div
          ref={contextMenuRef}
          className="sidebar-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {onRenameItem && (
            <button
              className="sidebar-context-menu-item"
              onClick={() => handleRename(contextMenu.itemId!)}
            >
              <span className="material-icons">edit</span>
              名前を変更
            </button>
          )}
          {onDuplicateItem && (
            <button
              className="sidebar-context-menu-item"
              onClick={() => handleDuplicate(contextMenu.itemId!)}
            >
              <span className="material-icons">content_copy</span>
              複製
            </button>
          )}
          {onDeleteItem && (
            <button
              className="sidebar-context-menu-item danger"
              onClick={() => handleDelete(contextMenu.itemId!)}
            >
              <span className="material-icons">delete</span>
              削除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

