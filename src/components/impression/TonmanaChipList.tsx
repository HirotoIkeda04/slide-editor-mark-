import { useMemo } from 'react'
import type { TonmanaBiome, TonmanaFilterCategory, TonmanaRank } from '../../types'
import { tonmanaBiomes, getBiomesByCategories } from '../../constants/tonmanaBiomes'
import { getTonmanaRank } from '../../utils/visibilityChecker'

interface TonmanaChipListProps {
  categories: TonmanaFilterCategory[]
  selectedBiomeId: string | null
  onBiomeSelect: (biomeId: string) => void
  usedBiomeIds?: string[]
}

/**
 * グラデーション文字列かどうかを判定
 */
const isGradient = (color: string): boolean => {
  return color.includes('gradient')
}

/**
 * チップ表示用にグラデーションの色停止位置を調整
 * 背景が単色の場合のみ適用（フォントグラデーションが主役）
 * 左半分を開始色で固定し、右半分でグラデーションを表示することで両端の色が見える
 * 注意: 2色のグラデーションのみ調整、3色以上はそのまま返す
 */
const adjustGradientForChip = (gradientStr: string): string => {
  // 3色以上のグラデーションかどうかをチェック（カンマの数で判定）
  const commaCount = (gradientStr.match(/,/g) || []).length
  if (commaCount > 2) {
    // 3色以上のグラデーションはそのまま返す
    return gradientStr
  }
  
  // linear-gradient(90deg, #color1, #color2) → linear-gradient(90deg, #color1 50%, #color2 100%)
  // 2色のグラデーションのみマッチ（閉じ括弧で終わる）
  const match = gradientStr.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^,)]+)\)$/)
  if (match) {
    const [, angle, color1, color2] = match
    return `linear-gradient(${angle}deg, ${color1.trim()} 50%, ${color2.trim()} 100%)`
  }
  return gradientStr
}

/**
 * グラデーションテキスト用のスタイルを生成
 * テキストがグラデーションの場合は常に調整を適用（背景に関わらず統一）
 */
const getTextStyle = (
  color: string, 
  fontFamily: string, 
  fontWeight: number,
  opacity?: number
): React.CSSProperties => {
  if (isGradient(color)) {
    // テキストグラデーションを調整（左半分を開始色で固定）
    const adjustedGradient = adjustGradientForChip(color)
    return {
      background: adjustedGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      backgroundSize: '100% 100%',
      fontFamily,
      fontWeight,
      opacity,
    }
  }
  return {
    color,
    fontFamily,
    fontWeight,
    opacity,
  }
}

/**
 * Tone & Mannerチップ一覧
 * 
 * フィルターカテゴリでフィルタリングされたバイオームを円形チップで表示
 * 各チップは波形の境界で2分割され、通常スライドと表紙スライドのスタイルを表現
 */
export const TonmanaChipList = ({
  categories,
  selectedBiomeId,
  onBiomeSelect,
  usedBiomeIds = [],
}: TonmanaChipListProps) => {
  // フィルタリングされたバイオーム一覧
  const filteredBiomes = useMemo(() => {
    if (categories.length === 0) {
      return tonmanaBiomes
    }
    return getBiomesByCategories(categories, usedBiomeIds)
  }, [categories, usedBiomeIds])

  // 格付け別にグループ化
  const groupedBiomes = useMemo(() => {
    const groups: Record<TonmanaRank, TonmanaBiome[]> = { S: [], A: [], B: [] }
    for (const biome of filteredBiomes) {
      const rank = getTonmanaRank(biome)
      groups[rank].push(biome)
    }
    return groups
  }, [filteredBiomes])

  // Tone & Mannerチップをレンダリング（波形2分割）
  const renderChip = (biome: TonmanaBiome) => {
    const isSelected = selectedBiomeId === biome.id
    
    // 通常スライドのスタイル
    const bgNormal = biome.style.bgNormal
    const headingColor = biome.style.headingColor
    
    // 表紙/中扉スライドのスタイル
    const bgCover = biome.style.bgCover
    // 表紙は通常白または明るい色
    const coverTextColor = '#ffffff'
    
    // フォントスタイル
    const fontFamily = biome.style.fontHeading
    const fontWeight = biome.chipStyle.fontWeight
    
    return (
      <div key={biome.id} className="tonmana-chip-container">
        <button
          className={`tonmana-chip ${isSelected ? 'selected' : ''}`}
          onClick={() => onBiomeSelect(biome.id)}
          type="button"
          title={`${biome.nameJa} (${biome.name})`}
        >
          {/* 上レイヤー: 通常スライド */}
          <div 
            className="tonmana-chip-layer tonmana-chip-top"
            style={{ background: bgNormal }}
          >
            <span 
              className="tonmana-chip-name-en"
              style={getTextStyle(headingColor, fontFamily, fontWeight)}
            >
              {biome.name}
            </span>
            <span 
              className="tonmana-chip-name-ja-inner"
              style={getTextStyle(headingColor, fontFamily, fontWeight, 0.7)}
            >
              {biome.nameJa}
            </span>
          </div>
          
          {/* 下レイヤー: 表紙スライド */}
          <div 
            className="tonmana-chip-layer tonmana-chip-bottom"
            style={{ background: bgCover }}
          >
            <span 
              className="tonmana-chip-name-en"
              style={{ color: coverTextColor, fontFamily, fontWeight }}
            >
              {biome.name}
            </span>
            <span 
              className="tonmana-chip-name-ja-inner"
              style={{ color: coverTextColor, fontFamily, fontWeight, opacity: 0.7 }}
            >
              {biome.nameJa}
            </span>
          </div>
        </button>
      </div>
    )
  }

  // 格付けラベル
  const rankLabels: Record<TonmanaRank, string> = {
    S: '視認性 S',
    A: '視認性 A',
    B: '視認性 B',
  }

  return (
    <div className="tonmana-chip-list">
      {(['S', 'A', 'B'] as const).map(rank => (
        groupedBiomes[rank].length > 0 && (
          <div key={rank} className="tonmana-rank-section">
            <div className={`tonmana-rank-label tonmana-rank-${rank.toLowerCase()}`}>
              {rankLabels[rank]}
            </div>
            <div className="tonmana-rank-chips">
              {groupedBiomes[rank].map(renderChip)}
            </div>
          </div>
        )
      ))}
    </div>
  )
}
