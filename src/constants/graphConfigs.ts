/**
 * Graph Configuration Constants
 * 
 * グラフタイプ、カテゴリ、データパターンの定義
 */

import type { TableDisplayFormat, GraphCategory, DataPattern, ChartInputMode, ZAxisUsage } from '../types'

// ============================================
// カテゴリ定義
// ============================================

export interface GraphCategoryConfig {
  id: GraphCategory
  label: string
  labelEn: string
}

export const graphCategories: GraphCategoryConfig[] = [
  { id: 'all', label: 'すべて', labelEn: 'All' },
  { id: 'basic', label: '基本', labelEn: 'Basic' },
  { id: 'composition', label: '構成比', labelEn: 'Composition' },
  { id: 'analysis', label: '分析', labelEn: 'Analysis' },
  { id: 'hierarchy', label: '階層', labelEn: 'Hierarchy' },
  { id: 'financial', label: '金融', labelEn: 'Financial' },
  { id: 'statistical', label: '統計', labelEn: 'Statistical' },
]

// ============================================
// 入力モードマッピング
// ============================================

/**
 * チャートタイプごとの入力モード
 * - spreadsheet: スプレッドシート形式（デフォルト）
 * - tree: ツリー形式（サンキー、ツリーマップ、サンバースト用）
 * - map: 地図形式（将来実装）
 */
export const CHART_INPUT_MODE: Record<TableDisplayFormat, ChartInputMode> = {
  // 軸ベース（スプレッドシート）
  table: 'spreadsheet',
  bar: 'spreadsheet',
  horizontalBar: 'spreadsheet',
  line: 'spreadsheet',
  area: 'spreadsheet',
  scatter: 'spreadsheet',
  bubble: 'spreadsheet',
  donut: 'spreadsheet',
  radar: 'spreadsheet',
  heatmap: 'spreadsheet',
  stackedBar: 'spreadsheet',
  waterfall: 'spreadsheet',
  candlestick: 'spreadsheet',
  boxplot: 'spreadsheet',
  combo: 'spreadsheet',
  dot: 'spreadsheet',
  
  // ツリーベース
  sankey: 'tree',
  treemap: 'tree',
  sunburst: 'tree',
  
  // ランキング
  bump: 'spreadsheet',
}

// ============================================
// グラフタイプ定義
// ============================================

export interface GraphTypeConfig {
  id: TableDisplayFormat
  label: string
  labelEn: string
  icon: string  // Material Icons name
  categories: GraphCategory[]  // 複数カテゴリに属することが可能
  dataPattern: DataPattern
  description: string
  hasAxisSection: boolean  // 軸設定セクションを表示するか
  chartSettings: ChartSettingType[]  // 表示するグラフ設定項目
}

// グラフ設定項目タイプ
export type ChartSettingType = 
  | 'stacked'       // 積み上げ設定
  | 'rightYAxis'    // 右Y軸設定
  | 'errorBar'      // エラーバー設定
  | 'regression'    // 回帰直線設定（散布図用）
  | 'stackedMode'   // 積み上げモード（通常/100%）
  | 'colorScale'    // カラースケール（ヒートマップ用）

