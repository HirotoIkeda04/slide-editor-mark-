import type { ImpressionCode, TonmanaBiome, TonmanaStyle } from '../types'

// ============================================
// バイオーム型トンマナ定義（24種類）
// ============================================

export const tonmanaBiomes: TonmanaBiome[] = [
  // ============================================
  // シンプル系
  // ============================================
  {
    id: 'minimal',
    name: 'minimal',
    nameJa: 'ミニマル',
    category: 'シンプル系',
    region: {
      energy: [2, 4],
      formality: [2, 4],
      classicModern: [3, 5],
      decoration: [1, 2],
    },
    style: {
      name: 'minimal',
      hue: 'グレー',
      bgNormal: 'oklch(0.98 0.00 0)',
      bgCover: 'oklch(0.30 0.00 0)',
      headingColor: 'oklch(0.25 0.00 0)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
    },
  },
  {
    id: 'zen',
    name: 'zen',
    nameJa: 'ゼン',
    category: 'シンプル系',
    region: {
      energy: [1, 2],
      formality: [2, 4],
      classicModern: [3, 5],
      decoration: [1, 2],
    },
    style: {
      name: 'zen',
      hue: 'グリーン',
      bgNormal: 'oklch(0.97 0.01 150)',
      bgCover: 'oklch(0.35 0.05 150)',
      headingColor: 'oklch(0.40 0.08 150)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
    },
  },
  {
    id: 'modern',
    name: 'modern',
    nameJa: 'モダン',
    category: 'シンプル系',
    region: {
      energy: [3, 4],
      formality: [2, 4],
      classicModern: [4, 5],
      decoration: [1, 3],
    },
    style: {
      name: 'modern',
      hue: 'ブルー',
      bgNormal: 'oklch(0.98 0.01 250)',
      bgCover: 'oklch(0.45 0.15 250)',
      headingColor: 'oklch(0.50 0.18 250)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },

  // ============================================
  // ビジネス系
  // ============================================
  {
    id: 'business',
    name: 'business',
    nameJa: 'ビジネス',
    category: 'ビジネス系',
    region: {
      energy: [2, 4],
      formality: [4, 5],
      classicModern: [3, 5],
      decoration: [1, 2],
    },
    style: {
      name: 'business',
      hue: 'ネイビー',
      bgNormal: 'oklch(0.98 0.00 0)',
      bgCover: 'oklch(0.30 0.08 250)',
      headingColor: 'oklch(0.35 0.10 250)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
    },
  },
  {
    id: 'corporate',
    name: 'corporate',
    nameJa: 'コーポレート',
    category: 'ビジネス系',
    region: {
      energy: [1, 3],
      formality: [4, 5],
      classicModern: [3, 4],
      decoration: [1, 2],
    },
    style: {
      name: 'corporate',
      hue: 'グレー',
      bgNormal: 'oklch(0.97 0.00 0)',
      bgCover: 'oklch(0.35 0.02 250)',
      headingColor: 'oklch(0.40 0.00 0)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.03em',
    },
  },
  {
    id: 'executive',
    name: 'executive',
    nameJa: 'エグゼクティブ',
    category: 'ビジネス系',
    region: {
      energy: [1, 3],
      formality: [4, 5],
      classicModern: [4, 5],
      decoration: [1, 3],
    },
    style: {
      name: 'executive',
      hue: 'ダークブルー',
      bgNormal: 'oklch(0.20 0.02 250)',
      bgCover: 'oklch(0.15 0.03 250)',
      headingColor: 'oklch(0.95 0.00 0)',
      textColor: 'oklch(0.90 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.03em',
    },
  },

  // ============================================
  // エレガント系
  // ============================================
  {
    id: 'elegant',
    name: 'elegant',
    nameJa: 'エレガント',
    category: 'エレガント系',
    region: {
      energy: [3, 5],
      formality: [4, 5],
      classicModern: [3, 4],
      decoration: [2, 3],
    },
    style: {
      name: 'elegant',
      hue: 'ゴールド',
      bgNormal: 'oklch(0.98 0.02 85)',
      bgCover: 'oklch(0.55 0.12 85)',
      headingColor: 'oklch(0.50 0.10 85)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
    },
  },
  {
    id: 'luxury',
    name: 'luxury',
    nameJa: 'ラグジュアリー',
    category: 'エレガント系',
    region: {
      energy: [3, 4],
      formality: [4, 5],
      classicModern: [3, 5],
      decoration: [3, 4],
    },
    style: {
      name: 'luxury',
      hue: 'ゴールド',
      bgNormal: 'linear-gradient(135deg, oklch(0.15 0.02 85), oklch(0.20 0.03 60))',
      bgCover: 'linear-gradient(135deg, oklch(0.60 0.15 85), oklch(0.55 0.12 60))',
      headingColor: 'linear-gradient(135deg, oklch(0.80 0.12 85), oklch(0.75 0.10 60))',
      textColor: 'oklch(0.92 0.02 85)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.08em',
    },
  },
  {
    id: 'premium',
    name: 'premium',
    nameJa: 'プレミアム',
    category: 'エレガント系',
    region: {
      energy: [2, 4],
      formality: [4, 5],
      classicModern: [4, 5],
      decoration: [2, 4],
    },
    style: {
      name: 'premium',
      hue: 'パープル',
      bgNormal: 'oklch(0.18 0.03 300)',
      bgCover: 'oklch(0.50 0.18 300)',
      headingColor: 'oklch(0.85 0.10 300)',
      textColor: 'oklch(0.92 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.04em',
    },
  },

  // ============================================
  // カジュアル系
  // ============================================
  {
    id: 'casual',
    name: 'casual',
    nameJa: 'カジュアル',
    category: 'カジュアル系',
    region: {
      energy: [3, 4],
      formality: [1, 2],
      classicModern: [3, 4],
      decoration: [2, 3],
    },
    style: {
      name: 'casual',
      hue: 'オレンジ',
      bgNormal: 'oklch(0.98 0.02 70)',
      bgCover: 'oklch(0.70 0.18 70)',
      headingColor: 'oklch(0.55 0.15 70)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
  {
    id: 'friendly',
    name: 'friendly',
    nameJa: 'フレンドリー',
    category: 'カジュアル系',
    region: {
      energy: [4, 5],
      formality: [1, 2],
      classicModern: [3, 4],
      decoration: [2, 4],
    },
    style: {
      name: 'friendly',
      hue: 'イエロー',
      bgNormal: 'oklch(0.98 0.04 95)',
      bgCover: 'oklch(0.85 0.18 95)',
      headingColor: 'oklch(0.50 0.12 95)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
  {
    id: 'playful',
    name: 'playful',
    nameJa: 'プレイフル',
    category: 'カジュアル系',
    region: {
      energy: [4, 5],
      formality: [1, 2],
      classicModern: [3, 5],
      decoration: [4, 5],
    },
    style: {
      name: 'playful',
      hue: 'マルチ',
      bgNormal: 'linear-gradient(135deg, oklch(0.97 0.03 340), oklch(0.97 0.03 60))',
      bgCover: 'linear-gradient(135deg, oklch(0.75 0.20 340), oklch(0.75 0.20 60))',
      headingColor: 'linear-gradient(90deg, oklch(0.55 0.20 340), oklch(0.55 0.20 280))',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
  {
    id: 'kawaii',
    name: 'kawaii',
    nameJa: 'かわいい',
    category: 'カジュアル系',
    region: {
      energy: [4, 5],
      formality: [1, 2],
      classicModern: [4, 5],
      decoration: [4, 5],
    },
    style: {
      name: 'kawaii',
      hue: 'ピンク',
      bgNormal: 'linear-gradient(135deg, oklch(0.97 0.04 350), oklch(0.97 0.03 320))',
      bgCover: 'linear-gradient(135deg, oklch(0.80 0.15 350), oklch(0.75 0.18 320))',
      headingColor: 'linear-gradient(90deg, oklch(0.60 0.22 350), oklch(0.55 0.20 320))',
      textColor: 'oklch(0.25 0.05 350)',
      fontHeading: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif',
      fontBody: '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif',
      letterSpacing: '0',
    },
  },

  // ============================================
  // テック系
  // ============================================
  {
    id: 'tech',
    name: 'tech',
    nameJa: 'テック',
    category: 'テック系',
    region: {
      energy: [3, 5],
      formality: [1, 3],
      classicModern: [5, 5],
      decoration: [1, 2],
    },
    style: {
      name: 'tech',
      hue: 'シアン',
      bgNormal: 'oklch(0.15 0.02 250)',
      bgCover: 'oklch(0.60 0.20 200)',
      headingColor: 'oklch(0.85 0.15 200)',
      textColor: 'oklch(0.92 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
  {
    id: 'neo',
    name: 'neo',
    nameJa: 'ネオ',
    category: 'テック系',
    region: {
      energy: [4, 5],
      formality: [2, 3],
      classicModern: [5, 5],
      decoration: [2, 3],
    },
    style: {
      name: 'neo',
      hue: 'ネオン',
      bgNormal: 'oklch(0.12 0.01 280)',
      bgCover: 'linear-gradient(135deg, oklch(0.55 0.25 280), oklch(0.50 0.22 320))',
      headingColor: 'linear-gradient(90deg, oklch(0.80 0.25 200), oklch(0.75 0.22 320))',
      textColor: 'oklch(0.95 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
    },
  },
  {
    id: 'futuristic',
    name: 'futuristic',
    nameJa: 'フューチャリスティック',
    category: 'テック系',
    region: {
      energy: [3, 5],
      formality: [2, 4],
      classicModern: [5, 5],
      decoration: [3, 5],
    },
    style: {
      name: 'futuristic',
      hue: 'ネオン',
      bgNormal: 'linear-gradient(135deg, oklch(0.10 0.02 280), oklch(0.15 0.03 320))',
      bgCover: 'linear-gradient(135deg, oklch(0.50 0.30 280), oklch(0.45 0.28 320))',
      headingColor: 'linear-gradient(90deg, oklch(0.85 0.20 200), oklch(0.80 0.25 280), oklch(0.75 0.22 340))',
      textColor: 'oklch(0.95 0.02 280)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.03em',
    },
  },

  // ============================================
  // ナチュラル系
  // ============================================
  {
    id: 'natural',
    name: 'natural',
    nameJa: 'ナチュラル',
    category: 'ナチュラル系',
    region: {
      energy: [3, 5],
      formality: [1, 3],
      classicModern: [2, 4],
      decoration: [2, 3],
    },
    style: {
      name: 'natural',
      hue: 'グリーン',
      bgNormal: 'oklch(0.97 0.02 130)',
      bgCover: 'oklch(0.55 0.15 130)',
      headingColor: 'oklch(0.45 0.12 130)',
      textColor: 'oklch(0.20 0.02 130)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
  {
    id: 'organic',
    name: 'organic',
    nameJa: 'オーガニック',
    category: 'ナチュラル系',
    region: {
      energy: [4, 5],
      formality: [1, 3],
      classicModern: [3, 5],
      decoration: [2, 4],
    },
    style: {
      name: 'organic',
      hue: 'リーフ',
      bgNormal: 'oklch(0.96 0.03 120)',
      bgCover: 'oklch(0.60 0.18 120)',
      headingColor: 'oklch(0.50 0.15 120)',
      textColor: 'oklch(0.22 0.03 120)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
  {
    id: 'earthy',
    name: 'earthy',
    nameJa: 'アーシー',
    category: 'ナチュラル系',
    region: {
      energy: [3, 5],
      formality: [2, 4],
      classicModern: [1, 3],
      decoration: [2, 3],
    },
    style: {
      name: 'earthy',
      hue: 'ブラウン',
      bgNormal: 'oklch(0.96 0.03 70)',
      bgCover: 'oklch(0.50 0.10 70)',
      headingColor: 'oklch(0.45 0.08 70)',
      textColor: 'oklch(0.25 0.03 70)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
    },
  },

  // ============================================
  // クラシック系
  // ============================================
  {
    id: 'classic',
    name: 'classic',
    nameJa: 'クラシック',
    category: 'クラシック系',
    region: {
      energy: [2, 4],
      formality: [3, 4],
      classicModern: [1, 2],
      decoration: [2, 4],
    },
    style: {
      name: 'classic',
      hue: 'ブラウン',
      bgNormal: 'oklch(0.97 0.02 60)',
      bgCover: 'oklch(0.45 0.08 60)',
      headingColor: 'oklch(0.40 0.06 60)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
    },
  },
  {
    id: 'vintage',
    name: 'vintage',
    nameJa: 'ヴィンテージ',
    category: 'クラシック系',
    region: {
      energy: [1, 3],
      formality: [2, 4],
      classicModern: [1, 2],
      decoration: [2, 4],
    },
    style: {
      name: 'vintage',
      hue: 'セピア',
      bgNormal: 'oklch(0.95 0.04 70)',
      bgCover: 'oklch(0.50 0.10 55)',
      headingColor: 'oklch(0.45 0.08 55)',
      textColor: 'oklch(0.25 0.03 55)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.03em',
    },
  },
  {
    id: 'heritage',
    name: 'heritage',
    nameJa: 'ヘリテージ',
    category: 'クラシック系',
    region: {
      energy: [1, 3],
      formality: [4, 5],
      classicModern: [1, 2],
      decoration: [3, 5],
    },
    style: {
      name: 'heritage',
      hue: 'ボルドー',
      bgNormal: 'linear-gradient(135deg, oklch(0.96 0.03 50), oklch(0.95 0.04 30))',
      bgCover: 'linear-gradient(135deg, oklch(0.40 0.12 25), oklch(0.35 0.10 45))',
      headingColor: 'linear-gradient(135deg, oklch(0.50 0.10 25), oklch(0.45 0.08 45))',
      textColor: 'oklch(0.22 0.02 25)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Serif JP", serif',
      letterSpacing: '0.08em',
    },
  },

  // ============================================
  // 装飾系
  // ============================================
  {
    id: 'decorative',
    name: 'decorative',
    nameJa: 'デコラティブ',
    category: '装飾系',
    region: {
      energy: [3, 4],
      formality: [2, 4],
      classicModern: [2, 4],
      decoration: [4, 5],
    },
    style: {
      name: 'decorative',
      hue: 'マルチ',
      bgNormal: 'linear-gradient(135deg, oklch(0.97 0.03 30), oklch(0.96 0.04 60))',
      bgCover: 'linear-gradient(135deg, oklch(0.60 0.15 30), oklch(0.55 0.18 60))',
      headingColor: 'linear-gradient(135deg, oklch(0.50 0.12 30), oklch(0.45 0.15 60))',
      textColor: 'oklch(0.22 0.02 30)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
    },
  },
  {
    id: 'artistic',
    name: 'artistic',
    nameJa: 'アーティスティック',
    category: '装飾系',
    region: {
      energy: [3, 5],
      formality: [1, 3],
      classicModern: [2, 4],
      decoration: [4, 5],
    },
    style: {
      name: 'artistic',
      hue: 'マルチ',
      bgNormal: 'linear-gradient(135deg, oklch(0.97 0.02 200), oklch(0.96 0.03 280))',
      bgCover: 'linear-gradient(135deg, oklch(0.55 0.20 200), oklch(0.50 0.22 280))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.18 200), oklch(0.45 0.20 280))',
      textColor: 'oklch(0.22 0.02 240)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
    },
  },
]

// ============================================
// バイオーム選択ロジック
// ============================================

/**
 * 印象コードがバイオームの領域内に収まるかチェック
 */
function isCodeInBiomeRegion(code: ImpressionCode, biome: TonmanaBiome): boolean {
  return (
    code.energy >= biome.region.energy[0] &&
    code.energy <= biome.region.energy[1] &&
    code.formality >= biome.region.formality[0] &&
    code.formality <= biome.region.formality[1] &&
    code.classicModern >= biome.region.classicModern[0] &&
    code.classicModern <= biome.region.classicModern[1] &&
    code.decoration >= biome.region.decoration[0] &&
    code.decoration <= biome.region.decoration[1]
  )
}

/**
 * バイオームの中心点を計算
 */
function getBiomeCenter(biome: TonmanaBiome): ImpressionCode {
  return {
    energy: (biome.region.energy[0] + biome.region.energy[1]) / 2,
    formality: (biome.region.formality[0] + biome.region.formality[1]) / 2,
    classicModern: (biome.region.classicModern[0] + biome.region.classicModern[1]) / 2,
    decoration: (biome.region.decoration[0] + biome.region.decoration[1]) / 2,
  }
}

/**
 * 2つの印象コード間の距離を計算（ユークリッド距離）
 */
function getCodeDistance(a: ImpressionCode, b: ImpressionCode): number {
  return Math.sqrt(
    Math.pow(a.energy - b.energy, 2) +
    Math.pow(a.formality - b.formality, 2) +
    Math.pow(a.classicModern - b.classicModern, 2) +
    Math.pow(a.decoration - b.decoration, 2)
  )
}

/**
 * 印象コードに最もマッチするバイオームを検索
 * 
 * 1. 領域内に収まるバイオームをフィルタリング
 * 2. 複数マッチ時は中心点との距離が最も近いものを選択
 * 3. マッチなしの場合は最も近いバイオームを選択
 */
export function findMatchingBiome(code: ImpressionCode): TonmanaBiome {
  // 領域内に収まるバイオームをフィルタリング
  const matchingBiomes = tonmanaBiomes.filter(biome => isCodeInBiomeRegion(code, biome))
  
  if (matchingBiomes.length === 1) {
    return matchingBiomes[0]
  }
  
  if (matchingBiomes.length > 1) {
    // 複数マッチ時は中心点との距離が最も近いものを選択
    let closest = matchingBiomes[0]
    let minDistance = getCodeDistance(code, getBiomeCenter(closest))
    
    for (let i = 1; i < matchingBiomes.length; i++) {
      const biome = matchingBiomes[i]
      const distance = getCodeDistance(code, getBiomeCenter(biome))
      if (distance < minDistance) {
        minDistance = distance
        closest = biome
      }
    }
    
    return closest
  }
  
  // マッチなしの場合は最も近いバイオームを選択
  let closest = tonmanaBiomes[0]
  let minDistance = getCodeDistance(code, getBiomeCenter(closest))
  
  for (let i = 1; i < tonmanaBiomes.length; i++) {
    const biome = tonmanaBiomes[i]
    const distance = getCodeDistance(code, getBiomeCenter(biome))
    if (distance < minDistance) {
      minDistance = distance
      closest = biome
    }
  }
  
  return closest
}

/**
 * バイオームIDからバイオームを取得
 */
export function getBiomeById(id: string): TonmanaBiome | undefined {
  return tonmanaBiomes.find(biome => biome.id === id)
}

/**
 * カテゴリでグループ化されたバイオームを取得
 */
export function getBiomesByCategory(): Map<string, TonmanaBiome[]> {
  const categoryMap = new Map<string, TonmanaBiome[]>()
  
  for (const biome of tonmanaBiomes) {
    const biomes = categoryMap.get(biome.category) || []
    biomes.push(biome)
    categoryMap.set(biome.category, biomes)
  }
  
  return categoryMap
}

/**
 * 印象コードに最もマッチするバイオームの名前を取得
 */
export function getMatchingBiomeName(code: ImpressionCode): { name: string; nameJa: string } {
  const biome = findMatchingBiome(code)
  return { name: biome.name, nameJa: biome.nameJa }
}

/**
 * 印象コードに最もマッチするバイオームのスタイルを取得
 */
export function getMatchingBiomeStyle(code: ImpressionCode): TonmanaStyle {
  const biome = findMatchingBiome(code)
  return biome.style
}
