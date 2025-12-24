export type SlideFormat = 'webinar' | 'meeting' | 'seminar' | 'conference' | 'instapost' | 'instastory' | 'a4'

// Legacy Tone type (kept for backward compatibility during migration)
export type Tone = 'simple' | 'casual' | 'luxury' | 'warm'

// ============================================
// 印象コードシステム (Impression Code System)
// ============================================

/**
 * 4軸の印象コード
 * 各軸は1〜5の値を持つ（3が中央/ニュートラル）
 * 
 * 軸の定義：
 * - E (Energy): 落ち着いた(1) 〜 エネルギッシュ(5)
 * - F (Formality): 親しみやすい(1) 〜 格式高い(5)
 * - C (Classic-Modern): 伝統的(1) 〜 現代的(5)
 * - D (Decoration): シンプル(1) 〜 装飾的(5)
 */
export interface ImpressionCode {
  energy: number        // E: 1=落ち着いた（Calm） 〜 5=エネルギッシュ（Energetic）
  formality: number     // F: 1=親しみやすい（Friendly） 〜 5=格式高い（Formal）
  classicModern: number // C: 1=伝統的（Classic） 〜 5=現代的（Modern）
  decoration: number    // D: 1=シンプル（Simple） 〜 5=装飾的（Decorative）
}

/**
 * 印象コードのプリセット定義
 */
export interface ImpressionPreset {
  id: string
  name: string          // 表示名（例: "kawaii", "business"）
  nameJa: string        // 日本語名（例: "かわいい", "ビジネス"）
  code: ImpressionCode
  description?: string  // 説明文
}

/**
 * スライダーの区間指定（フィルタリング用）
 * 各軸の最小値〜最大値を指定
 */
export interface ImpressionRange {
  energy: [number, number]
  formality: [number, number]
  classicModern: [number, number]
  decoration: [number, number]
}

/**
 * ベーススタイル（13種類）
 */
export type TonmanaBaseStyle = 'Plain' | 'Corporate' | 'Elegant' | 'Casual' | 'Tech' | 'Natural' | 'Gradient' | 'Neon' | 'NeonBold' | 'Handwritten' | 'DarkTech' | 'DarkElegant' | 'DarkCasual'

/**
 * トンマナフィルターカテゴリ
 * - light: ライトテーマ（明るい背景）
 * - dark: ダークテーマ（暗い背景）
 * - formal: フォーマル（格式高い）
 * - casual: カジュアル（親しみやすい）
 * - gradient: グラデーション
 * - handwritten: 手書き風
 * - used: 利用済み（履歴）
 */
export type TonmanaFilterCategory = 'light' | 'dark' | 'formal' | 'casual' | 'gradient' | 'handwritten' | 'used'

/**
 * ブランドカラー（11色）
 */
export type TonmanaColor = 'Gray' | 'Sky' | 'Coral' | 'Mint' | 'Sand' | 'Lavender' | 'Amber' | 'Pink' | 'Cyan' | 'Lime' | 'Yellow'

/**
 * トンマナの格付け（APCA Lc基準）
 * - S: 厳しい基準で全合格（本文Lc>=90, 見出しLc>=75, 表紙Lc>=75）
 * - A: 一般的基準で全合格（本文Lc>=75, 見出しLc>=60, 表紙Lc>=60）
 * - B: 甘め基準で全合格（本文Lc>=60, 見出しLc>=45, 表紙Lc>=45）
 */
export type TonmanaRank = 'S' | 'A' | 'B'

/**
 * Tone & Mannerのスタイル定義
 */
export interface TonmanaStyle {
  name: string
  bgNormal: string
  bgCover: string
  headingColor: string
  textColor: string
  fontHeading: string
  fontBody: string
  letterSpacing: string
  // カラーパレット
  baseColor: string      // ベースカラー（白/黒に近い色、通常はbgNormalと同じ）
  primary: string        // プライマリーカラー
  secondary: string      // セカンダリーカラー
  chartColors: string[]  // カラーパレット（8色）
}

