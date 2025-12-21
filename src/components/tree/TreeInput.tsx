/**
 * TreeInput - メインツリー入力コンテナ
 * 
 * 収入/支出のツリー構造を編集するメインUIコンポーネント
 * サンキー、ツリーマップ、サンバースト用のデータ入力に使用
 */

import { useCallback, useMemo } from 'react'
import type { TreeData, TreeSettings, TreeNode } from '../../types'
import { DEFAULT_TREE_SETTINGS, createDefaultTreeData } from '../../types'
import { TreeSection } from './TreeSection'

interface TreeInputProps {
  treeData: TreeData | undefined
  treeSettings: TreeSettings | undefined
  onTreeDataChange: (data: TreeData) => void
  onTreeSettingsChange: (settings: TreeSettings) => void
}

export const TreeInput = ({
  treeData,
  treeSettings,
  onTreeDataChange,
  onTreeSettingsChange,
}: TreeInputProps) => {
  // Use defaults if not provided
  const data = useMemo(() => treeData ?? createDefaultTreeData(), [treeData])
  const settings = useMemo(() => treeSettings ?? DEFAULT_TREE_SETTINGS, [treeSettings])
  
  // Ensure data is initialized
  const handleEnsureData = useCallback(() => {
    if (!treeData) {
      onTreeDataChange(createDefaultTreeData())
    }
    if (!treeSettings) {
      onTreeSettingsChange(DEFAULT_TREE_SETTINGS)
    }
  }, [treeData, treeSettings, onTreeDataChange, onTreeSettingsChange])
  
  // Initialize on mount if needed
  useMemo(() => {
    handleEnsureData()
  }, [handleEnsureData])
  
  // Update income tree
  const handleIncomeTreeChange = useCallback((updatedRoot: TreeNode) => {
    onTreeDataChange({
      ...data,
      income: updatedRoot,
    })
  }, [data, onTreeDataChange])
  
  // Update expense tree
  const handleExpenseTreeChange = useCallback((updatedRoot: TreeNode) => {
    onTreeDataChange({
      ...data,
      expense: updatedRoot,
    })
  }, [data, onTreeDataChange])
  
  // Calculate totals
  const calculateTotal = useCallback((node: TreeNode): number => {
    if (node.children.length === 0) {
      return node.value ?? 0
    }
    return node.children.reduce((sum, child) => sum + calculateTotal(child), 0)
  }, [])
  
  const incomeTotal = useMemo(() => calculateTotal(data.income), [data.income, calculateTotal])
  const expenseTotal = useMemo(() => calculateTotal(data.expense), [data.expense, calculateTotal])
  const balance = incomeTotal - expenseTotal
  
  // Determine display mode
  const isSingleTreeMode = settings.structure === 'single'
  
  return (
    <div
      className="tree-input-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Income/Expense Tree Mode */}
      {!isSingleTreeMode && (
        <>
          {/* Income Section */}
          <TreeSection
            title="収入"
            rootNode={data.income}
            nodeType="income"
            onUpdateTree={handleIncomeTreeChange}
            colors={settings.colors}
          />
          
          {/* Balance Summary */}
          <div
            className="tree-balance-summary"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 24,
              padding: '12px 16px',
              backgroundColor: 'var(--app-bg-tertiary)',
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--app-text-secondary)', fontSize: 11, marginBottom: 2 }}>
                収入
              </div>
              <div style={{ color: settings.colors.income, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {incomeTotal.toLocaleString('ja-JP')}
              </div>
            </div>
            <div style={{ color: 'var(--app-text-disabled)' }}>−</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--app-text-secondary)', fontSize: 11, marginBottom: 2 }}>
                支出
              </div>
              <div style={{ color: settings.colors.expense, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {expenseTotal.toLocaleString('ja-JP')}
              </div>
            </div>
            <div style={{ color: 'var(--app-text-disabled)' }}>=</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--app-text-secondary)', fontSize: 11, marginBottom: 2 }}>
                {settings.centerLabel || '残高'}
              </div>
              <div
                style={{
                  color: balance >= 0 ? settings.colors.income : settings.colors.expense,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {balance.toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
          
          {/* Expense Section */}
          <TreeSection
            title="支出"
            rootNode={data.expense}
            nodeType="expense"
            onUpdateTree={handleExpenseTreeChange}
            colors={settings.colors}
          />
        </>
      )}
      
      {/* Single Tree Mode */}
      {isSingleTreeMode && (
        <TreeSection
          title="データ"
          rootNode={data.income}
          nodeType="neutral"
          onUpdateTree={handleIncomeTreeChange}
          colors={settings.colors}
        />
      )}
      
      {/* Toolbar */}
      <div
        className="tree-toolbar"
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--app-border-light)',
        }}
      >
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            background: 'none',
            border: '1px solid var(--app-border-light)',
            borderRadius: 4,
            cursor: 'pointer',
            color: 'var(--app-text-secondary)',
            fontSize: 12,
          }}
          onClick={() => {
            // TODO: Implement CSV/Excel import
            console.log('Import clicked')
          }}
        >
          <span className="material-icons" style={{ fontSize: 14 }}>upload</span>
          インポート
        </button>
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            background: 'none',
            border: '1px solid var(--app-border-light)',
            borderRadius: 4,
            cursor: 'pointer',
            color: 'var(--app-text-secondary)',
            fontSize: 12,
          }}
          onClick={() => {
            // Toggle between tree and table view
            console.log('Table view clicked')
          }}
        >
          <span className="material-icons" style={{ fontSize: 14 }}>table_chart</span>
          テーブル表示
        </button>
      </div>
    </div>
  )
}

