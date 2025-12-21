/**
 * オイラー図の設定
 */

/**
 * デフォルトのキャンバスサイズ
 */
export const DEFAULT_EULER_CANVAS_SIZE = {
  width: 800,
  height: 500
}

/**
 * デフォルトの円の半径
 */
export const DEFAULT_CIRCLE_RADIUS = 80

/**
 * 最小の円の半径
 */
export const MIN_CIRCLE_RADIUS = 30

/**
 * 最大の円の半径
 */
export const MAX_CIRCLE_RADIUS = 200

/**
 * グリッドサイズ（スナップ用）
 */
export const EULER_GRID_SIZE = 10

/**
 * 円の色パレット
 * 追加順に循環して使用される
 */
export const EULER_COLOR_PALETTE = [
  '#4CAF50',  // Green
  '#2196F3',  // Blue
  '#FF9800',  // Orange
  '#9C27B0',  // Purple
  '#F44336',  // Red
  '#00BCD4',  // Cyan
  '#FFEB3B',  // Yellow
  '#E91E63',  // Pink
  '#795548',  // Brown
  '#607D8B',  // Blue Grey
]

/**
 * 円の塗りつぶしの透明度
 */
export const CIRCLE_FILL_OPACITY = 0.3

/**
 * 円の境界線の幅
 */
export const CIRCLE_STROKE_WIDTH = 2

/**
 * ラベルのフォントサイズ
 */
export const LABEL_FONT_SIZE = 14

/**
 * リサイズハンドルのサイズ
 */
export const RESIZE_HANDLE_SIZE = 8

/**
 * Z-index順序
 */
export const EULER_Z_INDEX = {
  GRID: 0,
  CIRCLE: 10,
  LABEL: 20,
  RESIZE_HANDLE: 30,
  DRAG_PREVIEW: 100
}
