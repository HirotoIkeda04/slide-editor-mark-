/**
 * TreeSettingsPanel - ツリー設定パネル
 * 
 * ツリー構造、中央ノード名、カラー、表示設定を管理
 */

import { useCallback } from 'react'
import type { TreeSettings } from '../../types'
import { DEFAULT_TREE_SETTINGS } from '../../types'

interface TreeSettingsPanelProps {
  settings: TreeSettings | undefined
  onSettingsChange: (settings: TreeSettings) => void
}

export const TreeSettingsPanel = ({
  settings,
  onSettingsChange,
}: TreeSettingsPanelProps) => {
  const currentSettings = settings ?? DEFAULT_TREE_SETTINGS
  
  // Update structure
  const handleStructureChange = useCallback((structure: 'single' | 'income-expense') => {
    onSettingsChange({
      ...currentSettings,
      structure,
    })
  }, [currentSettings, onSettingsChange])
  
  // Update center label
  const handleCenterLabelChange = useCallback((centerLabel: string) => {
    onSettingsChange({
      ...currentSettings,
      centerLabel,
    })
  }, [currentSettings, onSettingsChange])
  
  // Update colors
  const handleColorChange = useCallback((key: 'income' | 'expense' | 'neutral', color: string) => {
    onSettingsChange({
      ...currentSettings,
      colors: {
        ...currentSettings.colors,
        [key]: color,
      },
    })
  }, [currentSettings, onSettingsChange])
  
  // Update display settings
  const handleDisplayChange = useCallback((key: keyof TreeSettings['display'], value: boolean | number) => {
    onSettingsChange({
      ...currentSettings,
      display: {
        ...currentSettings.display,
        [key]: value,
      },
    })
  }, [currentSettings, onSettingsChange])
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">ツリー設定</div>
      
      {/* Structure Selection */}
      <div className="graph-form-group">
        <label className="graph-form-label">データ構造</label>
        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="tree-structure"
              checked={currentSettings.structure === 'income-expense'}
              onChange={() => handleStructureChange('income-expense')}
            />
            収支
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="tree-structure"
              checked={currentSettings.structure === 'single'}
              onChange={() => handleStructureChange('single')}
            />
            単一
          </label>
        </div>
      </div>
      
      {/* Center Label (only for income-expense mode) */}
      {currentSettings.structure === 'income-expense' && (
        <div className="graph-form-group">
          <label className="graph-form-label">中央ノード名</label>
          <input
            type="text"
            className="graph-form-input"
            value={currentSettings.centerLabel}
            onChange={(e) => handleCenterLabelChange(e.target.value)}
            placeholder="収支"
          />
        </div>
      )}
      
      {/* Colors */}
      <div className="graph-form-group">
        <label className="graph-form-label">カラー</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={currentSettings.colors.income}
              onChange={(e) => handleColorChange('income', e.target.value)}
              style={{ width: 24, height: 24, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>収入</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={currentSettings.colors.expense}
              onChange={(e) => handleColorChange('expense', e.target.value)}
              style={{ width: 24, height: 24, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>支出</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={currentSettings.colors.neutral}
              onChange={(e) => handleColorChange('neutral', e.target.value)}
              style={{ width: 24, height: 24, border: 'none', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: 'var(--app-text-secondary)' }}>中立</span>
          </div>
        </div>
      </div>
      
      {/* Display Settings */}
      <div className="graph-form-group">
        <label className="graph-form-label">表示</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={currentSettings.display.showValues}
              onChange={(e) => handleDisplayChange('showValues', e.target.checked)}
            />
            値を表示
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={currentSettings.display.showPercentage}
              onChange={(e) => handleDisplayChange('showPercentage', e.target.checked)}
            />
            %を表示
          </label>
        </div>
      </div>
      
      {/* Max Depth */}
      <div className="graph-form-group">
        <label className="graph-form-label">最大階層深さ</label>
        <select
          className="graph-form-select"
          value={currentSettings.display.maxDepth}
          onChange={(e) => handleDisplayChange('maxDepth', parseInt(e.target.value, 10))}
        >
          {[2, 3, 4, 5, 6, 7, 8].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

