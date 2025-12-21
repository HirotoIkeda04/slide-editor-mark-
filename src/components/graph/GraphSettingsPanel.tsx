/**
 * GraphSettingsPanel - グラフ設定パネル
 * 
 * テーブルエリアの右側に表示されるポップアップパネル
 * グラフタイプに応じた設定項目を表示
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import type { TableItem, TableDisplayFormat, GraphCategory, TreeSettings } from '../../types'
import { DEFAULT_TREE_SETTINGS } from '../../types'
import { GraphListSection } from './sections/GraphListSection'
import { DataSection } from './sections/DataSection'
import { ChartSettingsSection } from './sections/ChartSettingsSection'
import { ColorSection } from './sections/ColorSection'
import { DisplaySection } from './sections/DisplaySection'
import { AxisSection } from './sections/AxisSection'
import { TreeSettingsPanel } from '../tree'
import { getGraphTypeConfig, isTreeInputChart, getChartZUsages, supportsSeriesDisplayType } from '../../constants/graphConfigs'
import './GraphPanel.css'

export type PanelOpenedFrom = 'settings' | 'more'

interface GraphSettingsPanelProps {
  isOpen: boolean
  openedFrom: PanelOpenedFrom
  table: TableItem
  onClose: () => void
  onUpdateTable: (updates: Partial<TableItem>) => void
  selectedCategory?: GraphCategory
  onCategoryChange?: (category: GraphCategory) => void
}

export const GraphSettingsPanel = ({
  isOpen,
  openedFrom,
  table,
  onClose,
  onUpdateTable,
  selectedCategory = 'all',
  onCategoryChange,
}: GraphSettingsPanelProps) => {
  const [isClosing, setIsClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  
  const displayFormat = table.displayFormat || 'table'
  const chartConfig = table.chartConfig || {}
  const treeSettings = table.treeSettings || DEFAULT_TREE_SETTINGS
  const graphTypeConfig = getGraphTypeConfig(displayFormat)
  const isTreeChart = isTreeInputChart(displayFormat)
  
  // 閉じるアニメーション付きでパネルを閉じる
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }, [onClose])
  
  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])
  
  // フォーカス管理: パネル開閉時のフォーカス制御
  useEffect(() => {
    if (isOpen && !isClosing) {
      // パネルを開いた時、現在のフォーカス要素を記憶
      previousActiveElementRef.current = document.activeElement as HTMLElement
      // 閉じるボタンにフォーカス
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isClosing])
  
  // パネルを閉じた時、元の要素にフォーカスを戻す
  useEffect(() => {
    if (!isOpen && !isClosing && previousActiveElementRef.current) {
      previousActiveElementRef.current.focus()
      previousActiveElementRef.current = null
    }
  }, [isOpen, isClosing])
  
  // グラフタイプを変更
  const handleFormatChange = useCallback((format: TableDisplayFormat) => {
    onUpdateTable({
      displayFormat: format,
    })
  }, [onUpdateTable])
  
  // チャート設定を更新
  const handleConfigChange = useCallback((updates: Partial<typeof chartConfig>) => {
    onUpdateTable({
      chartConfig: {
        ...chartConfig,
        ...updates,
      },
    })
  }, [chartConfig, onUpdateTable])
  
  // ツリー設定を更新
  const handleTreeSettingsChange = useCallback((newSettings: TreeSettings) => {
    onUpdateTable({
      treeSettings: newSettings,
    })
  }, [onUpdateTable])
  
  // パネル外クリックで閉じる
  useEffect(() => {
    if (!isOpen || isClosing) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    
    // 少し遅延を入れて、開いた時のクリックで閉じないようにする
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isClosing, handleClose])
  
  if (!isOpen && !isClosing) return null
  
  return (
    <div 
      ref={panelRef}
      className={`graph-settings-panel-popup ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="graph-panel-title"
    >
      {/* ヘッダー */}
      <div className="graph-panel-header">
        <span id="graph-panel-title" className="graph-panel-title">グラフ設定</span>
        <button
          ref={closeButtonRef}
          className="graph-panel-close-btn"
          onClick={handleClose}
          type="button"
          aria-label="閉じる"
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      {/* コンテンツ */}
      <div className="graph-panel-content">
        {/* グラフ一覧セクション（もっと見るから開いた場合のみ表示） */}
        {openedFrom === 'more' && (
          <GraphListSection
            currentFormat={displayFormat}
            onFormatChange={handleFormatChange}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
        )}
        
        {/* ツリー設定セクション（ツリーベースチャートの場合） */}
        {isTreeChart && (
          <TreeSettingsPanel
            settings={treeSettings}
            onSettingsChange={handleTreeSettingsChange}
          />
        )}
        
        {/* データセクション（表以外、非ツリーベース） */}
        {displayFormat !== 'table' && !isTreeChart && (
          <DataSection
            table={table}
            displayFormat={displayFormat}
            chartConfig={chartConfig}
            onConfigChange={handleConfigChange}
          />
        )}
        
        {/* グラフ設定セクション（設定項目がある場合のみ） */}
        {graphTypeConfig && graphTypeConfig.chartSettings.length > 0 && (
          <ChartSettingsSection
            displayFormat={displayFormat}
            chartConfig={chartConfig}
            table={table}
            onConfigChange={handleConfigChange}
          />
        )}
        
        {/* カラーセクション（表以外） */}
        {displayFormat !== 'table' && (
          <ColorSection
            table={table}
            chartConfig={chartConfig}
            onConfigChange={handleConfigChange}
          />
        )}
        
        {/* 表示セクション（表以外） */}
        {displayFormat !== 'table' && (
          <DisplaySection
            chartConfig={chartConfig}
            onConfigChange={handleConfigChange}
          />
        )}
        
        {/* 軸セクション（軸設定がある場合のみ） */}
        {graphTypeConfig?.hasAxisSection && (
          <AxisSection
            chartConfig={chartConfig}
            onConfigChange={handleConfigChange}
            table={table}
            showSeriesConfig={supportsSeriesDisplayType(displayFormat)}
            showZAxis={getChartZUsages(displayFormat).length > 0}
            zAxisUsages={getChartZUsages(displayFormat)}
          />
        )}
      </div>
    </div>
  )
}
