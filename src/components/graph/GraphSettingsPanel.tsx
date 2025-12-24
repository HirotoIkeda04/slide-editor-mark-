/**
 * GraphSettingsPanel - グラフ設定パネル
 * 
 * テーブルエリアの右側に表示されるポップアップパネル
 * グラフタイプに応じた設定項目を表示
 * インラインモードではホバーで展開
 */

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import type { 
  TableItem, 
  TableDisplayFormat, 
  GraphCategory, 
  TreeSettings,
  NestedCategory,
  ChartYAxisConfig,
  TableChartConfig,
} from '../../types'
import { DEFAULT_TREE_SETTINGS } from '../../types'
import { GraphListSection } from './sections/GraphListSection'
import { DataSection } from './sections/DataSection'
import { ColorSection } from './sections/ColorSection'
import { DisplaySection } from './sections/DisplaySection'
import { XAxisSection } from './sections/XAxisSection'
import { YAxisSection } from './sections/YAxisSection'
import { Y2AxisSection } from './sections/Y2AxisSection'
import { TreeSettingsPanel } from '../tree'
import { getGraphTypeConfig, isTreeInputChart } from '../../constants/graphConfigs'
import { createDefaultYAxisConfig } from '../../utils/chartUtils'
import './GraphPanel.css'

export type PanelOpenedFrom = 'settings' | 'more'
export type PanelMode = 'popup' | 'inline'
type HoverState = 'collapsed' | 'expanding' | 'expanded' | 'closing'

interface GraphSettingsPanelProps {
  isOpen?: boolean
  openedFrom?: PanelOpenedFrom
  table: TableItem
  onClose?: () => void
  onUpdateTable: (updates: Partial<TableItem>) => void
  selectedCategory?: GraphCategory
  onCategoryChange?: (category: GraphCategory) => void
  mode?: PanelMode
}

