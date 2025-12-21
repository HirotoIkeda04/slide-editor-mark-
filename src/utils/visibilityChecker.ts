/**
 * Tone & Manner視認性チェッカー
 * APCA（Accessible Perceptual Contrast Algorithm）のLc基準に基づいて色の視認性をチェックする
 */

import { tonmanaBiomes } from '../constants/tonmanaBiomes'
import type { TonmanaBiome, TonmanaRank } from '../types'
import { extractFirstColor } from './impressionStyle'

// ============================================
// 型定義
// ============================================

interface ContrastCheckResult {
  lc: number           // APCA Lc値（絶対値）- 通常視覚
  lcProtan: number     // P型でのLc
  lcDeutan: number     // D型でのLc
  passed: boolean
  required: number     // 必要なLc値
  label: string
}

interface VisibilityResult {
  biomeId: string
  biomeName: string
  checks: ContrastCheckResult[]
  allPassed: boolean
}

// ============================================
// 色変換ユーティリティ
// ============================================

/**
 * oklch文字列をRGB値（0-1）に変換
 */
function oklchToRGB(oklchStr: string): { r: number; g: number; b: number } {
  const match = oklchStr.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) {
    return { r: 0.5, g: 0.5, b: 0.5 } // フォールバック
  }

  const l = parseFloat(match[1])
  const c = parseFloat(match[2])
  const h = parseFloat(match[3])

  // oklch → oklab
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)

  // oklab → linear sRGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3

  // linear sRGB → sRGB
  const toSRGB = (x: number) => {
    if (x <= 0.0031308) {
      return x * 12.92
    }
    return 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }

  r = Math.max(0, Math.min(1, toSRGB(r)))
  g = Math.max(0, Math.min(1, toSRGB(g)))
  bl = Math.max(0, Math.min(1, toSRGB(bl)))

  return { r, g, b: bl }
}

/**
 * hex文字列をRGB値（0-1）に変換
 */
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const match = hex.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
  if (!match) {
    return { r: 0.5, g: 0.5, b: 0.5 }
  }

  return {
    r: parseInt(match[1], 16) / 255,
    g: parseInt(match[2], 16) / 255,
    b: parseInt(match[3], 16) / 255,
  }
}

/**
 * 色文字列をRGB値に変換（oklch, hex対応）
 */
function colorToRGB(colorStr: string): { r: number; g: number; b: number } {
  // グラデーションの場合は最初の色を使用
  const color = extractFirstColor(colorStr)

  if (color.startsWith('oklch(')) {
    return oklchToRGB(color)
  } else if (color.startsWith('#')) {
    return hexToRGB(color)
  }

  // フォールバック
  return { r: 0.5, g: 0.5, b: 0.5 }
}

// ============================================
// 色覚シミュレーション（Machado 2009法）
// P型（赤色覚異常）とD型（緑色覚異常）をシミュレート
// ============================================

type CVDType = 'normal' | 'protan' | 'deutan'

/**
 * sRGB → リニアRGB変換
 */
