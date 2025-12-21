import type { ImpressionCode, ColorPalette, TonmanaBiome } from '../types'

// ============================================
// カラー候補の型定義
// ============================================

export interface ColorCandidate {
  id: string
  color: string  // HEX形式
  name?: string
  isFromBiome?: boolean  // バイオームから派生したか
}

// ============================================
// 色相定義（Hue definitions）
// ============================================

interface HueDefinition {
  id: string
  name: string
  nameEn: string
  hue: number  // 0-360
}

const hueDefinitions: HueDefinition[] = [
  { id: 'blue', name: 'ブルー系', nameEn: 'Blue', hue: 220 },
  { id: 'teal', name: 'ティール系', nameEn: 'Teal', hue: 180 },
  { id: 'green', name: 'グリーン系', nameEn: 'Green', hue: 140 },
  { id: 'purple', name: 'パープル系', nameEn: 'Purple', hue: 270 },
  { id: 'pink', name: 'ピンク系', nameEn: 'Pink', hue: 340 },
  { id: 'orange', name: 'オレンジ系', nameEn: 'Orange', hue: 25 },
  { id: 'gold', name: 'ゴールド系', nameEn: 'Gold', hue: 45 },
  { id: 'red', name: 'レッド系', nameEn: 'Red', hue: 0 },
]

// ============================================
// HSL ↔ HEX 変換ユーティリティ
// ============================================

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// ============================================
// Tone & Mannerからトーン（明度・彩度）を決定
// ============================================

interface ToneParams {
  primarySaturation: number   // メインカラーの彩度 (0-100)
  primaryLightness: number    // メインカラーの明度 (0-100)
  backgroundLightness: number // 背景の明度 (0-100)
  accentSaturation: number    // アクセントの彩度 (0-100)
  accentLightness: number     // アクセントの明度 (0-100)
  isDark: boolean             // ダークモードか
}

function getToneParams(code: ImpressionCode): ToneParams {
  const { energy, formality, decoration } = code
  
  // 正規化 (1-5 → 0-1)
  const energyRatio = (energy - 1) / 4
  const formalityRatio = (formality - 1) / 4
  const decorationRatio = (decoration - 1) / 4
  
  // ダークモード判定: 格式が高く装飾性が低い場合
  const isDark = formalityRatio > 0.7 && decorationRatio < 0.3
  
  // 彩度: エネルギーと装飾性で決定
  // 高エネルギー・高装飾 → 高彩度
  const baseSaturation = 40 + (energyRatio * 25) + (decorationRatio * 20)
  const primarySaturation = Math.min(85, baseSaturation)
  const accentSaturation = Math.min(90, baseSaturation + 10)
  
  // 明度: 格式とエネルギーで決定
  let primaryLightness: number
  let backgroundLightness: number
  let accentLightness: number
  
  if (isDark) {
    // ダークモード
    primaryLightness = 55 + (energyRatio * 10)
    backgroundLightness = 10 + (energyRatio * 5)
    accentLightness = 50 + (energyRatio * 10)
  } else {
    // ライトモード
    // 高エネルギー → やや明るめ、低エネルギー → 落ち着いた明度
    primaryLightness = 35 + (energyRatio * 15) - (formalityRatio * 5)
    backgroundLightness = 96 - (formalityRatio * 3)
    accentLightness = 45 + (energyRatio * 10)
  }
  
  return {
    primarySaturation,
    primaryLightness,
    backgroundLightness,
    accentSaturation,
    accentLightness,
    isDark,
  }
}

// ============================================
// Tone & Mannerに適した色相を選択
// ============================================