export const graphTypes: GraphTypeConfig[] = [
  // === 基本 (Basic) ===
  {
    id: 'table',
    label: '表',
    labelEn: 'Table',
    icon: 'table_chart',
    categories: ['basic'],
    dataPattern: 'A',
    description: 'テーブル形式でデータを表示',
    hasAxisSection: false,
    chartSettings: [],
  },
  {
    id: 'bar',
    label: '棒',
    labelEn: 'Bar',
    icon: 'bar_chart',
    categories: ['basic'],
    dataPattern: 'A',
    description: '縦棒グラフ',
    hasAxisSection: true,
    chartSettings: ['stacked', 'rightYAxis', 'errorBar'],
  },
  {
    id: 'horizontalBar',
    label: '横棒',
    labelEn: 'Horizontal Bar',
    icon: 'align_horizontal_left',
    categories: ['basic'],
    dataPattern: 'A',
    description: '横棒グラフ',
    hasAxisSection: true,
    chartSettings: ['stacked'],
  },
  {
    id: 'line',
    label: '折れ線',
    labelEn: 'Line',
    icon: 'show_chart',
    categories: ['basic'],
    dataPattern: 'A',
    description: '折れ線グラフ',
    hasAxisSection: true,
    chartSettings: ['rightYAxis', 'errorBar'],
  },
  {
    id: 'area',
    label: '面',
    labelEn: 'Area',
    icon: 'area_chart',
    categories: ['basic'],
    dataPattern: 'A',
    description: '面グラフ',
    hasAxisSection: true,
    chartSettings: ['stacked'],
  },
  
  // === 構成比 (Composition) ===
  {
    id: 'donut',
    label: 'ドーナツ',
    labelEn: 'Donut',
    icon: 'donut_large',
    categories: ['composition'],
    dataPattern: 'A',
    description: 'ドーナツチャート（円グラフ）',
    hasAxisSection: false,
    chartSettings: [],
  },
  {
    id: 'treemap',
    label: 'ツリーマップ',
    labelEn: 'Treemap',
    icon: 'grid_view',
    categories: ['composition', 'hierarchy'],
    dataPattern: 'F',
    description: '階層構造を面積で表現',
    hasAxisSection: false,
    chartSettings: [],
  },
  {
    id: 'sankey',
    label: 'サンキー',
    labelEn: 'Sankey',
    icon: 'account_tree',
    categories: ['composition', 'hierarchy'],
    dataPattern: 'E',
    description: 'フローと流量を可視化',
    hasAxisSection: false,
    chartSettings: [],
  },
  {
    id: 'stackedBar',
    label: '積み上げ棒',
    labelEn: 'Stacked Bar',
    icon: 'stacked_bar_chart',
    categories: ['composition'],
    dataPattern: 'A',
    description: '積み上げ棒グラフ',
    hasAxisSection: true,
    chartSettings: ['stackedMode'],
  },
  
  // === 分析 (Analysis) ===
  {
    id: 'waterfall',
    label: 'ウォーターフォール',
    labelEn: 'Waterfall',
    icon: 'waterfall_chart',
    categories: ['analysis'],
    dataPattern: 'G',
    description: '増減の推移を可視化',
    hasAxisSection: true,
    chartSettings: [],
  },
  {
    id: 'combo',
    label: 'コンボ',
    labelEn: 'Combo',
    icon: 'multiline_chart',
    categories: ['analysis', 'financial'],
    dataPattern: 'I',
    description: '棒グラフと折れ線の組み合わせ',
    hasAxisSection: true,
    chartSettings: ['rightYAxis'],
  },
  {
    id: 'heatmap',
    label: 'ヒートマップ',
    labelEn: 'Heatmap',
    icon: 'grid_on',
    categories: ['analysis'],
    dataPattern: 'D',
    description: 'マトリクスを色で表現',
    hasAxisSection: false,
    chartSettings: ['colorScale'],
  },
  
  // === 金融 (Financial) ===
  {
    id: 'candlestick',
    label: 'ローソク足',
    labelEn: 'Candlestick',
    icon: 'candlestick_chart',
    categories: ['financial'],
    dataPattern: 'C',
    description: '株価などのOHLCデータを表示',
    hasAxisSection: true,
    chartSettings: [],
  },
  
  // === 統計 (Statistical) ===
  {
    id: 'scatter',
    label: '散布',
    labelEn: 'Scatter',
    icon: 'scatter_plot',
    categories: ['statistical'],
    dataPattern: 'B',
    description: '2変数の相関を可視化',
    hasAxisSection: true,
    chartSettings: ['regression'],
  },
  {
    id: 'bubble',
    label: 'バブル',
    labelEn: 'Bubble',
    icon: 'bubble_chart',
    categories: ['statistical'],
    dataPattern: 'B_size',
    description: '3変数を位置とサイズで表現',
    hasAxisSection: true,
    chartSettings: [],
  },
  {
    id: 'boxplot',
    label: '箱ひげ図',
    labelEn: 'Box Plot',
    icon: 'candlestick_chart',
    categories: ['statistical'],
    dataPattern: 'H',
    description: 'データの分布を可視化',
    hasAxisSection: true,
    chartSettings: [],
  },
  {
    id: 'radar',
    label: 'レーダー',
    labelEn: 'Radar',
    icon: 'radar',
    categories: ['statistical'],
    dataPattern: 'A',
    description: '多変数を放射状に表現',
    hasAxisSection: false,
    chartSettings: [],
  },
  {
    id: 'dot',
    label: 'ドット',
    labelEn: 'Dot',
    icon: 'scatter_plot',
    categories: ['basic', 'statistical'],
    dataPattern: 'A',
    description: 'カテゴリごとの値をドットで表示',
    hasAxisSection: true,
    chartSettings: [],
  },
]

