/**
 * TreeNodeRow - 個別ノード行コンポーネント
 * 
 * 展開/折りたたみ、インライン編集、追加・削除操作を提供
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { TreeNode, TreeNodeType } from '../../types'

interface TreeNodeRowProps {
  node: TreeNode
  depth: number
  calculatedValue: number
  onUpdate: (id: string, updates: Partial<TreeNode>) => void
  onAddChild: (parentId: string) => void
  onAddSibling: (nodeId: string) => void
  onDelete: (id: string) => void
  onToggleExpand: (id: string) => void
  colors: {
    income: string
    expense: string
    neutral: string
  }
}

export const TreeNodeRow = ({
  node,
  depth,
  calculatedValue,
  onUpdate,
  onAddChild,
  onAddSibling,
  onDelete,
  onToggleExpand,
  colors,
}: TreeNodeRowProps) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingValue, setIsEditingValue] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [editValue, setEditValue] = useState(node.value?.toString() || '')
  const [isHovered, setIsHovered] = useState(false)
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  
  const hasChildren = node.children.length > 0
  const isLeaf = !hasChildren
  
  // Get color based on node type
  const getNodeColor = (type: TreeNodeType): string => {
    switch (type) {
      case 'income':
        return colors.income
      case 'expense':
        return colors.expense
      default:
        return colors.neutral
    }
  }
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])
  
  useEffect(() => {
    if (isEditingValue && valueInputRef.current) {
      valueInputRef.current.focus()
      valueInputRef.current.select()
    }
  }, [isEditingValue])
  
  // Handle name editing
  const handleNameDoubleClick = useCallback(() => {
    setEditName(node.name)
    setIsEditingName(true)
  }, [node.name])
  
  const handleNameBlur = useCallback(() => {
    setIsEditingName(false)
    if (editName !== node.name) {
      onUpdate(node.id, { name: editName })
    }
  }, [editName, node.id, node.name, onUpdate])
  
  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur()
      // After saving name, focus on value if leaf
      if (isLeaf) {
        setTimeout(() => {
          setEditValue(node.value?.toString() || '')
          setIsEditingValue(true)
        }, 50)
      }
    } else if (e.key === 'Escape') {
      setEditName(node.name)
      setIsEditingName(false)
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      handleNameBlur()
      if (isLeaf) {
        setTimeout(() => {
          setEditValue(node.value?.toString() || '')
          setIsEditingValue(true)
        }, 50)
      }
    }
  }, [handleNameBlur, isLeaf, node.name, node.value])
  
  // Handle value editing
  const handleValueDoubleClick = useCallback(() => {
    if (isLeaf) {
      setEditValue(node.value?.toString() || '')
      setIsEditingValue(true)
    }
  }, [isLeaf, node.value])
  
  const handleValueBlur = useCallback(() => {
    setIsEditingValue(false)
    const numValue = parseFloat(editValue)
    const newValue = isNaN(numValue) ? null : numValue
    if (newValue !== node.value) {
      onUpdate(node.id, { value: newValue })
    }
  }, [editValue, node.id, node.value, onUpdate])
  
  const handleValueKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValueBlur()
      // Add sibling on Enter after value
      onAddSibling(node.id)
    } else if (e.key === 'Escape') {
      setEditValue(node.value?.toString() || '')
      setIsEditingValue(false)
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      handleValueBlur()
      // Tab after value adds child
      onAddChild(node.id)
    }
  }, [handleValueBlur, node.id, node.value, onAddChild, onAddSibling])
  
  // Format display value
  const formatValue = (value: number): string => {
    return value.toLocaleString('ja-JP')
  }
  
  const nodeColor = getNodeColor(node.nodeType)
  const indentPx = depth * 20
  
  return (
    <div
      className="tree-node-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: indentPx,
        paddingRight: 8,
        height: 36,
        borderBottom: '1px solid var(--app-border-light)',
        backgroundColor: isHovered ? 'var(--app-bg-hover)' : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expand/Collapse Button */}
      <button
        className="tree-expand-btn"
        onClick={() => onToggleExpand(node.id)}
        style={{
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: hasChildren ? 'pointer' : 'default',
          opacity: hasChildren ? 1 : 0,
          color: 'var(--app-text-secondary)',
          fontSize: 12,
        }}
        disabled={!hasChildren}
        type="button"
        aria-label={node.expanded ? '折りたたむ' : '展開する'}
      >
        <span className="material-icons" style={{ fontSize: 16 }}>
          {node.expanded ? 'expand_more' : 'chevron_right'}
        </span>
      </button>
      
      {/* Color Indicator */}
      <div
        className="tree-node-indicator"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: nodeColor,
          marginRight: 8,
          flexShrink: 0,
        }}
      />
      
      {/* Name */}
      <div
        className="tree-node-name"
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'var(--app-bg-input)',
              padding: '2px 4px',
              fontSize: 13,
              borderRadius: 2,
              color: 'var(--app-text-primary)',
            }}
          />
        ) : (
          <span
            onDoubleClick={handleNameDoubleClick}
            style={{
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 13,
              color: 'var(--app-text-primary)',
              cursor: 'text',
            }}
          >
            {node.name || '(名称未設定)'}
          </span>
        )}
      </div>
      
      {/* Dash separator */}
      <span
        style={{
          color: 'var(--app-text-disabled)',
          margin: '0 8px',
          flexShrink: 0,
        }}
      >
        ─
      </span>
      
      {/* Value */}
      <div
        className="tree-node-value"
        style={{
          width: 80,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {isLeaf && isEditingValue ? (
          <input
            ref={valueInputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleValueBlur}
            onKeyDown={handleValueKeyDown}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'var(--app-bg-input)',
              padding: '2px 4px',
              fontSize: 13,
              borderRadius: 2,
              textAlign: 'right',
              color: 'var(--app-text-primary)',
            }}
          />
        ) : (
          <span
            onDoubleClick={handleValueDoubleClick}
            style={{
              fontSize: 13,
              color: isLeaf ? 'var(--app-text-primary)' : 'var(--app-text-disabled)',
              cursor: isLeaf ? 'text' : 'default',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatValue(calculatedValue)}
          </span>
        )}
      </div>
      
      {/* Action buttons (visible on hover) */}
      <div
        className="tree-node-actions"
        style={{
          display: 'flex',
          gap: 2,
          marginLeft: 8,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      >
        <button
          type="button"
          onClick={() => onAddChild(node.id)}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--app-text-secondary)',
            borderRadius: 2,
          }}
          title="子ノードを追加"
          aria-label="子ノードを追加"
        >
          <span className="material-icons" style={{ fontSize: 16 }}>add</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          style={{
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--app-text-secondary)',
            borderRadius: 2,
          }}
          title="削除"
          aria-label="削除"
        >
          <span className="material-icons" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>
    </div>
  )
}

