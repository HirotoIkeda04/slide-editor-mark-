import { useState, useMemo } from 'react'
import type { TonmanaBiome } from '../../types'
import { getBiomeById } from '../../constants/tonmanaBiomes'

interface ImpressionDetailProps {
  selectedBiomeId?: string
}

/**
 * oklch文字列をパース
 */
function parseOklch(oklchStr: string): { l: number; c: number; h: number } | null {
  const match = oklchStr.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (!match) return null
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  }
}

/**
 * oklchオブジェクトを文字列に変換
 */
function toOklchString(lch: { l: number; c: number; h: number }): string {
  return `oklch(${lch.l.toFixed(2)} ${lch.c.toFixed(2)} ${lch.h.toFixed(0)})`
}

/**
 * 色を薄くする（明度を上げ、彩度を下げる）
 * step: 0-4 (0が元の色、4が最も薄い)
 */
function lightenColor(color: string, step: number): string {
  const parsed = parseOklch(color)
  if (!parsed) return color

  // 明度を上げ、彩度を下げる
  const lightnessIncrease = step * 0.10 // 各ステップで明度+0.10
  const chromaDecrease = step * 0.6 // 各ステップで彩度を60%減少

  const newL = Math.min(0.97, parsed.l + lightnessIncrease)
  const newC = Math.max(0.01, parsed.c * (1 - chromaDecrease * 0.25))

  return toOklchString({ l: newL, c: newC, h: parsed.h })
}

/**
 * 色を暗くする（明度を下げ、彩度を少し上げる）
 * step: 0-4 (0が元の色、4が最も暗い)
 */
function darkenColor(color: string, step: number): string {
  const parsed = parseOklch(color)
  if (!parsed) return color

  // 明度を下げ、彩度を少し上げる
  const lightnessDecrease = step * 0.08
  const newL = Math.max(0.15, parsed.l - lightnessDecrease)
  const newC = Math.min(0.20, parsed.c * (1 + step * 0.1))

  return toOklchString({ l: newL, c: newC, h: parsed.h })
}

/**
 * 背景がライトテーマかどうかを判定
 * 明度0.5以上ならライト
 */
function isLightBackground(color: string): boolean {
  const parsed = parseOklch(color)
  if (!parsed) return true // パースできない場合はライトと仮定
  return parsed.l > 0.5
}

/**
 * ベースカラー+8色×5段階のカラーパレットを生成
 * ベースカラーは最初の列に配置
 * - ライトテーマ: 暗い順（最も暗い → 元の色）
 * - ダークテーマ: 明るい順（元の色 → 最も明るい）
 */
function generatePaletteGrid(baseColor: string, chartColors: string[]): string[][] {
  const grid: string[][] = []
  // ベースカラーを含む全9色
  const allColors = [baseColor, ...chartColors]

  // ベースカラーでライト/ダークを判定
  const isLight = isLightBackground(baseColor)

  for (let step = 0; step < 5; step++) {
    if (isLight) {
      // ライトテーマ: 暗い方向に生成
      const row = allColors.map((color) => darkenColor(color, step))
      grid.push(row)
    } else {
      // ダークテーマ: 明るい方向に生成
      const row = allColors.map((color) => lightenColor(color, step))
      grid.push(row)
    }
  }

  // ライトテーマの場合は逆順（暗い順に上から）
  if (isLight) {
    grid.reverse()
  }

  return grid
}

/**
 * 色の行（ラベル + 色チップ）
 */
const ColorRow = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="impression-detail-color-row">
      <span className="impression-detail-color-label">{label}</span>
      <div
        className="impression-detail-color-swatch"
        style={{ background: color }}
        title={color}
      />
    </div>
  )
}

/**
 * カラーパレットグリッド（ベース+8色×5段階）
 */
const PaletteGrid = ({ baseColor, chartColors }: { baseColor: string; chartColors: string[] }) => {
  const grid = useMemo(() => generatePaletteGrid(baseColor, chartColors), [baseColor, chartColors])

  return (
    <div className="impression-detail-palette-grid">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="impression-detail-palette-row">
          {row.map((color, colIndex) => (
            <div
              key={colIndex}
              className={`impression-detail-palette-chip ${colIndex === 0 ? 'base' : ''}`}
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export const ImpressionDetail = ({
  selectedBiomeId,
}: ImpressionDetailProps) => {
  const [expanded, setExpanded] = useState(true)
  
  // 現在のバイオームを取得
  const currentBiome = useMemo<TonmanaBiome | null>(() => {
    if (!selectedBiomeId) return null
    return getBiomeById(selectedBiomeId) ?? null
  }, [selectedBiomeId])
  
  if (!currentBiome) {
    return null
  }
  
  const { style } = currentBiome
  
  return (
    <div>
      <button
        className="impression-detail-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span>カラー情報</span>
        <span className={`impression-detail-toggle-icon material-icons ${expanded ? 'expanded' : ''}`}>
          expand_more
        </span>
      </button>
      
      <div className={`impression-detail-content ${expanded ? 'expanded' : ''}`}>
        {/* 背景色セクション */}
        <div className="impression-detail-section">
          <div className="impression-detail-section-title">背景</div>
          <ColorRow label="通常" color={style.bgNormal} />
          <ColorRow label="表紙" color={style.bgCover} />
        </div>
        
        {/* テキスト色セクション */}
        <div className="impression-detail-section">
          <div className="impression-detail-section-title">テキスト</div>
          <ColorRow label="表紙文字" color="oklch(1.00 0 0)" />
          <ColorRow label="見出し" color={style.headingColor} />
          <ColorRow label="本文" color={style.textColor} />
        </div>
        
        {/* アクセントカラーセクション */}
        <div className="impression-detail-section">
          <div className="impression-detail-section-title">アクセント</div>
          <ColorRow label="プライマリー" color={style.primary} />
          <ColorRow label="セカンダリー" color={style.secondary} />
        </div>
        
        {/* カラーパレット（ベース+8色×5段階） */}
        <div className="impression-detail-section">
          <div className="impression-detail-section-title">カラーパレット</div>
          <PaletteGrid baseColor={style.baseColor} chartColors={style.chartColors} />
        </div>
      </div>
    </div>
  )
}