/**
 * Tone & Mannerチップの視覚スタイル定義
 * チップ自体がTone & Mannerの趣旨を視覚的に表現する（Show, don't tell）
 */
export interface TonmanaChipStyle {
  fontFamily: string
  fontWeight: number
  color: string
  backgroundColor: string
  borderRadius: string
  border?: string
}

/**
 * Tone & Manner定義
 * スタイル×カラーの組み合わせで一意に定義される
 */
export interface TonmanaBiome {
  id: string                      // 例: "plain-gray", "corporate-sky"
  name: string                    // 英語名（例: "PlainGray", "CorporateSky"）
  nameJa: string                  // 日本語名（例: "プレーン グレー", "コーポレート スカイ"）
  baseStyle: TonmanaBaseStyle     // ベーススタイル
  color: TonmanaColor             // カラー
  // スタイル定義
  style: TonmanaStyle
  // チップの視覚スタイル
  chipStyle: TonmanaChipStyle
}

/**
 * グラデーション設定
 */
export interface GradientConfig {
  enabled: boolean
  type: 'linear' | 'radial'
  angle?: number  // linear用: 0-360度
  colors: string[]  // 2色以上
  positions?: number[]  // 各色の位置（0-100）
}

/**
 * 印象コードのサブ属性（出力に影響する追加パラメータ）
 */
export interface ImpressionSubAttributes {
  themeMode?: 'light' | 'dark' | 'auto'  // テーマモード（背景の明暗）
  colorTemperature?: 'cool' | 'neutral' | 'warm'  // 色温度（寒色〜暖色）
  contrast?: 'low' | 'medium' | 'high'  // コントラスト（配色のメリハリ）
  saturation?: 'muted' | 'normal' | 'vivid'  // 彩度（色の鮮やかさ）
}

/**
 * 印象コードから生成されるCSSスタイル変数
 */
export interface ImpressionStyleVars {
  // Colors
  primary: string
  primaryLight: string
  primaryDark: string
  background: string
  backgroundAlt: string
  backgroundCover: string  // 表紙/中扉用背景色
  textCover: string        // 表紙/中扉用テキスト色
  text: string
  textMuted: string
  accent: string
  // Gradients
  backgroundGradient?: GradientConfig
  textGradient?: GradientConfig
  backgroundCoverGradient?: GradientConfig  // 表紙用背景グラデーション
  // Typography
  fontFamily: string
  fontFamilyHeading: string
  fontWeight: number
  fontWeightHeading: number
  letterSpacing: string
  // Layout
  borderRadius: string
  spacing: string
  // Chart colors
  chartColors?: string[]  // カラーパレット（グラフ用、8色）
}

/**
 * 印象コードの履歴エントリ
 */
export interface ImpressionHistoryEntry {
  code: ImpressionCode
  presetId?: string     // プリセットから選択した場合のID
  timestamp: number
}

/**
 * 詳細設定のピン留め状態
 * trueの項目はTone & Manner変更時も値を保持する
 */
export interface StylePins {
  primary?: boolean
  background?: boolean
  accent?: boolean
  fontFamily?: boolean
  borderRadius?: boolean
  backgroundGradient?: boolean
  textGradient?: boolean
  subAttributes?: boolean  // サブ属性全体のピン留め
}

/**
 * カラーパレット候補
 * Tone & Mannerから生成される色相バリエーション
 */
export interface ColorPalette {
  id: string
  name: string        // 例: "ブルー系", "グリーン系"
  nameEn: string      // 例: "Blue", "Green"
  primary: string     // メインカラー
  background: string  // 背景色
  accent: string      // アクセントカラー
  text: string        // テキスト色
}

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
export type ItemType = 'table' | 'image' | 'text' | 'slide' | 'picto' | 'euler' | 'new'

