/**
 * TreeSection - 収入/支出セクションコンポーネント
 * 
 * ツリーの片側（収入側または支出側）を管理
 */

import { useCallback, useMemo } from 'react'
import type { TreeNode, TreeNodeType } from '../../types'
import { TreeNodeRow } from './TreeNodeRow'

interface TreeSectionProps {
  title: string
  rootNode: TreeNode
  nodeType: TreeNodeType
  onUpdateTree: (updatedRoot: TreeNode) => void
  colors: {
    income: string
    expense: string
    neutral: string
  }
}

// Helper function to calculate node value recursively
const calculateNodeValue = (node: TreeNode): number => {
  if (node.children.length === 0) {
    return node.value ?? 0
  }
  return node.children.reduce((sum, child) => sum + calculateNodeValue(child), 0)
}

// Helper function to find and update a node in the tree
const updateNodeInTree = (
  root: TreeNode,
  nodeId: string,
  updates: Partial<TreeNode>
): TreeNode => {
  if (root.id === nodeId) {
    return { ...root, ...updates }
  }
  return {
    ...root,
    children: root.children.map(child => updateNodeInTree(child, nodeId, updates)),
  }
}

// Helper function to add a child to a node
const addChildToNode = (
  root: TreeNode,
  parentId: string,
  newChild: TreeNode
): TreeNode => {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, newChild],
      expanded: true, // Auto-expand when adding child
    }
  }
  return {
    ...root,
    children: root.children.map(child => addChildToNode(child, parentId, newChild)),
  }
}

// Helper function to add a sibling after a node
const addSiblingAfterNode = (
  root: TreeNode,
  nodeId: string,
  newSibling: TreeNode
): TreeNode => {
  const newChildren: TreeNode[] = []
  for (const child of root.children) {
    newChildren.push(addSiblingAfterNode(child, nodeId, newSibling))
    if (child.id === nodeId) {
      newChildren.push(newSibling)
    }
  }
  return {
    ...root,
    children: newChildren,
  }
}

// Helper function to delete a node
const deleteNodeFromTree = (root: TreeNode, nodeId: string): TreeNode => {
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== nodeId)
      .map(child => deleteNodeFromTree(child, nodeId)),
  }
}

// Helper function to flatten tree for rendering
interface FlatNode {
  node: TreeNode
  depth: number
  calculatedValue: number
}

const flattenTree = (node: TreeNode, depth: number = 0): FlatNode[] => {
  const result: FlatNode[] = [{
    node,
    depth,
    calculatedValue: calculateNodeValue(node),
  }]
  
  if (node.expanded && node.children.length > 0) {
    for (const child of node.children) {
      result.push(...flattenTree(child, depth + 1))
    }
  }
  
  return result
}

export const TreeSection = ({
  title,
  rootNode,
  nodeType,
  onUpdateTree,
  colors,
}: TreeSectionProps) => {
  // Calculate total value
  const totalValue = useMemo(() => calculateNodeValue(rootNode), [rootNode])
  
  // Flatten tree for rendering
  const flatNodes = useMemo(() => flattenTree(rootNode), [rootNode])
  
  // Update a node
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<TreeNode>) => {
    const updatedRoot = updateNodeInTree(rootNode, nodeId, updates)
    onUpdateTree(updatedRoot)
  }, [rootNode, onUpdateTree])
  
  // Add a child to a node
  const handleAddChild = useCallback((parentId: string) => {
    const newChild: TreeNode = {
      id: crypto.randomUUID(),
      name: '',
      value: null,
      nodeType,
      children: [],
      expanded: true,
    }
    const updatedRoot = addChildToNode(rootNode, parentId, newChild)
    onUpdateTree(updatedRoot)
  }, [rootNode, nodeType, onUpdateTree])
  
  // Add a sibling after a node
  const handleAddSibling = useCallback((nodeId: string) => {
    // If this is the root, we can't add a sibling
    if (nodeId === rootNode.id) {
      handleAddChild(rootNode.id)
      return
    }
    
    const newSibling: TreeNode = {
      id: crypto.randomUUID(),
      name: '',
      value: null,
      nodeType,
      children: [],
      expanded: true,
    }
    const updatedRoot = addSiblingAfterNode(rootNode, nodeId, newSibling)
    onUpdateTree(updatedRoot)
  }, [rootNode, nodeType, onUpdateTree, handleAddChild])
  
  // Delete a node
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Can't delete root node
    if (nodeId === rootNode.id) return
    
    const updatedRoot = deleteNodeFromTree(rootNode, nodeId)
    onUpdateTree(updatedRoot)
  }, [rootNode, onUpdateTree])
  
  // Toggle expand/collapse
  const handleToggleExpand = useCallback((nodeId: string) => {
    const node = flatNodes.find(fn => fn.node.id === nodeId)?.node
    if (node) {
      handleUpdateNode(nodeId, { expanded: !node.expanded })
    }
  }, [flatNodes, handleUpdateNode])
  
  // Add category button handler
  const handleAddCategory = useCallback(() => {
    handleAddChild(rootNode.id)
  }, [handleAddChild, rootNode.id])
  
  const sectionColor = nodeType === 'income' ? colors.income : colors.expense
  
  return (
    <div
      className="tree-section"
      style={{
        border: '1px solid var(--app-border-light)',
        borderRadius: 6,
        backgroundColor: 'var(--app-bg-secondary)',
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <div
        className="tree-section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'var(--app-bg-tertiary)',
          borderBottom: '1px solid var(--app-border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: sectionColor,
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--app-text-primary)' }}>
            {title}
          </span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--app-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {totalValue.toLocaleString('ja-JP')}
        </span>
      </div>
      
      {/* Tree Nodes */}
      <div className="tree-section-nodes">
        {flatNodes.map(({ node, depth, calculatedValue }) => (
          <TreeNodeRow
            key={node.id}
            node={node}
            depth={depth}
            calculatedValue={calculatedValue}
            onUpdate={handleUpdateNode}
            onAddChild={handleAddChild}
            onAddSibling={handleAddSibling}
            onDelete={handleDeleteNode}
            onToggleExpand={handleToggleExpand}
            colors={colors}
          />
        ))}
      </div>
      
      {/* Add Category Button */}
      <button
        type="button"
        onClick={handleAddCategory}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          borderTop: '1px solid var(--app-border-light)',
          cursor: 'pointer',
          color: 'var(--app-text-secondary)',
          fontSize: 13,
        }}
      >
        <span className="material-icons" style={{ fontSize: 16 }}>add</span>
        カテゴリを追加
      </button>
    </div>
  )
}