function getRecommendedHues(code: ImpressionCode): HueDefinition[] {
  const { energy, formality, classicModern } = code
  
  // 正規化
  const energyRatio = (energy - 1) / 4
  const formalityRatio = (formality - 1) / 4
  const classicModernRatio = (classicModern - 1) / 4
  
  // スコアリングで色相を選択
  const scored = hueDefinitions.map(hue => {
    let score = 0
    
    // エネルギー軸との相性
    if (energyRatio > 0.6) {
      // 高エネルギー → 暖色系、ピンク、オレンジ
      if (['pink', 'orange', 'red', 'gold'].includes(hue.id)) score += 2
    } else if (energyRatio < 0.4) {
      // 低エネルギー → 寒色系、ブルー、ティール
      if (['blue', 'teal', 'purple'].includes(hue.id)) score += 2
    }
    
    // 格式軸との相性
    if (formalityRatio > 0.6) {
      // 格式高い → ブルー、パープル、ゴールド
      if (['blue', 'purple', 'gold'].includes(hue.id)) score += 2
    } else if (formalityRatio < 0.4) {
      // 親しみやすい → グリーン、ピンク、オレンジ
      if (['green', 'pink', 'orange', 'teal'].includes(hue.id)) score += 2
    }
    
    // 時代感軸との相性
    if (classicModernRatio > 0.6) {
      // 現代的 → ティール、ブルー、パープル
      if (['teal', 'blue', 'purple'].includes(hue.id)) score += 1
    } else if (classicModernRatio < 0.4) {
      // 伝統的 → ゴールド、レッド、グリーン
      if (['gold', 'red', 'green'].includes(hue.id)) score += 1
    }
    
    return { hue, score }
  })
  
  // スコア順でソートし、上位4つを返す
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 4).map(s => s.hue)
}

// ============================================
// パレット候補を生成
// ============================================

/**
 * Tone & Mannerからカラーパレット候補を生成
 * @param code 印象コード
 * @returns 4つのカラーパレット候補
 */
export function generatePaletteCandidates(code: ImpressionCode): ColorPalette[] {
  const toneParams = getToneParams(code)
  const recommendedHues = getRecommendedHues(code)
  
  return recommendedHues.map(hueDef => {
    const { hue } = hueDef
    
    // メインカラー
    const primary = hslToHex(
      hue,
      toneParams.primarySaturation,
      toneParams.primaryLightness
    )
    
    // 背景色（色相を少しずらして統一感を出す）
    const bgHue = toneParams.isDark ? hue : (hue + 30) % 360
    const background = hslToHex(
      bgHue,
      toneParams.isDark ? 15 : 5,
      toneParams.backgroundLightness
    )
    
    // アクセントカラー（補色方向に少しずらす）
    const accentHue = (hue + 30) % 360
    const accent = hslToHex(
      accentHue,
      toneParams.accentSaturation,
      toneParams.accentLightness
    )
    
    // テキスト色
    const text = toneParams.isDark ? '#f5f5f5' : '#1f2937'
    
    return {
      id: hueDef.id,
      name: hueDef.name,
      nameEn: hueDef.nameEn,
      primary,
      background,
      accent,
      text,
    }
  })
}

/**
 * 特定の色相でパレットを生成（カスタム用）
 */
export function generatePaletteForHue(
  code: ImpressionCode,
  hue: number
): Omit<ColorPalette, 'id' | 'name' | 'nameEn'> {
  const toneParams = getToneParams(code)
  
  const primary = hslToHex(hue, toneParams.primarySaturation, toneParams.primaryLightness)
  const bgHue = toneParams.isDark ? hue : (hue + 30) % 360
  const background = hslToHex(bgHue, toneParams.isDark ? 15 : 5, toneParams.backgroundLightness)
  const accentHue = (hue + 30) % 360
  const accent = hslToHex(accentHue, toneParams.accentSaturation, toneParams.accentLightness)
  const text = toneParams.isDark ? '#f5f5f5' : '#1f2937'
  
  return { primary, background, accent, text }
}

// ============================================
// OKLCH → HEX 変換ユーティリティ
// ============================================

/**
 * OKLCH文字列からHEX色に変換
 * 対応形式: "oklch(L C H)" または "oklch(L C H / A)"
 * グラデーションの場合は最初の色を抽出
 */