// 新しいアイテム用の固定ID
export const NEW_ITEM_ID = 'new-item'

export interface BaseItem {
  id: string
  name: string
  type: ItemType
  createdAt: string
  updatedAt: string
}

// Table cell data types
export type CellDataType = 'text' | 'number' | 'date' | 'percentage' | 'currency' | 'category' | 'formula' | 'checkbox'

// Cell format options
export interface CellFormat {
  type: CellDataType
  // Number format options
  decimalPlaces?: number
  useThousandsSeparator?: boolean
  // General unit/scale options (for header display)
  unit?: string // 単位（例: "円", "km", "人"）
  scale?: 'none' | 'thousand' | 'million' | 'billion' // 桁スケール: なし、千、百万、十億
  // Date format options
  dateFormat?: string // e.g., 'YYYY-MM-DD', 'MM/DD/YYYY'
  // Currency format options
  currencySymbol?: string // e.g., '$', '¥', '€'
  currencyScale?: 'none' | 'thousand' | 'million' | 'billion' // 単位: なし、千、百万、十億
  // Percentage format options
  percentageDecimalPlaces?: number
  // Formula type options
  formula?: string // 数式型: 列の数式（例: "prop('売上') * 2"）
}

// Merged cell information
export interface MergedCell {
  row: number
  col: number
  rowSpan: number
  colSpan: number
}

// Table display format (表/グラフ形式) - 19種類
export type TableDisplayFormat = 
  // 基本 (Basic)
  | 'table'          // 表
  | 'bar'            // 棒グラフ
  | 'horizontalBar'  // 横棒グラフ
  | 'line'           // 折れ線グラフ
  | 'area'           // 面グラフ
  // 構成比 (Composition)
  | 'donut'          // ドーナツチャート
  | 'treemap'        // ツリーマップ
  | 'sankey'         // サンキーダイアグラム
  | 'stackedBar'     // 積み上げ棒グラフ
  // 分析 (Analysis)
  | 'waterfall'      // ウォーターフォールチャート
  | 'combo'          // コンボチャート（棒+線）
  | 'heatmap'        // ヒートマップ
  // 金融 (Financial)
  | 'candlestick'    // ローソク足チャート
  // 統計 (Statistical)
  | 'scatter'        // 散布図
  | 'bubble'         // バブルチャート
  | 'boxplot'        // 箱ひげ図
  | 'radar'          // レーダーチャート
  | 'dot'            // ドットチャート
  // 階層 (Hierarchy)
  | 'sunburst'       // サンバーストチャート
  // ランキング (Ranking)
  | 'bump'           // バンプチャート

// グラフカテゴリ
export type GraphCategory = 'all' | 'basic' | 'composition' | 'analysis' | 'hierarchy' | 'financial' | 'statistical'

// チャート入力モード
export type ChartInputMode = 'spreadsheet' | 'tree' | 'map'

// Z軸の用途
export type ZAxisUsage = 'size' | 'color' | 'group'

// 系列の表示タイプ
export type SeriesDisplayType = 'bar' | 'line' | 'area'

// 系列設定
export interface SeriesConfig {
  id: string
  column: number
  displayType: SeriesDisplayType
  showLabel: boolean
  yAxisIndex: number
}

// ============================================
// ツリー入力システム (Tree Input System)
// ============================================

/**
 * ツリーノードのタイプ
 */
export type TreeNodeType = 'income' | 'expense' | 'neutral'

/**
 * ツリーノード
 * サンキー、ツリーマップ、サンバースト用の階層データ
 */
export interface TreeNode {
  id: string
  name: string
  value: number | null  // nullの場合は子の合計から計算
  nodeType: TreeNodeType
  children: TreeNode[]
  expanded?: boolean
}

/**
 * ツリーデータ
 * 収入/支出の二分構造、または単一ツリー
 */