// ============================================
// データパターン定義
// ============================================

export interface DataPatternField {
  key: string
  label: string
  labelEn: string
  type: 'dropdown' | 'checkboxes'
  required: boolean
  description?: string
}

export interface DataPatternConfig {
  id: DataPattern
  label: string
  fields: DataPatternField[]
}

export const dataPatterns: Record<DataPattern, DataPatternConfig> = {
  // Pattern A: カテゴリ+数値列（棒/横棒/折れ線/面/積み上げ棒/ドーナツ/レーダー）
  A: {
    id: 'A',
    label: 'カテゴリ + 数値列',
    fields: [
      { key: 'xAxisColumn', label: 'X軸', labelEn: 'X Axis', type: 'dropdown', required: true },
      { key: 'yAxisColumns', label: 'Y軸', labelEn: 'Y Axis', type: 'checkboxes', required: true },
    ],
  },
  // Pattern B: 数値×数値（散布）
  B: {
    id: 'B',
    label: '数値 × 数値',
    fields: [
      { key: 'xAxisColumn', label: 'X', labelEn: 'X', type: 'dropdown', required: true },
      { key: 'yAxisColumns', label: 'Y', labelEn: 'Y', type: 'dropdown', required: true },
    ],
  },
  // Pattern B+サイズ: バブル
  B_size: {
    id: 'B_size',
    label: '数値 × 数値 + サイズ',
    fields: [
      { key: 'xAxisColumn', label: 'X', labelEn: 'X', type: 'dropdown', required: true },
      { key: 'yAxisColumns', label: 'Y', labelEn: 'Y', type: 'dropdown', required: true },
      { key: 'sizeColumn', label: 'サイズ', labelEn: 'Size', type: 'dropdown', required: true },
    ],
  },
  // Pattern C: OHLC（ローソク足）
  C: {
    id: 'C',
    label: 'OHLC',
    fields: [
      { key: 'dateColumn', label: '日付', labelEn: 'Date', type: 'dropdown', required: true },
      { key: 'openColumn', label: '始値', labelEn: 'Open', type: 'dropdown', required: true },
      { key: 'highColumn', label: '高値', labelEn: 'High', type: 'dropdown', required: true },
      { key: 'lowColumn', label: '安値', labelEn: 'Low', type: 'dropdown', required: true },
      { key: 'closeColumn', label: '終値', labelEn: 'Close', type: 'dropdown', required: true },
    ],
  },
  // Pattern D: マトリクス（ヒートマップ）
  D: {
    id: 'D',
    label: 'マトリクス',
    fields: [
      { key: 'rowLabelColumn', label: '行ラベル', labelEn: 'Row Label', type: 'dropdown', required: true },
      { key: 'colLabelColumn', label: '列ラベル', labelEn: 'Column Label', type: 'dropdown', required: true },
      { key: 'valueColumn', label: '値', labelEn: 'Value', type: 'dropdown', required: true },
    ],
  },
  // Pattern E: フロー（サンキー）
  E: {
    id: 'E',
    label: 'フロー',
    fields: [
      { key: 'fromColumn', label: 'From', labelEn: 'From', type: 'dropdown', required: true },
      { key: 'toColumn', label: 'To', labelEn: 'To', type: 'dropdown', required: true },
      { key: 'valueColumn', label: '値', labelEn: 'Value', type: 'dropdown', required: true },
    ],
  },
  // Pattern F: 階層（ツリーマップ）
  F: {
    id: 'F',
    label: '階層',
    fields: [
      { key: 'xAxisColumn', label: 'カテゴリ', labelEn: 'Category', type: 'dropdown', required: true },
      { key: 'valueColumn', label: '値', labelEn: 'Value', type: 'dropdown', required: true },
    ],
  },
  // Pattern G: 増減（ウォーターフォール）
  G: {
    id: 'G',
    label: '増減',
    fields: [
      { key: 'xAxisColumn', label: 'ラベル', labelEn: 'Label', type: 'dropdown', required: true },
      { key: 'valueColumn', label: '値', labelEn: 'Value', type: 'dropdown', required: true },
      { key: 'typeColumn', label: 'タイプ', labelEn: 'Type', type: 'dropdown', required: false, description: '開始/増加/減少/合計を示す列（任意）' },
    ],
  },
  // Pattern H: 分布（箱ひげ図）
  H: {
    id: 'H',
    label: '分布',
    fields: [
      { key: 'groupColumn', label: 'グループ', labelEn: 'Group', type: 'dropdown', required: true },
      { key: 'valueColumn', label: '値', labelEn: 'Value', type: 'dropdown', required: true },
    ],
  },
  // Pattern I: 複合（コンボ）
  I: {
    id: 'I',
    label: '複合',
    fields: [
      { key: 'xAxisColumn', label: 'X軸', labelEn: 'X Axis', type: 'dropdown', required: true },
      { key: 'barColumns', label: '棒', labelEn: 'Bar', type: 'checkboxes', required: true },
      { key: 'lineColumns', label: '線', labelEn: 'Line', type: 'checkboxes', required: true },
    ],
  },
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * グラフタイプIDから設定を取得
 */
export const getGraphTypeConfig = (id: TableDisplayFormat): GraphTypeConfig | undefined => {
  return graphTypes.find(type => type.id === id)
}

/**
 * カテゴリに属するグラフタイプを取得
 */
export const getGraphTypesByCategory = (category: GraphCategory): GraphTypeConfig[] => {
  if (category === 'all') {
    return graphTypes
  }
  return graphTypes.filter(type => type.categories.includes(category))
}

/**
 * グラフタイプのデータパターンを取得
 */
export const getDataPattern = (displayFormat: TableDisplayFormat): DataPatternConfig | undefined => {
  const graphType = getGraphTypeConfig(displayFormat)
  if (!graphType) return undefined
  return dataPatterns[graphType.dataPattern]
}

/**
 * 設定ボタンが有効かどうか（表以外はすべて有効）
 */
export const isSettingsEnabled = (displayFormat: TableDisplayFormat): boolean => {
  return displayFormat !== 'table'
}

/**
 * グラフタイプが特定のグラフ設定を持つかどうか
 */
export const hasChartSetting = (displayFormat: TableDisplayFormat, setting: ChartSettingType): boolean => {
  const config = getGraphTypeConfig(displayFormat)
  return config?.chartSettings.includes(setting) ?? false
}

/**
 * グラフタイプの入力モードを取得
 */
export const getChartInputMode = (displayFormat: TableDisplayFormat): ChartInputMode => {
  return CHART_INPUT_MODE[displayFormat] || 'spreadsheet'
}

/**
 * ツリー入力が必要なグラフタイプかどうか
 */
export const isTreeInputChart = (displayFormat: TableDisplayFormat): boolean => {
  return CHART_INPUT_MODE[displayFormat] === 'tree'
}

// ============================================
// Z軸用途マッピング（Phase 2）
// ============================================

/**
 * チャートタイプごとに利用可能なZ軸の用途
 * 空配列 = Z軸なし
 */
export const CHART_Z_USAGE: Record<TableDisplayFormat, ZAxisUsage[]> = {
  table: [],
  bar: ['group'],
  horizontalBar: ['group'],
  line: ['group'],
  area: ['group'],
  stackedBar: [],
  donut: [],
  treemap: [],
  sankey: [],
  waterfall: [],
  combo: [],
  heatmap: ['color'],  // colorは必須
  candlestick: [],
  scatter: ['color', 'group'],
  bubble: ['size', 'color'],  // sizeは必須
  boxplot: [],
  radar: [],
  dot: ['group'],
  sunburst: [],
  bump: [],
}

/**
 * チャートタイプのZ軸用途を取得
 */
export const getChartZUsages = (displayFormat: TableDisplayFormat): ZAxisUsage[] => {
  return CHART_Z_USAGE[displayFormat] || []
}

/**
 * 系列ごとの表示タイプを設定できるチャートかどうか
 */
export const supportsSeriesDisplayType = (displayFormat: TableDisplayFormat): boolean => {
  return ['bar', 'line', 'area', 'combo'].includes(displayFormat)
}