function toLinearRGB(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * リニアRGB → sRGB変換
 */
function toGammaRGB(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// Machado 2009法によるシミュレーション行列（完全型）
// 出典: https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html

// P型（Protanopia）- 完全型
const PROTAN_MATRIX = [
  [0.152286, 1.052583, -0.204868],
  [0.114503, 0.786281, 0.099216],
  [-0.003882, -0.048116, 1.051998],
]

// D型（Deuteranopia）- 完全型
const DEUTAN_MATRIX = [
  [0.367322, 0.860646, -0.227968],
  [0.280085, 0.672501, 0.047414],
  [-0.01182, 0.04294, 0.968881],
]

/**
 * 行列を適用して色覚シミュレーションを実行
 */
function applyColorMatrix(
  matrix: number[][],
  r: number,
  g: number,
  b: number
): { r: number; g: number; b: number } {
  const linR = toLinearRGB(r)
  const linG = toLinearRGB(g)
  const linB = toLinearRGB(b)

  const newR = matrix[0][0] * linR + matrix[0][1] * linG + matrix[0][2] * linB
  const newG = matrix[1][0] * linR + matrix[1][1] * linG + matrix[1][2] * linB
  const newB = matrix[2][0] * linR + matrix[2][1] * linG + matrix[2][2] * linB

  return {
    r: Math.max(0, Math.min(1, toGammaRGB(newR))),
    g: Math.max(0, Math.min(1, toGammaRGB(newG))),
    b: Math.max(0, Math.min(1, toGammaRGB(newB))),
  }
}

/**
 * 色覚シミュレーションを適用
 */
function simulateCVD(
  rgb: { r: number; g: number; b: number },
  cvdType: CVDType
): { r: number; g: number; b: number } {
  switch (cvdType) {
    case 'protan':
      return applyColorMatrix(PROTAN_MATRIX, rgb.r, rgb.g, rgb.b)
    case 'deutan':
      return applyColorMatrix(DEUTAN_MATRIX, rgb.r, rgb.g, rgb.b)
    default:
      return rgb
  }
}

// ============================================
// APCA Lc計算（Accessible Perceptual Contrast Algorithm）
// ============================================

// APCA-W3 係数
const APCA_Rco = 0.2126729
const APCA_Gco = 0.7151522
const APCA_Bco = 0.0721750

// APCA指数とスケーリング
const normBG = 0.56
const normTXT = 0.57
const revBG = 0.65
const revTXT = 0.62
const scaleBoW = 1.14
const scaleBG = 1.14
const loBoWoffset = 0.027
const loBoWthresh = 0.035
const loClip = 0.001
const deltaYmin = 0.0005

/**
 * sRGB値（0-1）からAPCA用のY（輝度）を計算
 * ガンマ2.4を使用
 */
function sRGBtoY(r: number, g: number, b: number): number {
  // sRGB → リニアRGB（ガンマ2.4）
  const toLinear = (c: number) => Math.pow(Math.max(0, c), 2.4)

  return APCA_Rco * toLinear(r) + APCA_Gco * toLinear(g) + APCA_Bco * toLinear(b)
}

/**
 * APCA Lc（Lightness Contrast）を計算
 * テキスト色と背景色からコントラスト値を算出
 * 戻り値: -108 〜 +108 の範囲（正=明るい背景、負=暗い背景）
 */
export function calculateAPCALc(textColor: string, bgColor: string): number {
  const txtRGB = colorToRGB(textColor)
  const bgRGB = colorToRGB(bgColor)

  const Ytxt = sRGBtoY(txtRGB.r, txtRGB.g, txtRGB.b)
  const Ybg = sRGBtoY(bgRGB.r, bgRGB.g, bgRGB.b)

  // 最小差チェック
  if (Math.abs(Ybg - Ytxt) < deltaYmin) {
    return 0
  }

  let SAPC = 0

  // 明るい背景（通常極性）
  if (Ybg > Ytxt) {
    SAPC = (Math.pow(Ybg, normBG) - Math.pow(Ytxt, normTXT)) * scaleBoW

    // ローコントラストクランプ
    if (SAPC < loClip) {
      return 0
    } else if (SAPC < loBoWthresh) {
      SAPC = SAPC - SAPC * loBoWoffset
    } else {
      SAPC = SAPC - loBoWoffset
    }
  }
  // 暗い背景（逆極性）
  else {
    SAPC = (Math.pow(Ybg, revBG) - Math.pow(Ytxt, revTXT)) * scaleBG

    // ローコントラストクランプ（負の値）
    if (SAPC > -loClip) {
      return 0
    } else if (SAPC > -loBoWthresh) {
      SAPC = SAPC - SAPC * loBoWoffset
    } else {
      SAPC = SAPC + loBoWoffset
    }
  }

  // Lc値に変換（100倍スケール）
  return SAPC * 100
}

/**
 * RGB値から直接APCA Lcを計算
 */
function calculateAPCALcFromRGB(
  txtRGB: { r: number; g: number; b: number },
  bgRGB: { r: number; g: number; b: number }
): number {
  const Ytxt = sRGBtoY(txtRGB.r, txtRGB.g, txtRGB.b)
  const Ybg = sRGBtoY(bgRGB.r, bgRGB.g, bgRGB.b)

  if (Math.abs(Ybg - Ytxt) < deltaYmin) {
    return 0
  }

  let SAPC = 0

  if (Ybg > Ytxt) {
    SAPC = (Math.pow(Ybg, normBG) - Math.pow(Ytxt, normTXT)) * scaleBoW
    if (SAPC < loClip) {
      return 0
    } else if (SAPC < loBoWthresh) {
      SAPC = SAPC - SAPC * loBoWoffset
    } else {
      SAPC = SAPC - loBoWoffset
    }
  } else {
    SAPC = (Math.pow(Ybg, revBG) - Math.pow(Ytxt, revTXT)) * scaleBG
    if (SAPC > -loClip) {
      return 0
    } else if (SAPC > -loBoWthresh) {
      SAPC = SAPC - SAPC * loBoWoffset
    } else {
      SAPC = SAPC + loBoWoffset
    }
  }

  return SAPC * 100
}

/**
 * 色覚シミュレーションを適用したAPCA Lcを計算
 */
function calculateAPCALcWithCVD(textColor: string, bgColor: string, cvdType: CVDType): number {
  const txtRGB = colorToRGB(textColor)
  const bgRGB = colorToRGB(bgColor)

  const simTxt = simulateCVD(txtRGB, cvdType)
  const simBg = simulateCVD(bgRGB, cvdType)

  return calculateAPCALcFromRGB(simTxt, simBg)
}

// ============================================
// Tone & Manner視認性チェック
// ============================================

/**
 * 単一のTone & Mannerの視認性をチェック
 * APCA Lc基準: 本文 Lc 90、見出し Lc 75、表紙 Lc 75
 * P型/D型色覚でのLc値も計算
 */
export function checkTonmanaVisibility(biome: TonmanaBiome): VisibilityResult {
  const { style } = biome
  const checks: ContrastCheckResult[] = []

  // textColor vs bgNormal（本文テキスト: Lc 90必要）
  const textLc = Math.abs(calculateAPCALc(style.textColor, style.bgNormal))
  const textLcP = Math.abs(calculateAPCALcWithCVD(style.textColor, style.bgNormal, 'protan'))
  const textLcD = Math.abs(calculateAPCALcWithCVD(style.textColor, style.bgNormal, 'deutan'))
  checks.push({
    lc: textLc,
    lcProtan: textLcP,
    lcDeutan: textLcD,
    passed: textLc >= 90,
    required: 90,
    label: 'textColor vs bgNormal',
  })

  // headingColor vs bgNormal（見出し: Lc 75必要）
  const headingLc = Math.abs(calculateAPCALc(style.headingColor, style.bgNormal))
  const headingLcP = Math.abs(calculateAPCALcWithCVD(style.headingColor, style.bgNormal, 'protan'))
  const headingLcD = Math.abs(calculateAPCALcWithCVD(style.headingColor, style.bgNormal, 'deutan'))
  checks.push({
    lc: headingLc,
    lcProtan: headingLcP,
    lcDeutan: headingLcD,
    passed: headingLc >= 75,
    required: 75,
    label: 'headingColor vs bgNormal',
  })

  // 表紙での白テキスト vs bgCover（表紙: Lc 75必要）
  const coverLc = Math.abs(calculateAPCALc('oklch(1.00 0 0)', style.bgCover))
  const coverLcP = Math.abs(calculateAPCALcWithCVD('oklch(1.00 0 0)', style.bgCover, 'protan'))
  const coverLcD = Math.abs(calculateAPCALcWithCVD('oklch(1.00 0 0)', style.bgCover, 'deutan'))
  checks.push({
    lc: coverLc,
    lcProtan: coverLcP,
    lcDeutan: coverLcD,
    passed: coverLc >= 75,
    required: 75,
    label: 'white vs bgCover',
  })

  return {
    biomeId: biome.id,
    biomeName: biome.name,
    checks,
    allPassed: checks.every((c) => c.passed),
  }
}

/**
 * トンマナの格付けを計算
 * APCA Lc基準に基づいてS/A/Bのランクを返す
 * 通常視覚 + P型 + D型の全てで基準を満たす必要がある
 */
export function getTonmanaRank(biome: TonmanaBiome): TonmanaRank {
  const { style } = biome
  const cvdTypes: CVDType[] = ['normal', 'protan', 'deutan']

  // 各色覚タイプでの最小Lc値を取得（最も厳しいケースで評価）
  let minTextLc = Infinity
  let minHeadingLc = Infinity
  let minCoverLc = Infinity

  for (const cvd of cvdTypes) {
    minTextLc = Math.min(minTextLc, Math.abs(calculateAPCALcWithCVD(style.textColor, style.bgNormal, cvd)))
    minHeadingLc = Math.min(
      minHeadingLc,
      Math.abs(calculateAPCALcWithCVD(style.headingColor, style.bgNormal, cvd))
    )
    minCoverLc = Math.min(minCoverLc, Math.abs(calculateAPCALcWithCVD('oklch(1.00 0 0)', style.bgCover, cvd)))
  }

  // S: 全色覚タイプで厳しい基準（text≥90, heading≥75, cover≥75）
  if (minTextLc >= 90 && minHeadingLc >= 75 && minCoverLc >= 75) return 'S'
  // A: 全色覚タイプで一般基準（text≥75, heading≥60, cover≥60）
  if (minTextLc >= 75 && minHeadingLc >= 60 && minCoverLc >= 60) return 'A'
  // B: それ以外
  return 'B'
}

/**
 * 全Tone & Mannerの視認性をチェックしてコンソールに出力
 * P型/D型色覚でのLc値も表示
 */
export function checkAllTonmanaVisibility(): void {
  console.log('\n🔍 Tonmana Visibility Check (APCA Lc + CVD)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  let passedCount = 0
  let totalChecks = 0
  const issues: { biome: string; check: ContrastCheckResult }[] = []

  for (const biome of tonmanaBiomes) {
    const result = checkTonmanaVisibility(biome)
    const rank = getTonmanaRank(biome)
    totalChecks += result.checks.length

    if (result.allPassed) {
      passedCount += result.checks.length
      console.log(`✅ ${result.biomeName} [${rank}]`)
    } else {
      console.log(`⚠️ ${result.biomeName} [${rank}]`)
    }

    for (const check of result.checks) {
      const status = check.passed ? 'Pass' : `Fail - need Lc ${check.required}`
      const icon = check.passed ? '  ' : '❌'
      // 色覚別のLc値を表示
      const cvdInfo = `(P: ${check.lcProtan.toFixed(1)}, D: ${check.lcDeutan.toFixed(1)})`
      console.log(`   ${icon} ${check.label}: Lc ${check.lc.toFixed(1)} ${cvdInfo} ${status}`)

      if (check.passed) {
        if (result.allPassed) {
          // Already counted above
        } else {
          passedCount++
        }
      } else {
        issues.push({ biome: result.biomeName, check })
      }
    }
    console.log('')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Summary: ${passedCount}/${totalChecks} checks passed`)

  // 格付け分布
  const ratings = { S: 0, A: 0, B: 0 }
  for (const biome of tonmanaBiomes) {
    ratings[getTonmanaRank(biome)]++
  }
  console.log(`\n📊 Rating distribution: S: ${ratings.S}, A: ${ratings.A}, B: ${ratings.B}`)

  if (issues.length > 0) {
    console.log(`\n⚠️ ${issues.length} issues found:`)
    for (const issue of issues) {
      const cvdInfo = `(P: ${issue.check.lcProtan.toFixed(1)}, D: ${issue.check.lcDeutan.toFixed(1)})`
      console.log(
        `   - ${issue.biome}: ${issue.check.label} = Lc ${issue.check.lc.toFixed(1)} ${cvdInfo} (need Lc ${issue.check.required})`
      )
    }
  } else {
    console.log('\n✅ All visibility checks passed!')
  }
}

/**
 * 特定の2色間のAPCA Lcを確認するヘルパー
 * P型/D型色覚でのLc値も表示
 */
export function checkContrast(textColor: string, bgColor: string): void {
  const lc = calculateAPCALc(textColor, bgColor)
  const lcP = calculateAPCALcWithCVD(textColor, bgColor, 'protan')
  const lcD = calculateAPCALcWithCVD(textColor, bgColor, 'deutan')
  const absLc = Math.abs(lc)
  const absLcP = Math.abs(lcP)
  const absLcD = Math.abs(lcD)

  console.log(`APCA Lc: ${lc.toFixed(1)} (absolute: ${absLc.toFixed(1)})`)
  console.log(`  P型: ${lcP.toFixed(1)} (absolute: ${absLcP.toFixed(1)})`)
  console.log(`  D型: ${lcD.toFixed(1)} (absolute: ${absLcD.toFixed(1)})`)
  console.log('')
  console.log(`通常視覚:`)
  console.log(`  - Body text (Lc 90): ${absLc >= 90 ? '✅ Pass' : '❌ Fail'}`)
  console.log(`  - Large text (Lc 75): ${absLc >= 75 ? '✅ Pass' : '❌ Fail'}`)
  console.log(`  - Heading (Lc 60): ${absLc >= 60 ? '✅ Pass' : '❌ Fail'}`)
  console.log(`  - Sub text (Lc 45): ${absLc >= 45 ? '✅ Pass' : '❌ Fail'}`)

  const minLc = Math.min(absLc, absLcP, absLcD)
  console.log(`\n色覚多様性考慮（最小Lc: ${minLc.toFixed(1)}）:`)
  console.log(`  - CVD甘め基準 text (Lc 45): ${minLc >= 45 ? '✅ Pass' : '❌ Fail'}`)
  console.log(`  - CVD甘め基準 heading (Lc 30): ${minLc >= 30 ? '✅ Pass' : '❌ Fail'}`)
}

// ============================================
// 開発時のグローバル公開
// ============================================

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).checkTonmanaVisibility = checkAllTonmanaVisibility
  ;(window as unknown as Record<string, unknown>).checkContrast = checkContrast
  ;(window as unknown as Record<string, unknown>).calculateAPCALc = calculateAPCALc
}
