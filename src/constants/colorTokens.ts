// ============================================
// OKLCH Color Token System
// ============================================
// 上品でニュートラルなカラーパターン
// スライドのトンマナ（tonmanaBiomes.ts）とは独立して管理

/**
 * プリミティブカラートークン
 * 色相ベースの生の色定義（OKLCH形式）
 * 控えめで上品なトーン
 */
export const primitiveColors = {
  // グレースケール（クールニュートラル）
  gray: {
    25: 'oklch(0.988 0.001 270)',
    50: 'oklch(0.980 0.002 270)',
    100: 'oklch(0.968 0.002 270)',
    150: 'oklch(0.955 0.003 270)',
    200: 'oklch(0.932 0.003 270)',
    300: 'oklch(0.870 0.005 270)',
    400: 'oklch(0.680 0.008 270)',
    500: 'oklch(0.540 0.008 270)',
    600: 'oklch(0.440 0.006 270)',
    700: 'oklch(0.370 0.005 270)',
    800: 'oklch(0.290 0.004 270)',
    850: 'oklch(0.250 0.003 270)',
    900: 'oklch(0.215 0.003 270)',
    925: 'oklch(0.190 0.002 270)',
    950: 'oklch(0.170 0.002 270)',
    975: 'oklch(0.155 0.001 270)',
    1000: 'oklch(0.135 0.001 270)',
  },

  // サンド/トープ系（メインアクセント - 控えめで上品）
  sand: {
    50: 'oklch(0.970 0.008 70)',
    100: 'oklch(0.955 0.012 70)',
    200: 'oklch(0.920 0.020 70)',
    300: 'oklch(0.870 0.030 70)',
    400: 'oklch(0.780 0.045 70)',
    500: 'oklch(0.720 0.050 70)',
    600: 'oklch(0.660 0.048 70)',
    700: 'oklch(0.600 0.042 70)',
    800: 'oklch(0.540 0.036 70)',
    900: 'oklch(0.480 0.030 70)',
  },

  // ストーン系（ハイライト - 落ち着いた強調）
  stone: {
    50: 'oklch(0.965 0.006 60)',
    100: 'oklch(0.945 0.010 60)',
    200: 'oklch(0.900 0.018 60)',
    300: 'oklch(0.850 0.028 60)',
    400: 'oklch(0.780 0.040 60)',
    500: 'oklch(0.720 0.045 60)',
    600: 'oklch(0.660 0.042 60)',
    700: 'oklch(0.600 0.038 60)',
    800: 'oklch(0.540 0.032 60)',
    900: 'oklch(0.480 0.026 60)',
  },

  // アンバー系（警告）
  amber: {
    300: 'oklch(0.850 0.080 75)',
    400: 'oklch(0.800 0.095 75)',
    500: 'oklch(0.750 0.100 75)',
  },

  // セマンティックカラー
  green: {
    400: 'oklch(0.720 0.120 155)',
    500: 'oklch(0.660 0.140 155)',
    600: 'oklch(0.600 0.130 155)',
  },

  red: {
    400: 'oklch(0.660 0.160 25)',
    500: 'oklch(0.600 0.175 25)',
    600: 'oklch(0.540 0.165 25)',
    900: 'oklch(0.340 0.100 25)',
    950: 'oklch(0.270 0.070 25)',
  },

  blue: {
    300: 'oklch(0.740 0.090 240)',
    400: 'oklch(0.660 0.115 240)',
    500: 'oklch(0.580 0.140 240)',
  },

  purple: {
    400: 'oklch(0.630 0.160 295)',
    500: 'oklch(0.560 0.175 295)',
  },

  // シンタックスハイライト用
  syntax: {
    yellow: 'oklch(0.820 0.070 70)',
    purple: 'oklch(0.680 0.140 295)',
    orange: 'oklch(0.730 0.090 55)',
    green: 'oklch(0.720 0.110 155)',
  },
} as const

/**
 * セマンティックカラートークン（テーマ別）
 */
export const semanticColors = {
  light: {
    // 背景
    bgPrimary: 'var(--color-gray-50)',
    bgSecondary: 'var(--color-gray-100)',
    bgTertiary: 'var(--color-gray-150)',
    bgElevated: 'var(--color-gray-25)',
    
    // テキスト
    textPrimary: 'var(--color-gray-900)',
    textSecondary: 'var(--color-gray-600)',
    textMuted: 'var(--color-gray-500)',
    textDisabled: 'var(--color-gray-400)',
    
    // ボーダー
    borderPrimary: 'var(--color-gray-200)',
    borderSecondary: 'var(--color-gray-300)',
    borderHover: 'var(--color-gray-400)',
    
    // アクセント（サンド系）
    accent: 'var(--color-sand-600)',
    accentLight: 'var(--color-sand-200)',
    accentHover: 'var(--color-sand-500)',
    
    // ハイライト（ストーン系）
    highlight: 'var(--color-stone-600)',
    
    // セマンティック
    success: 'var(--color-green-600)',
    error: 'var(--color-red-600)',
    warning: 'var(--color-amber-500)',
    info: 'var(--color-blue-500)',
  },
  
  dark: {
    // 背景
    bgPrimary: 'var(--color-gray-950)',
    bgSecondary: 'var(--color-gray-925)',
    bgTertiary: 'var(--color-gray-900)',
    bgElevated: 'var(--color-gray-850)',
    bgDeep: 'var(--color-gray-1000)',
    
    // テキスト
    textPrimary: 'var(--color-gray-100)',
    textSecondary: 'var(--color-gray-400)',
    textMuted: 'var(--color-gray-500)',
    textDisabled: 'var(--color-gray-600)',
    
    // ボーダー
    borderPrimary: 'var(--color-gray-850)',
    borderSecondary: 'var(--color-gray-800)',
    borderHover: 'var(--color-gray-700)',
    
    // アクセント（サンド系）
    accent: 'var(--color-sand-500)',
    accentLight: 'var(--color-sand-200)',
    accentHover: 'var(--color-sand-400)',
    
    // ハイライト（ストーン系）
    highlight: 'var(--color-stone-400)',
    
    // セマンティック
    success: 'var(--color-green-400)',
    error: 'var(--color-red-400)',
    warning: 'var(--color-amber-400)',
    info: 'var(--color-blue-400)',
  },
} as const

/**
 * カラートークンをCSS変数形式に変換
 */
export function generateCSSVariables(): string {
  const lines: string[] = []
  
  for (const [colorName, shades] of Object.entries(primitiveColors)) {
    if (typeof shades === 'object') {
      for (const [shade, value] of Object.entries(shades)) {
        lines.push(`  --color-${colorName}-${shade}: ${value};`)
      }
    }
  }
  
  return lines.join('\n')
}

export type ThemeMode = 'light' | 'dark'
