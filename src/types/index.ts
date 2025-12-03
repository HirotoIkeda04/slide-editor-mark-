export type SlideFormat = 'webinar' | 'meeting' | 'seminar' | 'conference' | 'instapost' | 'instastory' | 'a4'
export type Tone = 'simple' | 'casual' | 'luxury' | 'warm'
export type ConsoleMessageType = 'error' | 'warning' | 'info'

export interface ConsoleMessage {
  type: ConsoleMessageType
  message: string
  line: number
}

export type SlideLayout = 'cover' | 'toc' | 'section' | 'summary' | 'normal'

export interface Slide {
  content: string
  layout?: SlideLayout
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string | Array<{ type: 'text' | 'image'; text?: string; source?: { type: 'base64'; media_type: string; data: string } }>
  images?: string[] // 後方互換性のため（base64 Data URLの配列）
}

// AI編集モード
// - write: 全文を新規作成・書き換え（generate相当）
// - edit: 部分編集（ツール使用で正確に編集）
// - ask: 質問への回答のみ（編集しない）
export type ChatMode = 'write' | 'edit' | 'ask'

export type ClaudeModel = 'claude-3-haiku-20240307' | 'claude-sonnet-4-20250514' | 'claude-opus-4-5-20251101'

// AI編集ツールの定義
export interface AIEditTool {
  name: 'replace_content' | 'search_replace' | 'insert_after' | 'delete_content'
  input: AIEditToolInput
}

// 各ツールの入力パラメータ
export interface ReplaceContentInput {
  content: string // 新しいコンテンツ全体
  reason?: string // 変更理由
}

export interface SearchReplaceInput {
  search: string // 検索文字列（完全一致）
  replace: string // 置換後の文字列
  reason?: string
}

export interface InsertAfterInput {
  after: string // この文字列の後に挿入（完全一致）
  content: string // 挿入するコンテンツ
  reason?: string
}

export interface DeleteContentInput {
  content: string // 削除する文字列（完全一致）
  reason?: string
}

export type AIEditToolInput = ReplaceContentInput | SearchReplaceInput | InsertAfterInput | DeleteContentInput

// AIからのストリーミングイベント
export interface AIStreamEvent {
  type: 'text' | 'tool_use_start' | 'tool_use_input' | 'tool_use_end' | 'done' | 'error'
  content?: string
  toolName?: string
  toolInput?: AIEditToolInput
  error?: string
}

// Item types
export type ItemType = 'table' | 'image' | 'text' | 'slide'

export interface BaseItem {
  id: string
  name: string
  type: ItemType
  createdAt: string
  updatedAt: string
}

// Table cell data types
export type CellDataType = 'text' | 'number' | 'date' | 'percentage' | 'currency'

// Cell format options
export interface CellFormat {
  type: CellDataType
  // Number format options
  decimalPlaces?: number
  useThousandsSeparator?: boolean
  // Date format options
  dateFormat?: string // e.g., 'YYYY-MM-DD', 'MM/DD/YYYY'
  // Currency format options
  currencySymbol?: string // e.g., '$', '¥', '€'
  currencyScale?: 'none' | 'thousand' | 'million' | 'billion' // 単位: なし、千、百万、十億
  // Percentage format options
  percentageDecimalPlaces?: number
}

// Merged cell information
export interface MergedCell {
  row: number
  col: number
  rowSpan: number
  colSpan: number
}

// Table display format (表/グラフ形式)
export type TableDisplayFormat = 'table' | 'line' | 'area' | 'bar' | 'scatter'

// Chart configuration for table visualization
export interface TableChartConfig {
  xAxisColumn?: number  // X軸に使用する列（デフォルト: 0）
  yAxisColumns?: number[]  // Y軸に使用する列（デフォルト: 1以降全て）
  showLegend?: boolean  // 凡例を表示するか
  showGrid?: boolean  // グリッドを表示するか
}

export interface TableItem extends BaseItem {
  type: 'table'
  data: string[][] // CSV形式
  headers?: string[]
  // Cell metadata: key format is "row-col" (e.g., "0-0", "1-2")
  cellTypes?: Record<string, CellDataType> // セルごとのデータ型
  cellFormats?: Record<string, CellFormat> // セルごとの表示フォーマット
  mergedCells?: MergedCell[] // 結合されたセルの情報
  // Chart display settings
  displayFormat?: TableDisplayFormat  // 表示形式（デフォルト: 'table'）
  chartConfig?: TableChartConfig  // グラフ設定
  // Row/Column visibility
  hiddenRows?: number[]    // 非表示行のインデックス
  hiddenColumns?: number[] // 非表示列のインデックス
}

export type ImageDisplayMode = 'contain' | 'cover'

export interface ImageItem extends BaseItem {
  type: 'image'
  dataUrl: string // base64 Data URL
  alt?: string
  displayMode?: ImageDisplayMode // デフォルト: 'contain'
}

export interface TextItem extends BaseItem {
  type: 'text'
  content: string
}

export interface SlideItem extends BaseItem {
  type: 'slide'
  content: string
}

export type Item = TableItem | ImageItem | TextItem | SlideItem

// Editor line structure for line-based editing
export interface EditorLine {
  id: string           // UUID for future collaborative editing
  attribute: string | null  // "#", "##", "###", "-", "*", "!", "1.", "A." etc.
  text: string         // Plain text content (without attribute symbols)
}

// Selection range for multi-line selection
export interface EditorSelection {
  startLine: number
  startChar: number
  endLine: number
  endChar: number
}