export function oklchToHex(oklchString: string): string {
  // グラデーションの場合は最初のoklch()を抽出
  if (oklchString.includes('linear-gradient') || oklchString.includes('radial-gradient')) {
    const match = oklchString.match(/oklch\([^)]+\)/)
    if (match) {
      oklchString = match[0]
    } else {
      return '#888888'  // フォールバック
    }
  }
  
  // oklch(L C H) または oklch(L C H / A) をパース
  const match = oklchString.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!match) {
    return '#888888'  // フォールバック
  }
  
  const L = parseFloat(match[1])
  const C = parseFloat(match[2])
  const H = parseFloat(match[3])
  
  // OKLCH → OKLab
  const a = C * Math.cos(H * Math.PI / 180)
  const b = C * Math.sin(H * Math.PI / 180)
  
  // OKLab → Linear RGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let bVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  
  // Clamp and gamma correct
  const toSRGB = (x: number) => {
    x = Math.max(0, Math.min(1, x))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }
  
  r = toSRGB(r)
  g = toSRGB(g)
  bVal = toSRGB(bVal)
  
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`
}

/**
 * HEX → HSL 変換
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // #RGB → #RRGGBB
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }
  
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 }
}

// ============================================
// バイオームベースのカラー候補生成
// ============================================

/**
 * 汎用カラーパレット（メインカラー候補用）
 */
const GENERAL_MAIN_COLORS: ColorCandidate[] = [
  { id: 'blue-500', color: '#3b82f6', name: 'ブルー' },
  { id: 'teal-500', color: '#14b8a6', name: 'ティール' },
  { id: 'green-500', color: '#22c55e', name: 'グリーン' },
  { id: 'purple-500', color: '#a855f7', name: 'パープル' },
  { id: 'pink-500', color: '#ec4899', name: 'ピンク' },
  { id: 'orange-500', color: '#f97316', name: 'オレンジ' },
  { id: 'amber-500', color: '#f59e0b', name: 'アンバー' },
  { id: 'red-500', color: '#ef4444', name: 'レッド' },
]

/**
 * バイオームからメインカラー候補を生成
 * バイオームのスタイルから派生した色 + 汎用パレット
 */
export function generateMainColorCandidates(biome: TonmanaBiome | null): ColorCandidate[] {
  const candidates: ColorCandidate[] = []
  
  if (biome) {
    // バイオームのheadingColorから派生
    const headingHex = oklchToHex(biome.style.headingColor)
    const headingHsl = hexToHsl(headingHex)
    
    // オリジナル
    candidates.push({
      id: 'biome-heading',
      color: headingHex,
      name: 'バイオーム基準',
      isFromBiome: true,
    })
    
    // 明度バリエーション
    candidates.push({
      id: 'biome-heading-light',
      color: hslToHex(headingHsl.h, headingHsl.s, Math.min(70, headingHsl.l + 15)),
      name: '明るめ',
      isFromBiome: true,
    })
    
    candidates.push({
      id: 'biome-heading-dark',
      color: hslToHex(headingHsl.h, headingHsl.s, Math.max(25, headingHsl.l - 15)),
      name: '暗め',
      isFromBiome: true,
    })
    
    // 彩度バリエーション
    candidates.push({
      id: 'biome-heading-vivid',
      color: hslToHex(headingHsl.h, Math.min(100, headingHsl.s + 20), headingHsl.l),
      name: '鮮やか',
      isFromBiome: true,
    })
  }
  
  // 汎用パレットを追加
  candidates.push(...GENERAL_MAIN_COLORS)
  
  return candidates
}

/**
 * メインカラーに調和する背景色候補を生成
 */
export function generateBackgroundCandidates(
  mainColor: string,
  biome: TonmanaBiome | null
): ColorCandidate[] {
  const candidates: ColorCandidate[] = []
  const mainHsl = hexToHsl(mainColor)
  
  // バイオームからの背景色
  if (biome) {
    const bgNormalHex = oklchToHex(biome.style.bgNormal)
    candidates.push({
      id: 'biome-bg-normal',
      color: bgNormalHex,
      name: 'バイオーム基準',
      isFromBiome: true,
    })
    
    // カバー背景も候補に
    const bgCoverHex = oklchToHex(biome.style.bgCover)
    candidates.push({
      id: 'biome-bg-cover',
      color: bgCoverHex,
      name: 'カバー用',
      isFromBiome: true,
    })
  }
  
  // メインカラーの色相を使った調和色
  // ライト系
  candidates.push({
    id: 'harmony-light-1',
    color: hslToHex(mainHsl.h, 8, 97),
    name: 'ほぼ白',
  })
  
  candidates.push({
    id: 'harmony-light-2',
    color: hslToHex(mainHsl.h, 12, 95),
    name: '薄い同系色',
  })
  
  candidates.push({
    id: 'harmony-light-3',
    color: hslToHex(mainHsl.h, 20, 92),
    name: '淡い同系色',
  })
  
  // ダーク系
  candidates.push({
    id: 'harmony-dark-1',
    color: hslToHex(mainHsl.h, 10, 15),
    name: 'ダーク',
  })
  
  candidates.push({
    id: 'harmony-dark-2',
    color: hslToHex(mainHsl.h, 15, 10),
    name: '深いダーク',
  })
  
  // ニュートラル
  candidates.push({
    id: 'neutral-white',
    color: '#ffffff',
    name: '純白',
  })
  
  candidates.push({
    id: 'neutral-gray',
    color: '#f8fafc',
    name: 'オフホワイト',
  })
  
  candidates.push({
    id: 'neutral-dark',
    color: '#1f2937',
    name: 'ダークグレー',
  })
  
  return candidates
}

/**
 * メインカラーと背景色に合う見出し色候補を生成
 */
export function generateHeadingColorCandidates(
  mainColor: string,
  backgroundColor: string,
  biome: TonmanaBiome | null
): ColorCandidate[] {
  const candidates: ColorCandidate[] = []
  const mainHsl = hexToHsl(mainColor)
  const bgHsl = hexToHsl(backgroundColor)
  
  // 背景が暗いかライトかを判定
  const isDarkBg = bgHsl.l < 50
  
  // バイオームからの見出し色
  if (biome) {
    const headingHex = oklchToHex(biome.style.headingColor)
    candidates.push({
      id: 'biome-heading',
      color: headingHex,
      name: 'バイオーム基準',
      isFromBiome: true,
    })
  }
  
  // メインカラーをそのまま
  candidates.push({
    id: 'main-color',
    color: mainColor,
    name: 'メインカラー',
  })
  
  // メインカラーのバリエーション
  if (isDarkBg) {
    // 暗い背景の場合は明るめの色
    candidates.push({
      id: 'main-light',
      color: hslToHex(mainHsl.h, mainHsl.s, Math.min(85, mainHsl.l + 25)),
      name: '明るめ',
    })
    
    candidates.push({
      id: 'main-vivid',
      color: hslToHex(mainHsl.h, Math.min(100, mainHsl.s + 15), 70),
      name: '鮮やか',
    })
    
    candidates.push({
      id: 'white',
      color: '#ffffff',
      name: '白',
    })
    
    candidates.push({
      id: 'light-gray',
      color: '#f1f5f9',
      name: 'ライトグレー',
    })
  } else {
    // 明るい背景の場合は暗めの色
    candidates.push({
      id: 'main-dark',
      color: hslToHex(mainHsl.h, mainHsl.s, Math.max(20, mainHsl.l - 20)),
      name: '暗め',
    })
    
    candidates.push({
      id: 'main-deep',
      color: hslToHex(mainHsl.h, Math.min(100, mainHsl.s + 10), Math.max(25, mainHsl.l - 10)),
      name: '深め',
    })
    
    candidates.push({
      id: 'dark-gray',
      color: '#1f2937',
      name: 'ダークグレー',
    })
    
    candidates.push({
      id: 'black',
      color: '#111827',
      name: '黒',
    })
  }
  
  // 補色方向の色（アクセント用）
  const complementHue = (mainHsl.h + 180) % 360
  candidates.push({
    id: 'complement',
    color: hslToHex(complementHue, mainHsl.s, isDarkBg ? 65 : 40),
    name: '補色',
  })
  
  // 類似色
  const analogousHue = (mainHsl.h + 30) % 360
  candidates.push({
    id: 'analogous',
    color: hslToHex(analogousHue, mainHsl.s, isDarkBg ? 65 : 40),
    name: '類似色',
  })
  
  return candidates
}