export interface TreeData {
  income: TreeNode
  expense: TreeNode
  centerLabel?: string
}

/**
 * ツリー設定
 */
export interface TreeSettings {
  structure: 'single' | 'income-expense'
  centerLabel: string
  colors: {
    income: string
    expense: string
    neutral: string
  }
  display: {
    showValues: boolean
    showPercentage: boolean
    maxDepth: number
  }
}

/**
 * デフォルトのツリー設定
 */
export const DEFAULT_TREE_SETTINGS: TreeSettings = {
  structure: 'income-expense',
  centerLabel: '収支',
  colors: {
    income: '#10b981',
    expense: '#ef4444',
    neutral: '#6b7280',
  },
  display: {
    showValues: true,
    showPercentage: false,
    maxDepth: 4,
  },
}

/**
 * デフォルトのツリーデータを作成
 */
export const createDefaultTreeData = (): TreeData => ({
  income: {
    id: 'income-root',
    name: '収入',
    value: null,
    nodeType: 'income',
    children: [
      { id: 'income-1', name: '売上', value: 100, nodeType: 'income', children: [] },
    ],
    expanded: true,
  },
  expense: {
    id: 'expense-root',
    name: '支出',
    value: null,
    nodeType: 'expense',
    children: [
      { id: 'expense-1', name: 'コスト', value: 60, nodeType: 'expense', children: [] },
    ],
    expanded: true,
  },
  centerLabel: '収支',
})

// データパターン（グラフタイプごとに必要なデータ構造）
export type DataPattern = 'A' | 'B' | 'B_size' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'

// 積み上げモード
export type StackedMode = 'off' | 'on' | 'percent'

// エラーバータイプ
export type ErrorBarType = 'none' | 'column' | 'stddev' | 'ci95'

// 凡例位置
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'inside'

// Y軸範囲モード
export type YAxisRangeMode = 'auto' | 'custom'

// カラーモード
export type ColorMode = 'tone' | 'custom'

// ============================================
// グラフ軸設定システム (Chart Axis Configuration)
// ============================================

/**
 * X軸のネストカテゴリ
 * カテゴリの階層関係を再帰的に表現
 */
export interface NestedCategory {
  column: number        // カラムインデックス
  child: NestedCategory | null
}

/**
 * 系列の表示タイプ
 */
export type ChartSeriesType = 'bar' | 'line' | 'area'

/**
 * エラーバー設定
 */
export interface ErrorBarConfig {
  type: ErrorBarType
  column?: number  // type === 'column' の場合
}

/**
 * グラフ系列
 * Y軸の各データ系列の設定
 */
export interface ChartSeries {
  id: string
  column: number          // カラムインデックス
  type: ChartSeriesType   // 表示タイプ（棒/線/面）
  color: string           // 系列の色
  smoothing?: boolean     // 線/面の場合のスムージング
  errorBar?: ErrorBarConfig
}

/**
 * 系列スタック
 * 同一スタック内の系列は積み上げ表示される
 */
export type SeriesStack = ChartSeries[]

/**
 * 軸スケール設定
 */
export interface ChartAxisScale {
  min: number | 'auto'
  max: number | 'auto'
}

/**
 * Y軸設定
 * スタック配列と軸パラメータを含む
 */
export interface ChartYAxisConfig {
  stacks: SeriesStack[]
  scale: ChartAxisScale
  unit: string            // 自動推測または手動設定
}

// Chart configuration for table visualization
export interface TableChartConfig {
  // === 基本設定 ===
  xAxisColumn?: number  // X軸に使用する列（デフォルト: 0）
  yAxisColumns?: number[]  // Y軸に使用する列（デフォルト: 1以降全て）
  
  // === パターン別の追加列設定 ===
  // バブルチャート用 (Pattern B+size)
  sizeColumn?: number  // サイズに使用する列
  
