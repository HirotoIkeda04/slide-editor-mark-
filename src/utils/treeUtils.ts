/**
 * Tree Utilities
 * 
 * ツリーデータの計算、変換ユーティリティ
 * サンキー、ツリーマップ、サンバーストチャート用のデータ変換
 */

import type { TreeNode, TreeData, TreeSettings } from '../types'

// ============================================
// 値計算
// ============================================

/**
 * ノードの値を再帰的に計算
 * 葉ノード: 自身の値を返す
 * 親ノード: 子ノードの合計を返す
 */
export const calculateNodeValue = (node: TreeNode): number => {
  if (node.children.length === 0) {
    return node.value ?? 0
  }
  return node.children.reduce((sum, child) => sum + calculateNodeValue(child), 0)
}

/**
 * ツリー全体の合計値を計算
 */
export const calculateTreeTotal = (data: TreeData): { income: number; expense: number; balance: number } => {
  const income = calculateNodeValue(data.income)
  const expense = calculateNodeValue(data.expense)
  return {
    income,
    expense,
    balance: income - expense,
  }
}

// ============================================
// サンキーデータ変換
// ============================================

export interface SankeyNode {
  name: string
  itemStyle?: { color: string }
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

/**
 * ツリーデータをサンキー用のノードとリンクに変換
 * 
 * 収支ツリーの場合:
 * - 収入側: 葉ノード → 親ノード → ... → 中央ノード
 * - 支出側: 中央ノード → 親ノード → ... → 葉ノード
 */
export const treeToSankeyData = (
  data: TreeData,
  settings: TreeSettings
): SankeyData => {
  const nodes = new Map<string, SankeyNode>()
  const links: SankeyLink[] = []
  
  const centerLabel = data.centerLabel || settings.centerLabel || '収支'
  
  // Add center node
  nodes.set(centerLabel, {
    name: centerLabel,
    itemStyle: { color: settings.colors.neutral },
  })
  
  // Process income tree (leaves flow toward center)
  const processIncomeNode = (node: TreeNode, parentName?: string): void => {
    const nodeValue = calculateNodeValue(node)
    if (nodeValue === 0) return
    
    // Add node
    if (!nodes.has(node.name)) {
      nodes.set(node.name, {
        name: node.name,
        itemStyle: { color: settings.colors.income },
      })
    }
    
    if (node.children.length === 0) {
      // Leaf node: connect to parent
      if (parentName) {
        links.push({
          source: node.name,
          target: parentName,
          value: nodeValue,
        })
      }
    } else {
      // Parent node: process children first
      for (const child of node.children) {
        processIncomeNode(child, node.name)
      }
      // Then connect to next parent
      if (parentName) {
        links.push({
          source: node.name,
          target: parentName,
          value: nodeValue,
        })
      }
    }
  }
  
  // Process expense tree (center flows toward leaves)
  const processExpenseNode = (node: TreeNode, parentName?: string): void => {
    const nodeValue = calculateNodeValue(node)
    if (nodeValue === 0) return
    
    // Add node
    if (!nodes.has(node.name)) {
      nodes.set(node.name, {
        name: node.name,
        itemStyle: { color: settings.colors.expense },
      })
    }
    
    // Connect from parent
    if (parentName) {
      links.push({
        source: parentName,
        target: node.name,
        value: nodeValue,
      })
    }
    
    // Process children
    for (const child of node.children) {
      processExpenseNode(child, node.name)
    }
  }
  
  if (settings.structure === 'income-expense') {
    // Process income tree
    for (const child of data.income.children) {
      processIncomeNode(child, undefined)
      // Connect income categories to center
      const childValue = calculateNodeValue(child)
      if (childValue > 0) {
        links.push({
          source: child.name,
          target: centerLabel,
          value: childValue,
        })
      }
    }
    
    // Process expense tree
    for (const child of data.expense.children) {
      // Connect center to expense categories
      const childValue = calculateNodeValue(child)
      if (childValue > 0) {
        links.push({
          source: centerLabel,
          target: child.name,
          value: childValue,
        })
      }
      // Add node
      if (!nodes.has(child.name)) {
        nodes.set(child.name, {
          name: child.name,
          itemStyle: { color: settings.colors.expense },
        })
      }
      // Process children
      for (const grandchild of child.children) {
        processExpenseNode(grandchild, child.name)
      }
    }
  } else {
    // Single tree mode: all flows from root
    const processSingleNode = (node: TreeNode, parentName?: string): void => {
      const nodeValue = calculateNodeValue(node)
      if (nodeValue === 0) return
      
      if (!nodes.has(node.name)) {
        nodes.set(node.name, {
          name: node.name,
          itemStyle: { color: settings.colors.neutral },
        })
      }
      
      if (parentName) {
        links.push({
          source: parentName,
          target: node.name,
          value: nodeValue,
        })
      }
      
      for (const child of node.children) {
        processSingleNode(child, node.name)
      }
    }
    
    for (const child of data.income.children) {
      processSingleNode(child, data.income.name)
    }
  }
  
  return {
    nodes: Array.from(nodes.values()),
    links,
  }
}

// ============================================
// ツリーマップデータ変換
// ============================================

export interface TreemapNode {
  name: string
  value?: number
  children?: TreemapNode[]
  itemStyle?: { color: string }
}

/**
 * ツリーデータをツリーマップ用の階層データに変換
 */
export const treeToTreemapData = (
  data: TreeData,
  settings: TreeSettings
): TreemapNode[] => {
  const convertNode = (node: TreeNode, color: string): TreemapNode => {
    const value = calculateNodeValue(node)
    
    if (node.children.length === 0) {
      return {
        name: node.name,
        value,
        itemStyle: { color },
      }
    }
    
    return {
      name: node.name,
      children: node.children.map(child => convertNode(child, color)),
      itemStyle: { color },
    }
  }
  
  if (settings.structure === 'income-expense') {
    // Return both income and expense as top-level items
    const result: TreemapNode[] = []
    
    if (data.income.children.length > 0) {
      result.push({
        name: data.income.name,
        children: data.income.children.map(child => convertNode(child, settings.colors.income)),
        itemStyle: { color: settings.colors.income },
      })
    }
    
    if (data.expense.children.length > 0) {
      result.push({
        name: data.expense.name,
        children: data.expense.children.map(child => convertNode(child, settings.colors.expense)),
        itemStyle: { color: settings.colors.expense },
      })
    }
    
    return result
  } else {
    // Single tree mode
    return data.income.children.map(child => convertNode(child, settings.colors.neutral))
  }
}

// ============================================
// サンバーストデータ変換
// ============================================

export interface SunburstNode {
  name: string
  value?: number
  children?: SunburstNode[]
  itemStyle?: { color: string }
}

/**
 * ツリーデータをサンバースト用の階層データに変換
 */
export const treeToSunburstData = (
  data: TreeData,
  settings: TreeSettings
): SunburstNode[] => {
  // Sunburst uses the same structure as treemap
  return treeToTreemapData(data, settings) as SunburstNode[]
}

// ============================================
// ツリー操作ユーティリティ
// ============================================

/**
 * ツリー内のノードを検索
 */
export const findNodeById = (root: TreeNode, nodeId: string): TreeNode | null => {
  if (root.id === nodeId) return root
  for (const child of root.children) {
    const found = findNodeById(child, nodeId)
    if (found) return found
  }
  return null
}

/**
 * ノードの親を検索
 */
export const findParentNode = (root: TreeNode, nodeId: string): TreeNode | null => {
  for (const child of root.children) {
    if (child.id === nodeId) return root
    const found = findParentNode(child, nodeId)
    if (found) return found
  }
  return null
}

/**
 * ノードの深さを取得
 */
export const getNodeDepth = (root: TreeNode, nodeId: string, currentDepth: number = 0): number => {
  if (root.id === nodeId) return currentDepth
  for (const child of root.children) {
    const depth = getNodeDepth(child, nodeId, currentDepth + 1)
    if (depth >= 0) return depth
  }
  return -1
}

/**
 * ツリー内の全ノード数を取得
 */
export const countNodes = (node: TreeNode): number => {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

/**
 * ツリーの最大深さを取得
 */
export const getMaxDepth = (node: TreeNode, currentDepth: number = 0): number => {
  if (node.children.length === 0) return currentDepth
  return Math.max(...node.children.map(child => getMaxDepth(child, currentDepth + 1)))
}

/**
 * すべてのノードを展開/折りたたみ
 */
export const setAllNodesExpanded = (node: TreeNode, expanded: boolean): TreeNode => {
  return {
    ...node,
    expanded,
    children: node.children.map(child => setAllNodesExpanded(child, expanded)),
  }
}