export const GraphSettingsPanel = ({
  isOpen = true,
  openedFrom = 'settings',
  table,
  onClose,
  onUpdateTable,
  selectedCategory = 'all',
  onCategoryChange,
  mode = 'popup',
}: GraphSettingsPanelProps) => {
  const [isClosing, setIsClosing] = useState(false)
  const [hoverState, setHoverState] = useState<HoverState>('collapsed')
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)
  
  // ホバー展開用タイムアウト
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expandingPhaseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // タイムアウトをすべてクリア
  const clearAllTimeouts = useCallback(() => {
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current)
      expandTimeoutRef.current = null
    }
    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current)
      closingTimeoutRef.current = null
    }
    if (expandingPhaseRef.current) {
      clearTimeout(expandingPhaseRef.current)
      expandingPhaseRef.current = null
    }
  }, [])
  
  // マウスエンター時の処理（インラインモード用）
  const handleMouseEnter = useCallback(() => {
    if (mode !== 'inline') return
    clearAllTimeouts()
    setHoverState('expanding')
    expandingPhaseRef.current = setTimeout(() => {
      setHoverState('expanded')
    }, 200)
  }, [mode, clearAllTimeouts])
  
  // マウスリーブ時の処理（インラインモード用）
  const handleMouseLeave = useCallback(() => {
    if (mode !== 'inline') return
    clearAllTimeouts()
    expandTimeoutRef.current = setTimeout(() => {
      setHoverState('closing')
      closingTimeoutRef.current = setTimeout(() => {
        setHoverState('collapsed')
      }, 300)
    }, 100)
  }, [mode, clearAllTimeouts])
  
  // クリーンアップ
  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])
  
  const isHoverOpen = hoverState === 'expanding' || hoverState === 'expanded'
  
  const displayFormat = table.displayFormat || 'table'
  const chartConfig = table.chartConfig || {}
  const treeSettings = table.treeSettings || DEFAULT_TREE_SETTINGS
  const graphTypeConfig = getGraphTypeConfig(displayFormat)
  const isTreeChart = isTreeInputChart(displayFormat)
  
  // 新軸設定のデフォルト値
  const xAxisCategory = chartConfig.xAxisCategory || null
  const yAxisConfig = chartConfig.yAxisConfig || createDefaultYAxisConfig()
  const y2AxisConfig = chartConfig.y2AxisConfig || createDefaultYAxisConfig()
  
  // Y軸で使用されているカラムインデックス
  const usedColumnIndicesFromY1 = useMemo(() => {
    const indices = new Set<number>()
    for (const stack of yAxisConfig.stacks) {
      for (const series of stack) {
        indices.add(series.column)
      }
    }
    return indices
  }, [yAxisConfig.stacks])
  
  // 閉じるアニメーション付きでパネルを閉じる
  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose?.()
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
  const handleConfigChange = useCallback((updates: Partial<TableChartConfig>) => {
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
  
  // X軸カテゴリを更新
  const handleXAxisCategoryChange = useCallback((category: NestedCategory | null) => {
    handleConfigChange({ xAxisCategory: category ?? undefined })
  }, [handleConfigChange])
  
  // Y軸設定を更新
  const handleYAxisConfigChange = useCallback((config: ChartYAxisConfig) => {
    handleConfigChange({ yAxisConfig: config })
  }, [handleConfigChange])
  
  // Y2軸設定を更新
  const handleY2AxisConfigChange = useCallback((config: ChartYAxisConfig) => {
    handleConfigChange({ y2AxisConfig: config })
  }, [handleConfigChange])
  
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
  
  // インラインモードの場合は常に表示
  if (mode === 'popup' && !isOpen && !isClosing) return null
  
  const panelClassName = mode === 'inline' 
    ? `graph-settings-panel-inline hover-${hoverState}`
    : `graph-settings-panel-popup ${isClosing ? 'closing' : ''}`
  
  // 軸設定を表示するかどうか（表以外、非ツリーベース）
  const showAxisSections = displayFormat !== 'table' && !isTreeChart
  
  // インラインモードでホバー展開
  if (mode === 'inline') {
    return (
      <div 
        ref={panelRef}
        className={panelClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="region"
        aria-label="グラフ設定"
      >
        {/* トリガーアイコン（閉じた状態） */}
        <button
          type="button"
          className="graph-settings-trigger"
          aria-expanded={hoverState === 'expanded' || hoverState === 'expanding'}
          aria-haspopup="true"
        >
          <span className="material-icons">tune</span>
          <span className="graph-settings-trigger-label">設定</span>
        </button>
        
        {/* 展開パネル */}
        <div className={`graph-settings-expand-panel ${hoverState}`}>
          {/* ヘッダー */}
          <div className="graph-panel-header">
            <span id="graph-panel-title" className="graph-panel-title">グラフ設定</span>
          </div>
          
          {/* コンテンツ */}
          <div className="graph-panel-content">
            {/* ツリー設定セクション（ツリーベースチャートの場合） */}
            {isTreeChart && (
              <TreeSettingsPanel
                settings={treeSettings}
                onSettingsChange={handleTreeSettingsChange}
              />
            )}
            
            {/* 新軸設定セクション（表以外、非ツリーベース） */}
            {showAxisSections && (
              <>
                {/* X軸セクション */}
                <XAxisSection
                  table={table}
                  category={xAxisCategory}
                  onCategoryChange={handleXAxisCategoryChange}
                />
                
                {/* Y軸セクション */}
                <YAxisSection
                  table={table}
                  config={yAxisConfig}
                  onConfigChange={handleYAxisConfigChange}
                />
                
                {/* Y2軸セクション */}
                <Y2AxisSection
                  table={table}
                  config={y2AxisConfig}
                  onConfigChange={handleY2AxisConfigChange}
                  usedColumnIndicesFromY1={usedColumnIndicesFromY1}
                />
              </>
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
          </div>
        </div>
      </div>
    )
  }
  
  // ポップアップモード
  return (
    <div 
      ref={panelRef}
      className={panelClassName}
      role="dialog"
      aria-modal="false"
      aria-labelledby="graph-panel-title"
    >
      {/* ヘッダー */}
      <div className="graph-panel-header">
        <span id="graph-panel-title" className="graph-panel-title">グラフ設定</span>
        {onClose && (
          <button
            ref={closeButtonRef}
            className="graph-panel-close-btn"
            onClick={handleClose}
            type="button"
            aria-label="閉じる"
          >
            <span className="material-icons">close</span>
          </button>
        )}
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
        
        {/* 新軸設定セクション（表以外、非ツリーベース） */}
        {showAxisSections && (
          <>
            {/* X軸セクション */}
            <XAxisSection
              table={table}
              category={xAxisCategory}
              onCategoryChange={handleXAxisCategoryChange}
            />
            
            {/* Y軸セクション */}
            <YAxisSection
              table={table}
              config={yAxisConfig}
              onConfigChange={handleYAxisConfigChange}
            />
            
            {/* Y2軸セクション */}
            <Y2AxisSection
              table={table}
              config={y2AxisConfig}
              onConfigChange={handleY2AxisConfigChange}
              usedColumnIndicesFromY1={usedColumnIndicesFromY1}
            />
          </>
        )}
        
        {/* データセクション（表以外、非ツリーベース、旧UIとの互換用） */}
        {displayFormat !== 'table' && !isTreeChart && openedFrom === 'more' && (
          <DataSection
            table={table}
            displayFormat={displayFormat}
            chartConfig={chartConfig}
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
      </div>
    </div>
  )
}