  // ローソク足用 (Pattern C: OHLC)
  dateColumn?: number   // 日付列
  openColumn?: number   // 始値列
  highColumn?: number   // 高値列
  lowColumn?: number    // 安値列
  closeColumn?: number  // 終値列
  
  // ヒートマップ用 (Pattern D: Matrix)
  rowLabelColumn?: number  // 行ラベル列
  colLabelColumn?: number  // 列ラベル列（実際には行選択）
  valueColumn?: number     // 値列
  
  // サンキー用 (Pattern E: Flow)
  fromColumn?: number  // From列
  toColumn?: number    // To列
  
  // ツリーマップ用 (Pattern F: Hierarchy) - xAxisColumn, valueColumn使用
  
  // ウォーターフォール用 (Pattern G: Incremental)
  typeColumn?: number  // タイプ列（開始/増加/減少/合計）
  
  // 箱ひげ図用 (Pattern H: Distribution)
  groupColumn?: number  // グループ列
  
  // コンボチャート用 (Pattern I: Composite)
  barColumns?: number[]   // 棒グラフに使用する列
  lineColumns?: number[]  // 折れ線に使用する列
  
  // === グラフ設定 ===
  stacked?: StackedMode  // 積み上げモード
  rightYAxis?: number    // 右Y軸に使用する列
  errorBar?: ErrorBarType  // エラーバータイプ
  errorBarColumn?: number  // エラーバー用の列（column指定時）
  showRegression?: boolean  // 回帰直線を表示（散布図用）
  showR2?: boolean         // R²値を表示（散布図用）
  
  // === カラー設定 ===
  colorMode?: ColorMode  // カラーモード（トーン連動 or カスタム）
  customColors?: Record<number, string>  // カスタム色（列番号 → 色）
  
  // === 表示設定 ===
  showLegend?: boolean  // 凡例を表示するか
  legendPosition?: LegendPosition  // 凡例位置
  legendType?: 'legend' | 'annotation'  // 凡例表示タイプ（通常凡例 or 線上ラベル）
  showGrid?: boolean  // グリッドを表示するか
  showDataLabels?: boolean  // データラベルを表示するか
  
  // === 軸設定 ===
  yAxisUnit?: string           // Y軸の単位（例: "円", "%"）
  yAxisRightUnit?: string      // 右Y軸の単位（2軸グラフ用）
  yAxisRightColumns?: number[]  // 右Y軸に表示する列
  yAxisRange?: YAxisRangeMode  // Y軸範囲モード
  yAxisMin?: number            // Y軸最小値（custom時）
  yAxisMax?: number            // Y軸最大値（custom時）
  logScale?: boolean           // 対数軸
  
  // === 線上ラベル ===
  showLineLabels?: boolean      // 線上にラベルを表示
  lineLabelPosition?: 'start' | 'middle' | 'end'  // ラベル位置
  
  // === 日付フォーマット ===
  xAxisDateFormat?: string      // 日付フォーマット（例: "YY年M月", "MM/DD"）
  
  // === Phase 2: 系列設定 ===
  seriesConfigs?: SeriesConfig[]  // 系列ごとの表示設定
  zColumn?: number                // Z軸に使用する列
  zUsage?: ZAxisUsage             // Z軸の用途
  
  // === Phase 3: 新軸設定システム ===
  xAxisCategory?: NestedCategory       // X軸のネストカテゴリ
  yAxisConfig?: ChartYAxisConfig       // Y軸（左）設定
  y2AxisConfig?: ChartYAxisConfig      // Y2軸（右）設定
  y2AxisEnabled?: boolean              // Y2軸の有効/無効
  smoothLine?: boolean                 // 線のスムージング（レガシー互換）
}

// ソート設定
export interface TableSortConfig {
  column: number
  direction: 'asc' | 'desc'
}

// フィルター条件
export interface TableFilterCondition {
  column: number
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty'
  value?: string
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
  // Tree input data (for sankey, treemap, etc.)
  treeData?: TreeData        // ツリー入力データ
  treeSettings?: TreeSettings  // ツリー設定
  // Sort and filter (Notion-style)
  sortConfig?: TableSortConfig      // ソート設定
  filterConfig?: TableFilterCondition[]  // フィルター条件
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

// ============================================
// ピクト図解システム (Picto Diagram System)
// ============================================

/**
 * ピクト図解のエレメントタイプ
 * ビジネスモデルの関係者を表すシンボル
 */
export type PictoElementType = 
  | 'person'      // ヒト（法人・個人）
  | 'company'     // 会社
  | 'money'       // カネ（価格・売上）
  | 'product'     // モノ（商品・サービス）
  | 'info'        // 情報（データ）
  | 'smartphone'  // スマホ
  | 'store'       // 店舗
  | 'other'       // その他

/**
 * ピクト図解のエレメント（関係者）
 */
export interface PictoElement {
  id: string
  type: PictoElementType
  label: string
  position: { x: number; y: number }
  size?: { width: number; height: number }
}

/**
 * コネクタのフロータイプ（流れの種類）
 * 色で区別される
 */
export type PictoFlowType = 
  | 'product'   // モノの流れ（緑）
  | 'money'     // カネの流れ（黄）
  | 'info'      // 情報の流れ（青）
  | 'relation'  // 関係性（グレー）

/**
 * コネクタの方向
 */
export type PictoConnectorDirection = 'forward' | 'backward' | 'bidirectional'

/**
 * ピクト図解のコネクタ（関係性・矢印）
 */
export interface PictoConnector {
  id: string
  fromElementId: string
  toElementId: string
  flowType: PictoFlowType
  direction: PictoConnectorDirection
  label?: string
  labelPosition?: 'above' | 'below'
}

/**
 * ピクト図解のグループ（囲み線）
 */
export interface PictoGroup {
  id: string
  elementIds: string[]
  label?: string
  color?: string
  style?: 'solid' | 'dashed'
}

/**
 * ピクト図解のコメント（吹き出し）
 */
export interface PictoComment {
  id: string
  text: string
  position: { x: number; y: number }
  style: 'bubble' | 'note'
  targetElementId?: string
}

/**
 * ピクト図解アイテム
 */
export interface PictoItem extends BaseItem {
  type: 'picto'
  elements: PictoElement[]
  connectors: PictoConnector[]
  groups: PictoGroup[]
  comments: PictoComment[]
  canvasSize: { width: number; height: number }
}

// ============================================
// オイラー図システム (Euler Diagram System)
// ============================================

/**
 * オイラー図の円
 * 集合を表す円で、サイズと位置を自由に調整可能
 */
export interface EulerCircle {
  id: string
  label: string
  position: { x: number; y: number }
  radius: number        // 半径（手動調整可能 → 包含関係の表現に使用）
  color: string
}

/**
 * オイラー図の要素
 * 集合内の個別要素（点やラベル付きの点、または文字のみ）を表す
 */
export interface EulerElement {
  id: string
  label: string               // 要素のラベル（例: "a", "1", "りんご"）
  position: { x: number; y: number }
  shape: 'dot' | 'label' | 'text'  // dot: 点のみ, label: 点+ラベル, text: 文字のみ
  color?: string              // 色（省略時は黒）
}

/**
 * オイラー図アイテム
 * 円の数は無制限で、包含関係や集合の重なりを自由に表現できる
 */
export interface EulerItem extends BaseItem {
  type: 'euler'
  circles: EulerCircle[]      // 無制限（自由に追加可能）
  elements: EulerElement[]    // 集合内の要素
  canvasSize: { width: number; height: number }
}

// 新しいアイテム（プレースホルダー）
export interface NewItem extends BaseItem {
  type: 'new'
}

export type Item = TableItem | ImageItem | TextItem | SlideItem | PictoItem | EulerItem | NewItem

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

