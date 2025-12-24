import type { TonmanaBiome, TonmanaStyle, TonmanaBaseStyle, TonmanaFilterCategory } from '../types'

// ============================================
// Tone & Manner定義（19種類）
// スタイル × カラーの組み合わせで定義
// ============================================

export const tonmanaBiomes: TonmanaBiome[] = [
  // ============================================
  // Plain（シンプル・クリーン）
  // ============================================
  {
    id: 'plain-gray',
    name: 'PlainGray',
    nameJa: 'プレーン グレー',
    baseStyle: 'Plain',
    color: 'Gray',
    style: {
      name: 'plain-gray',
      bgNormal: 'oklch(0.98 0.00 0)',
      bgCover: 'oklch(0.30 0.00 0)',
      headingColor: 'oklch(0.25 0.00 0)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.98 0.00 0)',
            primary: 'oklch(0.50 0.15 230)',
      secondary: 'oklch(0.50 0.15 50)',
      chartColors: ['oklch(0.55 0.15 230)', 'oklch(0.55 0.15 275)', 'oklch(0.55 0.15 320)', 'oklch(0.55 0.15 5)', 'oklch(0.55 0.15 50)', 'oklch(0.55 0.15 95)', 'oklch(0.55 0.15 140)', 'oklch(0.55 0.15 185)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 300,
      color: '#374151',
      backgroundColor: '#f9fafb',
      borderRadius: '4px',
      border: '1px solid #e5e7eb',
    },
  },
  {
    id: 'plain-sky',
    name: 'PlainSky',
    nameJa: 'プレーン スカイ',
    baseStyle: 'Plain',
    color: 'Sky',
    style: {
      name: 'plain-sky',
      bgNormal: 'oklch(0.97 0.02 230)',
      bgCover: 'oklch(0.45 0.12 230)',
      headingColor: 'oklch(0.45 0.15 230)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.97 0.02 230)',
            primary: 'oklch(0.45 0.15 230)',
      secondary: 'oklch(0.45 0.15 50)',
      chartColors: ['oklch(0.45 0.15 230)', 'oklch(0.45 0.15 275)', 'oklch(0.45 0.15 320)', 'oklch(0.45 0.15 5)', 'oklch(0.45 0.15 50)', 'oklch(0.45 0.15 95)', 'oklch(0.45 0.15 140)', 'oklch(0.45 0.15 185)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 300,
      color: '#1e40af',
      backgroundColor: '#eff6ff',
      borderRadius: '4px',
      border: '1px solid #bfdbfe',
    },
  },
  {
    id: 'plain-mint',
    name: 'PlainMint',
    nameJa: 'プレーン ミント',
    baseStyle: 'Plain',
    color: 'Mint',
    style: {
      name: 'plain-mint',
      bgNormal: 'oklch(0.97 0.02 160)',
      bgCover: 'oklch(0.45 0.10 160)',
      headingColor: 'oklch(0.40 0.12 160)',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.97 0.02 160)',
            primary: 'oklch(0.40 0.12 160)',
      secondary: 'oklch(0.45 0.12 340)',
      chartColors: ['oklch(0.45 0.12 160)', 'oklch(0.45 0.12 205)', 'oklch(0.45 0.12 250)', 'oklch(0.45 0.12 295)', 'oklch(0.45 0.12 340)', 'oklch(0.45 0.12 25)', 'oklch(0.45 0.12 70)', 'oklch(0.45 0.12 115)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 300,
      color: '#047857',
      backgroundColor: '#ecfdf5',
      borderRadius: '4px',
      border: '1px solid #a7f3d0',
    },
  },

  // ============================================
  // Corporate（フォーマル・信頼感）
  // ============================================
  {
    id: 'corporate-gray',
    name: 'CorpGray',
    nameJa: 'コーポ グレー',
    baseStyle: 'Corporate',
    color: 'Gray',
    style: {
      name: 'corporate-gray',
      bgNormal: 'oklch(0.98 0.00 0)',
      bgCover: 'oklch(0.25 0.00 0)',
      headingColor: 'oklch(0.20 0.00 0)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.04em',
      baseColor: 'oklch(0.98 0.00 0)',
            primary: 'oklch(0.50 0.15 230)',
      secondary: 'oklch(0.50 0.15 50)',
      chartColors: ['oklch(0.55 0.15 230)', 'oklch(0.55 0.15 275)', 'oklch(0.55 0.15 320)', 'oklch(0.55 0.15 5)', 'oklch(0.55 0.15 50)', 'oklch(0.55 0.15 95)', 'oklch(0.55 0.15 140)', 'oklch(0.55 0.15 185)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 500,
      color: '#1f2937',
      backgroundColor: '#f3f4f6',
      borderRadius: '2px',
      border: '1px solid #d1d5db',
    },
  },
  {
    id: 'corporate-sky',
    name: 'CorpSky',
    nameJa: 'コーポ スカイ',
    baseStyle: 'Corporate',
    color: 'Sky',
    style: {
      name: 'corporate-sky',
      bgNormal: 'oklch(0.98 0.01 230)',
      bgCover: 'oklch(0.40 0.15 230)',
      headingColor: 'oklch(0.40 0.18 230)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.04em',
      baseColor: 'oklch(0.98 0.01 230)',
            primary: 'oklch(0.40 0.18 230)',
      secondary: 'oklch(0.45 0.18 50)',
      chartColors: ['oklch(0.45 0.18 230)', 'oklch(0.45 0.18 275)', 'oklch(0.45 0.18 320)', 'oklch(0.45 0.18 5)', 'oklch(0.45 0.18 50)', 'oklch(0.45 0.18 95)', 'oklch(0.45 0.18 140)', 'oklch(0.45 0.18 185)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 500,
      color: '#1e3a8a',
      backgroundColor: '#dbeafe',
      borderRadius: '2px',
      border: '1px solid #93c5fd',
    },
  },
  {
    id: 'corporate-sand',
    name: 'CorpSand',
    nameJa: 'コーポ サンド',
    baseStyle: 'Corporate',
    color: 'Sand',
    style: {
      name: 'corporate-sand',
      bgNormal: 'oklch(0.97 0.02 70)',
      bgCover: 'oklch(0.45 0.08 70)',
      headingColor: 'oklch(0.40 0.10 70)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.04em',
      baseColor: 'oklch(0.97 0.02 70)',
            primary: 'oklch(0.40 0.10 70)',
      secondary: 'oklch(0.45 0.10 250)',
      chartColors: ['oklch(0.45 0.10 70)', 'oklch(0.45 0.10 115)', 'oklch(0.45 0.10 160)', 'oklch(0.45 0.10 205)', 'oklch(0.45 0.10 250)', 'oklch(0.45 0.10 295)', 'oklch(0.45 0.10 340)', 'oklch(0.45 0.10 25)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 500,
      color: '#78350f',
      backgroundColor: '#fef3c7',
      borderRadius: '2px',
      border: '1px solid #fcd34d',
    },
  },

  // ============================================
  // Elegant（上品・洗練）
  // ============================================
  {
    id: 'elegant-gray',
    name: 'ElegGray',
    nameJa: 'エレガン グレー',
    baseStyle: 'Elegant',
    color: 'Gray',
    style: {
      name: 'elegant-gray',
      bgNormal: 'oklch(0.96 0.00 0)',
      bgCover: 'oklch(0.20 0.00 0)',
      headingColor: 'oklch(0.15 0.00 0)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.08em',
      baseColor: 'oklch(0.96 0.00 0)',
            primary: 'oklch(0.50 0.15 230)',
      secondary: 'oklch(0.50 0.15 50)',
      chartColors: ['oklch(0.55 0.15 230)', 'oklch(0.55 0.15 275)', 'oklch(0.55 0.15 320)', 'oklch(0.55 0.15 5)', 'oklch(0.55 0.15 50)', 'oklch(0.55 0.15 95)', 'oklch(0.55 0.15 140)', 'oklch(0.55 0.15 185)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 400,
      color: '#1f2937',
      backgroundColor: '#f9fafb',
      borderRadius: '0px',
      border: '1px solid #9ca3af',
    },
  },
  {
    id: 'elegant-lavender',
    name: 'ElegLav',
    nameJa: 'エレガン ラベン',
    baseStyle: 'Elegant',
    color: 'Lavender',
    style: {
      name: 'elegant-lavender',
      bgNormal: 'oklch(0.96 0.03 300)',
      bgCover: 'oklch(0.35 0.12 300)',
      headingColor: 'oklch(0.40 0.15 300)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.08em',
      baseColor: 'oklch(0.96 0.03 300)',
            primary: 'oklch(0.40 0.15 300)',
      secondary: 'oklch(0.45 0.15 120)',
      chartColors: ['oklch(0.45 0.15 300)', 'oklch(0.45 0.15 345)', 'oklch(0.45 0.15 30)', 'oklch(0.45 0.15 75)', 'oklch(0.45 0.15 120)', 'oklch(0.45 0.15 165)', 'oklch(0.45 0.15 210)', 'oklch(0.45 0.15 255)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 400,
      color: '#6b21a8',
      backgroundColor: '#faf5ff',
      borderRadius: '0px',
      border: '1px solid #c4b5fd',
    },
  },
  {
    id: 'elegant-coral',
    name: 'ElegCoral',
    nameJa: 'エレガン コーラル',
    baseStyle: 'Elegant',
    color: 'Coral',
    style: {
      name: 'elegant-coral',
      bgNormal: 'oklch(0.97 0.02 15)',
      bgCover: 'oklch(0.50 0.15 15)',
      headingColor: 'oklch(0.50 0.18 15)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Shippori Mincho", "Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.08em',
      baseColor: 'oklch(0.97 0.02 15)',
            primary: 'oklch(0.50 0.18 15)',
      secondary: 'oklch(0.50 0.18 195)',
      chartColors: ['oklch(0.50 0.18 15)', 'oklch(0.50 0.18 60)', 'oklch(0.50 0.18 105)', 'oklch(0.50 0.18 150)', 'oklch(0.50 0.18 195)', 'oklch(0.50 0.18 240)', 'oklch(0.50 0.18 285)', 'oklch(0.50 0.18 330)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 400,
      color: '#be123c',
      backgroundColor: '#fff1f2',
      borderRadius: '0px',
      border: '1px solid #fda4af',
    },
  },

  // ============================================
  // Casual（親しみやすい・カラフル）
  // ============================================
  {
    id: 'casual-coral',
    name: 'CasuCoral',
    nameJa: 'カジュア コーラル',
    baseStyle: 'Casual',
    color: 'Coral',
    style: {
      name: 'casual-coral',
      bgNormal: 'oklch(0.98 0.02 15)',
      bgCover: 'oklch(0.65 0.18 15)',
      headingColor: 'oklch(0.55 0.20 15)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Zen Maru Gothic", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.98 0.02 15)',
            primary: 'oklch(0.55 0.20 15)',
      secondary: 'oklch(0.55 0.18 195)',
      chartColors: ['oklch(0.55 0.18 15)', 'oklch(0.55 0.18 60)', 'oklch(0.55 0.18 105)', 'oklch(0.55 0.18 150)', 'oklch(0.55 0.18 195)', 'oklch(0.55 0.18 240)', 'oklch(0.55 0.18 285)', 'oklch(0.55 0.18 330)'],
    },
    chipStyle: {
      fontFamily: '"Zen Maru Gothic", sans-serif',
      fontWeight: 500,
      color: '#be123c',
      backgroundColor: '#ffe4e6',
      borderRadius: '16px',
    },
  },
  {
    id: 'casual-amber',
    name: 'CasuAmber',
    nameJa: 'カジュア アンバー',
    baseStyle: 'Casual',
    color: 'Amber',
    style: {
      name: 'casual-amber',
      bgNormal: 'oklch(0.98 0.03 75)',
      bgCover: 'oklch(0.50 0.12 75)',
      headingColor: 'oklch(0.55 0.18 75)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Zen Maru Gothic", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.98 0.03 75)',
            primary: 'oklch(0.55 0.18 75)',
      secondary: 'oklch(0.55 0.18 255)',
      chartColors: ['oklch(0.55 0.18 75)', 'oklch(0.55 0.18 120)', 'oklch(0.55 0.18 165)', 'oklch(0.55 0.18 210)', 'oklch(0.55 0.18 255)', 'oklch(0.55 0.18 300)', 'oklch(0.55 0.18 345)', 'oklch(0.55 0.18 30)'],
    },
    chipStyle: {
      fontFamily: '"Zen Maru Gothic", sans-serif',
      fontWeight: 500,
      color: '#b45309',
      backgroundColor: '#fef3c7',
      borderRadius: '16px',
    },
  },
  {
    id: 'casual-mint',
    name: 'CasuMint',
    nameJa: 'カジュア ミント',
    baseStyle: 'Casual',
    color: 'Mint',
    style: {
      name: 'casual-mint',
      bgNormal: 'oklch(0.98 0.02 160)',
      bgCover: 'oklch(0.60 0.12 160)',
      headingColor: 'oklch(0.45 0.15 160)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Zen Maru Gothic", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.98 0.02 160)',
            primary: 'oklch(0.45 0.15 160)',
      secondary: 'oklch(0.45 0.15 340)',
      chartColors: ['oklch(0.45 0.15 160)', 'oklch(0.45 0.15 205)', 'oklch(0.45 0.15 250)', 'oklch(0.45 0.15 295)', 'oklch(0.45 0.15 340)', 'oklch(0.45 0.15 25)', 'oklch(0.45 0.15 70)', 'oklch(0.45 0.15 115)'],
    },
    chipStyle: {
      fontFamily: '"Zen Maru Gothic", sans-serif',
      fontWeight: 500,
      color: '#047857',
      backgroundColor: '#d1fae5',
      borderRadius: '16px',
    },
  },
  {
    id: 'casual-sky',
    name: 'CasuSky',
    nameJa: 'カジュア スカイ',
    baseStyle: 'Casual',
    color: 'Sky',
    style: {
      name: 'casual-sky',
      bgNormal: 'oklch(0.98 0.02 230)',
      bgCover: 'oklch(0.60 0.15 230)',
      headingColor: 'oklch(0.50 0.18 230)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Zen Maru Gothic", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.98 0.02 230)',
            primary: 'oklch(0.50 0.18 230)',
      secondary: 'oklch(0.50 0.18 50)',
      chartColors: ['oklch(0.50 0.18 230)', 'oklch(0.50 0.18 275)', 'oklch(0.50 0.18 320)', 'oklch(0.50 0.18 5)', 'oklch(0.50 0.18 50)', 'oklch(0.50 0.18 95)', 'oklch(0.50 0.18 140)', 'oklch(0.50 0.18 185)'],
    },
    chipStyle: {
      fontFamily: '"Zen Maru Gothic", sans-serif',
      fontWeight: 500,
      color: '#1d4ed8',
      backgroundColor: '#dbeafe',
      borderRadius: '16px',
    },
  },

  // ============================================
  // Tech（先進的・デジタル）
  // ============================================
  {
    id: 'tech-gray',
    name: 'TechGray',
    nameJa: 'テック グレー',
    baseStyle: 'Tech',
    color: 'Gray',
    style: {
      name: 'tech-gray',
      bgNormal: 'oklch(0.20 0.00 0)',
      bgCover: 'oklch(0.12 0.00 0)',
      headingColor: 'oklch(0.92 0.00 0)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"JetBrains Mono", "Noto Sans JP", monospace',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.20 0.00 0)',
            primary: 'oklch(0.50 0.15 230)',
      secondary: 'oklch(0.50 0.15 50)',
      chartColors: ['oklch(0.55 0.15 230)', 'oklch(0.55 0.15 275)', 'oklch(0.55 0.15 320)', 'oklch(0.55 0.15 5)', 'oklch(0.55 0.15 50)', 'oklch(0.55 0.15 95)', 'oklch(0.55 0.15 140)', 'oklch(0.55 0.15 185)'],
    },
    chipStyle: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 400,
      color: '#e5e7eb',
      backgroundColor: '#1f2937',
      borderRadius: '4px',
      border: '1px solid #374151',
    },
  },
  {
    id: 'tech-sky',
    name: 'TechSky',
    nameJa: 'テック スカイ',
    baseStyle: 'Tech',
    color: 'Sky',
    style: {
      name: 'tech-sky',
      bgNormal: 'oklch(0.15 0.02 230)',
      bgCover: 'oklch(0.20 0.08 230)',
      headingColor: 'oklch(0.75 0.15 230)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"JetBrains Mono", "Noto Sans JP", monospace',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.15 0.02 230)',
            primary: 'oklch(0.75 0.15 230)',
      secondary: 'oklch(0.65 0.15 50)',
      chartColors: ['oklch(0.65 0.15 230)', 'oklch(0.65 0.15 275)', 'oklch(0.65 0.15 320)', 'oklch(0.65 0.15 5)', 'oklch(0.65 0.15 50)', 'oklch(0.65 0.15 95)', 'oklch(0.65 0.15 140)', 'oklch(0.65 0.15 185)'],
    },
    chipStyle: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 400,
      color: '#60a5fa',
      backgroundColor: '#1e293b',
      borderRadius: '4px',
      border: '1px solid #3b82f6',
    },
  },
  {
    id: 'tech-lavender',
    name: 'TechLavender',
    nameJa: 'テック ラベン',
    baseStyle: 'Tech',
    color: 'Lavender',
    style: {
      name: 'tech-lavender',
      bgNormal: 'oklch(0.15 0.02 300)',
      bgCover: 'oklch(0.20 0.08 300)',
      headingColor: 'oklch(0.75 0.15 300)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"JetBrains Mono", "Noto Sans JP", monospace',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0',
      baseColor: 'oklch(0.15 0.02 300)',
            primary: 'oklch(0.75 0.15 300)',
      secondary: 'oklch(0.65 0.15 120)',
      chartColors: ['oklch(0.65 0.15 300)', 'oklch(0.65 0.15 345)', 'oklch(0.65 0.15 30)', 'oklch(0.65 0.15 75)', 'oklch(0.65 0.15 120)', 'oklch(0.65 0.15 165)', 'oklch(0.65 0.15 210)', 'oklch(0.65 0.15 255)'],
    },
    chipStyle: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 400,
      color: '#c084fc',
      backgroundColor: '#1e1b2e',
      borderRadius: '4px',
      border: '1px solid #a855f7',
    },
  },

  // ============================================
  // Natural（自然・温かみ）
  // ============================================
  {
    id: 'natural-sand',
    name: 'NatSand',
    nameJa: 'ナチュラ サンド',
    baseStyle: 'Natural',
    color: 'Sand',
    style: {
      name: 'natural-sand',
      bgNormal: 'oklch(0.96 0.03 70)',
      bgCover: 'oklch(0.50 0.08 70)',
      headingColor: 'oklch(0.40 0.10 70)',
      textColor: 'oklch(0.25 0.02 70)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.96 0.03 70)',
            primary: 'oklch(0.40 0.10 70)',
      secondary: 'oklch(0.45 0.10 250)',
      chartColors: ['oklch(0.45 0.10 70)', 'oklch(0.45 0.10 115)', 'oklch(0.45 0.10 160)', 'oklch(0.45 0.10 205)', 'oklch(0.45 0.10 250)', 'oklch(0.45 0.10 295)', 'oklch(0.45 0.10 340)', 'oklch(0.45 0.10 25)'],
    },
    chipStyle: {
      fontFamily: '"Zen Kaku Gothic New", sans-serif',
      fontWeight: 400,
      color: '#78350f',
      backgroundColor: '#fefce8',
      borderRadius: '8px',
      border: '1px solid #fde047',
    },
  },
  {
    id: 'natural-mint',
    name: 'NatMint',
    nameJa: 'ナチュラ ミント',
    baseStyle: 'Natural',
    color: 'Mint',
    style: {
      name: 'natural-mint',
      bgNormal: 'oklch(0.96 0.03 150)',
      bgCover: 'oklch(0.45 0.10 150)',
      headingColor: 'oklch(0.40 0.12 150)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.96 0.03 150)',
            primary: 'oklch(0.40 0.12 150)',
      secondary: 'oklch(0.45 0.12 330)',
      chartColors: ['oklch(0.45 0.12 150)', 'oklch(0.45 0.12 195)', 'oklch(0.45 0.12 240)', 'oklch(0.45 0.12 285)', 'oklch(0.45 0.12 330)', 'oklch(0.45 0.12 15)', 'oklch(0.45 0.12 60)', 'oklch(0.45 0.12 105)'],
    },
    chipStyle: {
      fontFamily: '"Zen Kaku Gothic New", sans-serif',
      fontWeight: 400,
      color: '#166534',
      backgroundColor: '#f0fdf4',
      borderRadius: '8px',
      border: '1px solid #86efac',
    },
  },
  {
    id: 'natural-gray',
    name: 'NatGray',
    nameJa: 'ナチュラ グレー',
    baseStyle: 'Natural',
    color: 'Gray',
    style: {
      name: 'natural-gray',
      bgNormal: 'oklch(0.96 0.01 60)',
      bgCover: 'oklch(0.40 0.03 60)',
      headingColor: 'oklch(0.35 0.04 60)',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.96 0.01 60)',
            primary: 'oklch(0.35 0.04 60)',
      secondary: 'oklch(0.45 0.10 240)',
      chartColors: ['oklch(0.45 0.10 60)', 'oklch(0.45 0.10 105)', 'oklch(0.45 0.10 150)', 'oklch(0.45 0.10 195)', 'oklch(0.45 0.10 240)', 'oklch(0.45 0.10 285)', 'oklch(0.45 0.10 330)', 'oklch(0.45 0.10 15)'],
    },
    chipStyle: {
      fontFamily: '"Zen Kaku Gothic New", sans-serif',
      fontWeight: 400,
      color: '#44403c',
      backgroundColor: '#fafaf9',
      borderRadius: '8px',
      border: '1px solid #d6d3d1',
    },
  },

  // ============================================
  // Gradient（グラデーション）
  // ============================================
  {
    id: 'gradient-sunset',
    name: 'GradSunset',
    nameJa: 'グラデ サンセ',
    baseStyle: 'Gradient',
    color: 'Coral',
    style: {
      name: 'gradient-sunset',
      bgNormal: 'linear-gradient(135deg, oklch(0.92 0.08 55), oklch(0.88 0.12 25))',
      bgCover: 'linear-gradient(135deg, oklch(0.50 0.15 55), oklch(0.45 0.18 25))',
      headingColor: 'linear-gradient(90deg, oklch(0.55 0.18 55), oklch(0.50 0.20 25))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.92 0.08 55), oklch(0.88 0.12 25))',
            primary: 'linear-gradient(90deg, oklch(0.55 0.18 55), oklch(0.50 0.20 25))',
      secondary: 'oklch(0.55 0.18 235)',
      chartColors: ['oklch(0.55 0.18 55)', 'oklch(0.55 0.18 100)', 'oklch(0.55 0.18 145)', 'oklch(0.55 0.18 190)', 'oklch(0.55 0.18 235)', 'oklch(0.55 0.18 280)', 'oklch(0.55 0.18 325)', 'oklch(0.55 0.18 10)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #c2410c, #ea580c)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-ocean',
    name: 'GradOcean',
    nameJa: 'グラデ オーシャ',
    baseStyle: 'Gradient',
    color: 'Sky',
    style: {
      name: 'gradient-ocean',
      bgNormal: 'linear-gradient(135deg, oklch(0.90 0.06 200), oklch(0.85 0.10 240))',
      bgCover: 'linear-gradient(135deg, oklch(0.55 0.12 200), oklch(0.45 0.15 240))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.15 200), oklch(0.45 0.18 240))',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.90 0.06 200), oklch(0.85 0.10 240))',
            primary: 'linear-gradient(90deg, oklch(0.50 0.15 200), oklch(0.45 0.18 240))',
      secondary: 'oklch(0.50 0.15 20)',
      chartColors: ['oklch(0.50 0.15 200)', 'oklch(0.50 0.15 245)', 'oklch(0.50 0.15 290)', 'oklch(0.50 0.15 335)', 'oklch(0.50 0.15 20)', 'oklch(0.50 0.15 65)', 'oklch(0.50 0.15 110)', 'oklch(0.50 0.15 155)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #0c4a6e, #0891b2)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-forest',
    name: 'GradForest',
    nameJa: 'グラデ フォレス',
    baseStyle: 'Gradient',
    color: 'Mint',
    style: {
      name: 'gradient-forest',
      bgNormal: 'linear-gradient(135deg, oklch(0.88 0.06 170), oklch(0.85 0.08 150))',
      bgCover: 'linear-gradient(135deg, oklch(0.50 0.10 170), oklch(0.45 0.12 150))',
      headingColor: 'linear-gradient(90deg, oklch(0.45 0.12 170), oklch(0.40 0.14 150))',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.88 0.06 170), oklch(0.85 0.08 150))',
            primary: 'linear-gradient(90deg, oklch(0.45 0.12 170), oklch(0.40 0.14 150))',
      secondary: 'oklch(0.45 0.12 350)',
      chartColors: ['oklch(0.45 0.12 170)', 'oklch(0.45 0.12 215)', 'oklch(0.45 0.12 260)', 'oklch(0.45 0.12 305)', 'oklch(0.45 0.12 350)', 'oklch(0.45 0.12 35)', 'oklch(0.45 0.12 80)', 'oklch(0.45 0.12 125)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #064e3b, #059669)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-lavender',
    name: 'GradLav',
    nameJa: 'グラデ ラベン',
    baseStyle: 'Gradient',
    color: 'Lavender',
    style: {
      name: 'gradient-lavender',
      bgNormal: 'linear-gradient(135deg, oklch(0.90 0.08 300), oklch(0.88 0.10 340))',
      bgCover: 'linear-gradient(135deg, oklch(0.55 0.15 300), oklch(0.50 0.18 340))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.18 300), oklch(0.45 0.20 340))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.90 0.08 300), oklch(0.88 0.10 340))',
            primary: 'linear-gradient(90deg, oklch(0.50 0.18 300), oklch(0.45 0.20 340))',
      secondary: 'oklch(0.50 0.18 120)',
      chartColors: ['oklch(0.50 0.18 300)', 'oklch(0.50 0.18 345)', 'oklch(0.50 0.18 30)', 'oklch(0.50 0.18 75)', 'oklch(0.50 0.18 120)', 'oklch(0.50 0.18 165)', 'oklch(0.50 0.18 210)', 'oklch(0.50 0.18 255)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #581c87, #a855f7)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-midnight',
    name: 'GradMid',
    nameJa: 'グラデ ミドナイ',
    baseStyle: 'Gradient',
    color: 'Sky',
    style: {
      name: 'gradient-midnight',
      bgNormal: 'linear-gradient(135deg, oklch(0.20 0.04 260), oklch(0.18 0.06 290))',
      bgCover: 'linear-gradient(135deg, oklch(0.15 0.06 260), oklch(0.12 0.08 290))',
      headingColor: 'linear-gradient(90deg, oklch(0.70 0.12 230), oklch(0.65 0.15 200))',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.20 0.04 260), oklch(0.18 0.06 290))',
            primary: 'linear-gradient(90deg, oklch(0.70 0.12 230), oklch(0.65 0.15 200))',
      secondary: 'oklch(0.65 0.12 50)',
      chartColors: ['oklch(0.65 0.12 230)', 'oklch(0.65 0.12 275)', 'oklch(0.65 0.12 320)', 'oklch(0.65 0.12 5)', 'oklch(0.65 0.12 50)', 'oklch(0.65 0.12 95)', 'oklch(0.65 0.12 140)', 'oklch(0.65 0.12 185)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#e0f2fe',
      backgroundColor: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-peach',
    name: 'GradPeach',
    nameJa: 'グラデ ピーチ',
    baseStyle: 'Gradient',
    color: 'Coral',
    style: {
      name: 'gradient-peach',
      bgNormal: 'linear-gradient(135deg, oklch(0.95 0.04 70), oklch(0.90 0.08 40))',
      bgCover: 'linear-gradient(135deg, oklch(0.50 0.12 70), oklch(0.45 0.14 40))',
      headingColor: 'linear-gradient(90deg, oklch(0.60 0.15 40), oklch(0.55 0.18 15))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.95 0.04 70), oklch(0.90 0.08 40))',
            primary: 'linear-gradient(90deg, oklch(0.60 0.15 40), oklch(0.55 0.18 15))',
      secondary: 'oklch(0.60 0.15 220)',
      chartColors: ['oklch(0.60 0.15 40)', 'oklch(0.60 0.15 85)', 'oklch(0.60 0.15 130)', 'oklch(0.60 0.15 175)', 'oklch(0.60 0.15 220)', 'oklch(0.60 0.15 265)', 'oklch(0.60 0.15 310)', 'oklch(0.60 0.15 355)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #9a3412, #ea580c)',
      borderRadius: '12px',
    },
  },

  // ============================================
  // Multi-color Gradients（マルチカラーグラデーション）
  // ============================================
  {
    id: 'gradient-aurora',
    name: 'GradAurora',
    nameJa: 'グラデ オーロラ',
    baseStyle: 'Gradient',
    color: 'Lavender',
    style: {
      name: 'gradient-aurora',
      bgNormal: 'linear-gradient(135deg, oklch(0.85 0.12 290), oklch(0.88 0.14 350), oklch(0.90 0.10 40))',
      bgCover: 'linear-gradient(135deg, oklch(0.45 0.15 290), oklch(0.48 0.18 350), oklch(0.50 0.14 40))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.18 290), oklch(0.52 0.20 350), oklch(0.55 0.16 40))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.85 0.12 290), oklch(0.88 0.14 350), oklch(0.90 0.10 40))',
            primary: 'linear-gradient(90deg, oklch(0.50 0.18 290), oklch(0.52 0.20 350), oklch(0.55 0.16 40))',
      secondary: 'oklch(0.50 0.18 110)',
      chartColors: ['oklch(0.50 0.18 290)', 'oklch(0.50 0.18 335)', 'oklch(0.50 0.18 20)', 'oklch(0.50 0.18 65)', 'oklch(0.50 0.18 110)', 'oklch(0.50 0.18 155)', 'oklch(0.50 0.18 200)', 'oklch(0.50 0.18 245)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #7c3aed, #ec4899, #f97316)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-dawn',
    name: 'GradDawn',
    nameJa: 'グラデ ドーン',
    baseStyle: 'Gradient',
    color: 'Sky',
    style: {
      name: 'gradient-dawn',
      bgNormal: 'linear-gradient(90deg, oklch(0.92 0.06 40), oklch(0.94 0.04 300), oklch(0.92 0.06 220))',
      bgCover: 'linear-gradient(90deg, oklch(0.50 0.10 40), oklch(0.48 0.08 300), oklch(0.45 0.12 220))',
      headingColor: 'linear-gradient(90deg, oklch(0.55 0.12 40), oklch(0.50 0.10 300), oklch(0.48 0.14 220))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(90deg, oklch(0.92 0.06 40), oklch(0.94 0.04 300), oklch(0.92 0.06 220))',
            primary: 'linear-gradient(90deg, oklch(0.55 0.12 40), oklch(0.50 0.10 300), oklch(0.48 0.14 220))',
      secondary: 'oklch(0.55 0.12 220)',
      chartColors: ['oklch(0.55 0.12 40)', 'oklch(0.55 0.12 85)', 'oklch(0.55 0.12 130)', 'oklch(0.55 0.12 175)', 'oklch(0.55 0.12 220)', 'oklch(0.55 0.12 265)', 'oklch(0.55 0.12 310)', 'oklch(0.55 0.12 355)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(90deg, #ea580c, #a855f7, #0284c7)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-instagram',
    name: 'GradInsta',
    nameJa: 'グラデ インスタ',
    baseStyle: 'Gradient',
    color: 'Coral',
    style: {
      name: 'gradient-instagram',
      bgNormal: 'linear-gradient(135deg, oklch(0.82 0.14 290), oklch(0.85 0.16 350), oklch(0.88 0.14 40), oklch(0.90 0.12 80))',
      bgCover: 'linear-gradient(135deg, oklch(0.42 0.18 290), oklch(0.45 0.20 350), oklch(0.48 0.18 40), oklch(0.50 0.16 80))',
      headingColor: 'linear-gradient(90deg, oklch(0.48 0.20 290), oklch(0.50 0.22 350), oklch(0.52 0.18 40))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.85 0.12 350)',
      primary: 'linear-gradient(90deg, oklch(0.48 0.20 290), oklch(0.50 0.22 350), oklch(0.52 0.18 40))',
      secondary: 'oklch(0.48 0.18 110)',
      chartColors: ['oklch(0.48 0.18 290)', 'oklch(0.48 0.18 335)', 'oklch(0.48 0.18 20)', 'oklch(0.48 0.18 65)', 'oklch(0.48 0.18 110)', 'oklch(0.48 0.18 155)', 'oklch(0.48 0.18 200)', 'oklch(0.48 0.18 245)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-stripe',
    name: 'GradientStripe',
    nameJa: 'グラデ ストライ',
    baseStyle: 'Gradient',
    color: 'Sky',
    style: {
      name: 'gradient-stripe',
      bgNormal: 'linear-gradient(135deg, oklch(0.88 0.10 200), oklch(0.85 0.14 250), oklch(0.82 0.16 290))',
      bgCover: 'linear-gradient(135deg, oklch(0.48 0.14 200), oklch(0.45 0.18 250), oklch(0.42 0.20 290))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.16 200), oklch(0.48 0.18 250), oklch(0.45 0.20 290))',
      textColor: 'oklch(0.20 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.88 0.10 200), oklch(0.85 0.14 250), oklch(0.82 0.16 290))',
            primary: 'linear-gradient(90deg, oklch(0.50 0.16 200), oklch(0.48 0.18 250), oklch(0.45 0.20 290))',
      secondary: 'oklch(0.50 0.16 20)',
      chartColors: ['oklch(0.50 0.16 200)', 'oklch(0.50 0.16 245)', 'oklch(0.50 0.16 290)', 'oklch(0.50 0.16 335)', 'oklch(0.50 0.16 20)', 'oklch(0.50 0.16 65)', 'oklch(0.50 0.16 110)', 'oklch(0.50 0.16 155)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #0891b2, #6366f1, #7c3aed)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-firefox',
    name: 'GradFire',
    nameJa: 'グラデ ファイア',
    baseStyle: 'Gradient',
    color: 'Coral',
    style: {
      name: 'gradient-firefox',
      bgNormal: 'linear-gradient(135deg, oklch(0.88 0.14 55), oklch(0.85 0.18 25), oklch(0.82 0.16 320))',
      bgCover: 'linear-gradient(135deg, oklch(0.50 0.18 55), oklch(0.45 0.22 25), oklch(0.42 0.20 320))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.20 55), oklch(0.45 0.22 25), oklch(0.43 0.18 320))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.88 0.14 55), oklch(0.85 0.18 25), oklch(0.82 0.16 320))',
            primary: 'linear-gradient(90deg, oklch(0.50 0.20 55), oklch(0.45 0.22 25), oklch(0.43 0.18 320))',
      secondary: 'oklch(0.50 0.18 235)',
      chartColors: ['oklch(0.50 0.18 55)', 'oklch(0.50 0.18 100)', 'oklch(0.50 0.18 145)', 'oklch(0.50 0.18 190)', 'oklch(0.50 0.18 235)', 'oklch(0.50 0.18 280)', 'oklch(0.50 0.18 325)', 'oklch(0.50 0.18 10)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #ff9500, #ff0039, #9400ff)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-linear',
    name: 'GradLinear',
    nameJa: 'グラデ リニア',
    baseStyle: 'Gradient',
    color: 'Lavender',
    style: {
      name: 'gradient-linear',
      bgNormal: 'linear-gradient(135deg, oklch(0.85 0.12 270), oklch(0.82 0.16 290), oklch(0.80 0.18 330))',
      bgCover: 'linear-gradient(135deg, oklch(0.45 0.16 270), oklch(0.42 0.20 290), oklch(0.40 0.22 330))',
      headingColor: 'linear-gradient(90deg, oklch(0.50 0.18 270), oklch(0.48 0.20 290), oklch(0.45 0.22 330))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.85 0.12 270), oklch(0.82 0.16 290), oklch(0.80 0.18 330))',
            primary: 'linear-gradient(90deg, oklch(0.50 0.18 270), oklch(0.48 0.20 290), oklch(0.45 0.22 330))',
      secondary: 'oklch(0.50 0.18 90)',
      chartColors: ['oklch(0.50 0.18 270)', 'oklch(0.50 0.18 315)', 'oklch(0.50 0.18 0)', 'oklch(0.50 0.18 45)', 'oklch(0.50 0.18 90)', 'oklch(0.50 0.18 135)', 'oklch(0.50 0.18 180)', 'oklch(0.50 0.18 225)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #4f46e5, #7c3aed, #c026d3)',
      borderRadius: '12px',
    },
  },
  {
    id: 'gradient-apple',
    name: 'GradApple',
    nameJa: 'グラデ アップル',
    baseStyle: 'Gradient',
    color: 'Lavender',
    style: {
      name: 'gradient-apple',
      bgNormal: 'linear-gradient(135deg, oklch(0.88 0.12 350), oklch(0.85 0.14 290), oklch(0.82 0.12 240))',
      bgCover: 'linear-gradient(135deg, oklch(0.48 0.16 350), oklch(0.45 0.18 290), oklch(0.42 0.16 240))',
      headingColor: 'linear-gradient(90deg, oklch(0.52 0.18 350), oklch(0.50 0.20 290), oklch(0.48 0.18 240))',
      textColor: 'oklch(0.25 0.00 0)',
      fontHeading: '"Noto Sans JP", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'linear-gradient(135deg, oklch(0.88 0.12 350), oklch(0.85 0.14 290), oklch(0.82 0.12 240))',
            primary: 'linear-gradient(90deg, oklch(0.52 0.18 350), oklch(0.50 0.20 290), oklch(0.48 0.18 240))',
      secondary: 'oklch(0.52 0.18 170)',
      chartColors: ['oklch(0.52 0.18 350)', 'oklch(0.52 0.18 35)', 'oklch(0.52 0.18 80)', 'oklch(0.52 0.18 125)', 'oklch(0.52 0.18 170)', 'oklch(0.52 0.18 215)', 'oklch(0.52 0.18 260)', 'oklch(0.52 0.18 305)'],
    },
    chipStyle: {
      fontFamily: '"Noto Sans JP", sans-serif',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
      borderRadius: '12px',
    },
  },

  // ============================================
  // Neon（ネオンサイン・筆記体風）
  // ============================================
  {
    id: 'neon-pink',
    name: 'NeonPink',
    nameJa: 'ネオン ピンク',
    baseStyle: 'Neon',
    color: 'Pink',
    style: {
      name: 'neon-pink',
      bgNormal: 'oklch(0.12 0.01 350)',
      bgCover: 'oklch(0.08 0.01 350)',
      headingColor: 'oklch(0.78 0.18 350)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Pacifico", cursive',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 350)',
            primary: 'oklch(0.78 0.18 350)',
      secondary: 'oklch(0.65 0.18 170)',
      chartColors: ['oklch(0.65 0.18 350)', 'oklch(0.65 0.18 35)', 'oklch(0.65 0.18 80)', 'oklch(0.65 0.18 125)', 'oklch(0.65 0.18 170)', 'oklch(0.65 0.18 215)', 'oklch(0.65 0.18 260)', 'oklch(0.65 0.18 305)'],
    },
    chipStyle: {
      fontFamily: '"Pacifico", cursive',
      fontWeight: 400,
      color: 'oklch(0.78 0.18 350)',
      backgroundColor: '#1a1a1a',
      borderRadius: '20px',
      border: '1px solid oklch(0.78 0.18 350)',
    },
  },
  {
    id: 'neon-cyan',
    name: 'NeonCyan',
    nameJa: 'ネオン シアン',
    baseStyle: 'Neon',
    color: 'Cyan',
    style: {
      name: 'neon-cyan',
      bgNormal: 'oklch(0.12 0.01 200)',
      bgCover: 'oklch(0.08 0.01 200)',
      headingColor: 'oklch(0.85 0.12 200)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Pacifico", cursive',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 200)',
            primary: 'oklch(0.85 0.12 200)',
      secondary: 'oklch(0.65 0.12 20)',
      chartColors: ['oklch(0.65 0.12 200)', 'oklch(0.65 0.12 245)', 'oklch(0.65 0.12 290)', 'oklch(0.65 0.12 335)', 'oklch(0.65 0.12 20)', 'oklch(0.65 0.12 65)', 'oklch(0.65 0.12 110)', 'oklch(0.65 0.12 155)'],
    },
    chipStyle: {
      fontFamily: '"Pacifico", cursive',
      fontWeight: 400,
      color: 'oklch(0.85 0.12 200)',
      backgroundColor: '#1a1a1a',
      borderRadius: '20px',
      border: '1px solid oklch(0.85 0.12 200)',
    },
  },
  {
    id: 'neon-lime',
    name: 'NeonLime',
    nameJa: 'ネオン ライム',
    baseStyle: 'Neon',
    color: 'Lime',
    style: {
      name: 'neon-lime',
      bgNormal: 'oklch(0.12 0.01 130)',
      bgCover: 'oklch(0.08 0.01 130)',
      headingColor: 'oklch(0.82 0.18 130)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Pacifico", cursive',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 130)',
            primary: 'oklch(0.82 0.18 130)',
      secondary: 'oklch(0.65 0.18 310)',
      chartColors: ['oklch(0.65 0.18 130)', 'oklch(0.65 0.18 175)', 'oklch(0.65 0.18 220)', 'oklch(0.65 0.18 265)', 'oklch(0.65 0.18 310)', 'oklch(0.65 0.18 355)', 'oklch(0.65 0.18 40)', 'oklch(0.65 0.18 85)'],
    },
    chipStyle: {
      fontFamily: '"Pacifico", cursive',
      fontWeight: 400,
      color: 'oklch(0.82 0.18 130)',
      backgroundColor: '#1a1a1a',
      borderRadius: '20px',
      border: '1px solid oklch(0.82 0.18 130)',
    },
  },
  {
    id: 'neon-yellow',
    name: 'NeonYellow',
    nameJa: 'ネオン イエロー',
    baseStyle: 'Neon',
    color: 'Yellow',
    style: {
      name: 'neon-yellow',
      bgNormal: 'oklch(0.12 0.01 90)',
      bgCover: 'oklch(0.08 0.01 90)',
      headingColor: 'oklch(0.90 0.15 90)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Pacifico", cursive',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 90)',
            primary: 'oklch(0.90 0.15 90)',
      secondary: 'oklch(0.65 0.15 270)',
      chartColors: ['oklch(0.65 0.15 90)', 'oklch(0.65 0.15 135)', 'oklch(0.65 0.15 180)', 'oklch(0.65 0.15 225)', 'oklch(0.65 0.15 270)', 'oklch(0.65 0.15 315)', 'oklch(0.65 0.15 0)', 'oklch(0.65 0.15 45)'],
    },
    chipStyle: {
      fontFamily: '"Pacifico", cursive',
      fontWeight: 400,
      color: 'oklch(0.90 0.15 90)',
      backgroundColor: '#1a1a1a',
      borderRadius: '20px',
      border: '1px solid oklch(0.90 0.15 90)',
    },
  },

  // ============================================
  // NeonBold（ネオンサイン・太字サンセリフ風）
  // ============================================
  {
    id: 'neon-bold-pink',
    name: 'NeonBoldPink',
    nameJa: 'ネオン太 ピンク',
    baseStyle: 'NeonBold',
    color: 'Pink',
    style: {
      name: 'neon-bold-pink',
      bgNormal: 'oklch(0.12 0.01 350)',
      bgCover: 'oklch(0.08 0.01 350)',
      headingColor: 'oklch(0.78 0.18 350)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Teko", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.12 0.01 350)',
            primary: 'oklch(0.78 0.18 350)',
      secondary: 'oklch(0.65 0.18 170)',
      chartColors: ['oklch(0.65 0.18 350)', 'oklch(0.65 0.18 35)', 'oklch(0.65 0.18 80)', 'oklch(0.65 0.18 125)', 'oklch(0.65 0.18 170)', 'oklch(0.65 0.18 215)', 'oklch(0.65 0.18 260)', 'oklch(0.65 0.18 305)'],
    },
    chipStyle: {
      fontFamily: '"Teko", sans-serif',
      fontWeight: 600,
      color: 'oklch(0.78 0.18 350)',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: '2px solid oklch(0.78 0.18 350)',
    },
  },
  {
    id: 'neon-bold-cyan',
    name: 'NeonBoldCyan',
    nameJa: 'ネオン太 シアン',
    baseStyle: 'NeonBold',
    color: 'Cyan',
    style: {
      name: 'neon-bold-cyan',
      bgNormal: 'oklch(0.12 0.01 200)',
      bgCover: 'oklch(0.08 0.01 200)',
      headingColor: 'oklch(0.85 0.12 200)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Teko", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.12 0.01 200)',
            primary: 'oklch(0.85 0.12 200)',
      secondary: 'oklch(0.65 0.12 20)',
      chartColors: ['oklch(0.65 0.12 200)', 'oklch(0.65 0.12 245)', 'oklch(0.65 0.12 290)', 'oklch(0.65 0.12 335)', 'oklch(0.65 0.12 20)', 'oklch(0.65 0.12 65)', 'oklch(0.65 0.12 110)', 'oklch(0.65 0.12 155)'],
    },
    chipStyle: {
      fontFamily: '"Teko", sans-serif',
      fontWeight: 600,
      color: 'oklch(0.85 0.12 200)',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: '2px solid oklch(0.85 0.12 200)',
    },
  },
  {
    id: 'neon-bold-lime',
    name: 'NeonBoldLime',
    nameJa: 'ネオン太 ライム',
    baseStyle: 'NeonBold',
    color: 'Lime',
    style: {
      name: 'neon-bold-lime',
      bgNormal: 'oklch(0.12 0.01 130)',
      bgCover: 'oklch(0.08 0.01 130)',
      headingColor: 'oklch(0.82 0.18 130)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Teko", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.12 0.01 130)',
            primary: 'oklch(0.82 0.18 130)',
      secondary: 'oklch(0.65 0.18 310)',
      chartColors: ['oklch(0.65 0.18 130)', 'oklch(0.65 0.18 175)', 'oklch(0.65 0.18 220)', 'oklch(0.65 0.18 265)', 'oklch(0.65 0.18 310)', 'oklch(0.65 0.18 355)', 'oklch(0.65 0.18 40)', 'oklch(0.65 0.18 85)'],
    },
    chipStyle: {
      fontFamily: '"Teko", sans-serif',
      fontWeight: 600,
      color: 'oklch(0.82 0.18 130)',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: '2px solid oklch(0.82 0.18 130)',
    },
  },
  {
    id: 'neon-bold-yellow',
    name: 'NeonBoldYellow',
    nameJa: 'ネオン太 イエロー',
    baseStyle: 'NeonBold',
    color: 'Yellow',
    style: {
      name: 'neon-bold-yellow',
      bgNormal: 'oklch(0.12 0.01 90)',
      bgCover: 'oklch(0.08 0.01 90)',
      headingColor: 'oklch(0.90 0.15 90)',
      textColor: 'oklch(0.85 0.00 0)',
      fontHeading: '"Teko", sans-serif',
      fontBody: '"Noto Sans JP", sans-serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.12 0.01 90)',
            primary: 'oklch(0.90 0.15 90)',
      secondary: 'oklch(0.65 0.15 270)',
      chartColors: ['oklch(0.65 0.15 90)', 'oklch(0.65 0.15 135)', 'oklch(0.65 0.15 180)', 'oklch(0.65 0.15 225)', 'oklch(0.65 0.15 270)', 'oklch(0.65 0.15 315)', 'oklch(0.65 0.15 0)', 'oklch(0.65 0.15 45)'],
    },
    chipStyle: {
      fontFamily: '"Teko", sans-serif',
      fontWeight: 600,
      color: 'oklch(0.90 0.15 90)',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      border: '2px solid oklch(0.90 0.15 90)',
    },
  },

  // ============================================
  // Handwritten（手書き風）- Yomogi
  // ============================================
  {
    id: 'handwritten-coral',
    name: 'HandCoral',
    nameJa: '手書き コーラル',
    baseStyle: 'Handwritten',
    color: 'Coral',
    style: {
      name: 'handwritten-coral',
      bgNormal: 'oklch(0.98 0.02 50)',
      bgCover: 'oklch(0.55 0.18 25)',
      headingColor: 'oklch(0.50 0.20 25)',
      textColor: 'oklch(0.25 0.02 50)',
      fontHeading: '"Yomogi", "Shantell Sans", cursive',
      fontBody: '"Yomogi", "Shantell Sans", cursive',
      letterSpacing: '0.01em',
      baseColor: 'oklch(0.98 0.02 50)',
            primary: 'oklch(0.50 0.20 25)',
      secondary: 'oklch(0.50 0.18 205)',
      chartColors: ['oklch(0.50 0.18 25)', 'oklch(0.50 0.18 70)', 'oklch(0.50 0.18 115)', 'oklch(0.50 0.18 160)', 'oklch(0.50 0.18 205)', 'oklch(0.50 0.18 250)', 'oklch(0.50 0.18 295)', 'oklch(0.50 0.18 340)'],
    },
    chipStyle: {
      fontFamily: '"Yomogi", "Shantell Sans", cursive',
      fontWeight: 400,
      color: '#e07b5a',
      backgroundColor: '#fef7f5',
      borderRadius: '16px',
      border: '2px solid #e07b5a',
    },
  },
  {
    id: 'handwritten-sky',
    name: 'HandSky',
    nameJa: '手書き スカイ',
    baseStyle: 'Handwritten',
    color: 'Sky',
    style: {
      name: 'handwritten-sky',
      bgNormal: 'oklch(0.97 0.02 230)',
      bgCover: 'oklch(0.50 0.15 230)',
      headingColor: 'oklch(0.45 0.18 230)',
      textColor: 'oklch(0.25 0.02 230)',
      fontHeading: '"Yomogi", "Shantell Sans", cursive',
      fontBody: '"Yomogi", "Shantell Sans", cursive',
      letterSpacing: '0.01em',
      baseColor: 'oklch(0.97 0.02 230)',
            primary: 'oklch(0.45 0.18 230)',
      secondary: 'oklch(0.45 0.18 50)',
      chartColors: ['oklch(0.45 0.18 230)', 'oklch(0.45 0.18 275)', 'oklch(0.45 0.18 320)', 'oklch(0.45 0.18 5)', 'oklch(0.45 0.18 50)', 'oklch(0.45 0.18 95)', 'oklch(0.45 0.18 140)', 'oklch(0.45 0.18 185)'],
    },
    chipStyle: {
      fontFamily: '"Yomogi", "Shantell Sans", cursive',
      fontWeight: 400,
      color: '#4a90d9',
      backgroundColor: '#f0f7ff',
      borderRadius: '16px',
      border: '2px solid #4a90d9',
    },
  },
  {
    id: 'handwritten-mint',
    name: 'HandMint',
    nameJa: '手書き ミント',
    baseStyle: 'Handwritten',
    color: 'Mint',
    style: {
      name: 'handwritten-mint',
      bgNormal: 'oklch(0.97 0.02 160)',
      bgCover: 'oklch(0.50 0.12 160)',
      headingColor: 'oklch(0.45 0.15 160)',
      textColor: 'oklch(0.25 0.02 160)',
      fontHeading: '"Yomogi", "Shantell Sans", cursive',
      fontBody: '"Yomogi", "Shantell Sans", cursive',
      letterSpacing: '0.01em',
      baseColor: 'oklch(0.97 0.02 160)',
            primary: 'oklch(0.45 0.15 160)',
      secondary: 'oklch(0.45 0.15 340)',
      chartColors: ['oklch(0.45 0.15 160)', 'oklch(0.45 0.15 205)', 'oklch(0.45 0.15 250)', 'oklch(0.45 0.15 295)', 'oklch(0.45 0.15 340)', 'oklch(0.45 0.15 25)', 'oklch(0.45 0.15 70)', 'oklch(0.45 0.15 115)'],
    },
    chipStyle: {
      fontFamily: '"Yomogi", "Shantell Sans", cursive',
      fontWeight: 400,
      color: '#3d9970',
      backgroundColor: '#f0fdf7',
      borderRadius: '16px',
      border: '2px solid #3d9970',
    },
  },
  {
    id: 'handwritten-lavender',
    name: 'HandLav',
    nameJa: '手書き ラベンダー',
    baseStyle: 'Handwritten',
    color: 'Lavender',
    style: {
      name: 'handwritten-lavender',
      bgNormal: 'oklch(0.97 0.03 290)',
      bgCover: 'oklch(0.50 0.15 290)',
      headingColor: 'oklch(0.50 0.18 290)',
      textColor: 'oklch(0.25 0.02 290)',
      fontHeading: '"Yomogi", "Shantell Sans", cursive',
      fontBody: '"Yomogi", "Shantell Sans", cursive',
      letterSpacing: '0.01em',
      baseColor: 'oklch(0.97 0.03 290)',
            primary: 'oklch(0.50 0.18 290)',
      secondary: 'oklch(0.50 0.18 110)',
      chartColors: ['oklch(0.50 0.18 290)', 'oklch(0.50 0.18 335)', 'oklch(0.50 0.18 20)', 'oklch(0.50 0.18 65)', 'oklch(0.50 0.18 110)', 'oklch(0.50 0.18 155)', 'oklch(0.50 0.18 200)', 'oklch(0.50 0.18 245)'],
    },
    chipStyle: {
      fontFamily: '"Yomogi", "Shantell Sans", cursive',
      fontWeight: 400,
      color: '#8b6fc0',
      backgroundColor: '#f8f5ff',
      borderRadius: '16px',
      border: '2px solid #8b6fc0',
    },
  },

  // ============================================
  // DarkTech（ダーク テック・モダン）
  // ============================================
  {
    id: 'dark-tech-blue',
    name: 'DarkTechBlue',
    nameJa: 'ダーク テック ブルー',
    baseStyle: 'DarkTech',
    color: 'Cyan',
    style: {
      name: 'dark-tech-blue',
      bgNormal: 'oklch(0.12 0.01 230)',
      bgCover: 'oklch(0.08 0.02 230)',
      headingColor: 'linear-gradient(90deg, oklch(0.80 0.15 220), oklch(0.78 0.18 320))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS 1 Code", monospace',
      fontBody: '"M PLUS 1 Code", monospace',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 230)',
            primary: 'linear-gradient(90deg, oklch(0.80 0.15 220), oklch(0.78 0.18 320))',
      secondary: 'oklch(0.65 0.15 40)',
      chartColors: ['oklch(0.65 0.15 220)', 'oklch(0.65 0.15 265)', 'oklch(0.65 0.15 310)', 'oklch(0.65 0.15 355)', 'oklch(0.65 0.15 40)', 'oklch(0.65 0.15 85)', 'oklch(0.65 0.15 130)', 'oklch(0.65 0.15 175)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS 1 Code", monospace',
      fontWeight: 500,
      color: 'oklch(0.80 0.15 220)',
      backgroundColor: '#0a0a0a',
      borderRadius: '4px',
      border: '1px solid oklch(0.80 0.15 220)',
    },
  },
  {
    id: 'dark-tech-green',
    name: 'DarkTechGreen',
    nameJa: 'ダーク テック グリーン',
    baseStyle: 'DarkTech',
    color: 'Mint',
    style: {
      name: 'dark-tech-green',
      bgNormal: 'oklch(0.12 0.01 160)',
      bgCover: 'oklch(0.08 0.02 160)',
      headingColor: 'linear-gradient(90deg, oklch(0.82 0.18 150), oklch(0.80 0.15 220))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS 1 Code", monospace',
      fontBody: '"M PLUS 1 Code", monospace',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 160)',
            primary: 'linear-gradient(90deg, oklch(0.82 0.18 150), oklch(0.80 0.15 220))',
      secondary: 'oklch(0.65 0.18 330)',
      chartColors: ['oklch(0.65 0.18 150)', 'oklch(0.65 0.18 195)', 'oklch(0.65 0.18 240)', 'oklch(0.65 0.18 285)', 'oklch(0.65 0.18 330)', 'oklch(0.65 0.18 15)', 'oklch(0.65 0.18 60)', 'oklch(0.65 0.18 105)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS 1 Code", monospace',
      fontWeight: 500,
      color: 'oklch(0.82 0.18 150)',
      backgroundColor: '#0a0a0a',
      borderRadius: '4px',
      border: '1px solid oklch(0.82 0.18 150)',
    },
  },
  {
    id: 'dark-tech-purple',
    name: 'DarkTechPurple',
    nameJa: 'ダーク テック パープル',
    baseStyle: 'DarkTech',
    color: 'Lavender',
    style: {
      name: 'dark-tech-purple',
      bgNormal: 'oklch(0.12 0.01 290)',
      bgCover: 'oklch(0.08 0.02 290)',
      headingColor: 'linear-gradient(90deg, oklch(0.78 0.15 300), oklch(0.78 0.18 350))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS 1 Code", monospace',
      fontBody: '"M PLUS 1 Code", monospace',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 290)',
            primary: 'linear-gradient(90deg, oklch(0.78 0.15 300), oklch(0.78 0.18 350))',
      secondary: 'oklch(0.65 0.15 120)',
      chartColors: ['oklch(0.65 0.15 300)', 'oklch(0.65 0.15 345)', 'oklch(0.65 0.15 30)', 'oklch(0.65 0.15 75)', 'oklch(0.65 0.15 120)', 'oklch(0.65 0.15 165)', 'oklch(0.65 0.15 210)', 'oklch(0.65 0.15 255)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS 1 Code", monospace',
      fontWeight: 500,
      color: 'oklch(0.78 0.15 300)',
      backgroundColor: '#0a0a0a',
      borderRadius: '4px',
      border: '1px solid oklch(0.78 0.15 300)',
    },
  },
  {
    id: 'dark-tech-orange',
    name: 'DarkTechOrange',
    nameJa: 'ダーク テック オレンジ',
    baseStyle: 'DarkTech',
    color: 'Amber',
    style: {
      name: 'dark-tech-orange',
      bgNormal: 'oklch(0.12 0.01 60)',
      bgCover: 'oklch(0.08 0.02 60)',
      headingColor: 'linear-gradient(90deg, oklch(0.82 0.16 60), oklch(0.78 0.18 350))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS 1 Code", monospace',
      fontBody: '"M PLUS 1 Code", monospace',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.12 0.01 60)',
            primary: 'linear-gradient(90deg, oklch(0.82 0.16 60), oklch(0.78 0.18 350))',
      secondary: 'oklch(0.65 0.16 240)',
      chartColors: ['oklch(0.65 0.16 60)', 'oklch(0.65 0.16 105)', 'oklch(0.65 0.16 150)', 'oklch(0.65 0.16 195)', 'oklch(0.65 0.16 240)', 'oklch(0.65 0.16 285)', 'oklch(0.65 0.16 330)', 'oklch(0.65 0.16 15)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS 1 Code", monospace',
      fontWeight: 500,
      color: 'oklch(0.82 0.16 60)',
      backgroundColor: '#0a0a0a',
      borderRadius: '4px',
      border: '1px solid oklch(0.82 0.16 60)',
    },
  },

  // ============================================
  // DarkElegant（ダーク エレガント・高級感）
  // ============================================
  {
    id: 'dark-elegant-blue',
    name: 'DarkElegBlue',
    nameJa: 'ダーク エレガ ブルー',
    baseStyle: 'DarkElegant',
    color: 'Sky',
    style: {
      name: 'dark-elegant-blue',
      bgNormal: 'oklch(0.15 0.02 250)',
      bgCover: 'oklch(0.10 0.03 250)',
      headingColor: 'linear-gradient(90deg, oklch(0.78 0.12 250), oklch(0.78 0.15 300))',
      textColor: 'oklch(0.95 0 0)',
      fontHeading: '"Shippori Mincho", serif',
      fontBody: '"Noto Serif JP", serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.15 0.02 250)',
            primary: 'linear-gradient(90deg, oklch(0.78 0.12 250), oklch(0.78 0.15 300))',
      secondary: 'oklch(0.65 0.12 70)',
      chartColors: ['oklch(0.65 0.12 250)', 'oklch(0.65 0.12 295)', 'oklch(0.65 0.12 340)', 'oklch(0.65 0.12 25)', 'oklch(0.65 0.12 70)', 'oklch(0.65 0.12 115)', 'oklch(0.65 0.12 160)', 'oklch(0.65 0.12 205)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 500,
      color: 'oklch(0.78 0.12 250)',
      backgroundColor: '#0f172a',
      borderRadius: '2px',
      border: '1px solid oklch(0.78 0.12 250)',
    },
  },
  {
    id: 'dark-elegant-green',
    name: 'DarkElegGreen',
    nameJa: 'ダーク エレガ グリーン',
    baseStyle: 'DarkElegant',
    color: 'Mint',
    style: {
      name: 'dark-elegant-green',
      bgNormal: 'oklch(0.15 0.02 160)',
      bgCover: 'oklch(0.10 0.03 160)',
      headingColor: 'linear-gradient(90deg, oklch(0.80 0.15 160), oklch(0.78 0.12 250))',
      textColor: 'oklch(0.95 0 0)',
      fontHeading: '"Shippori Mincho", serif',
      fontBody: '"Noto Serif JP", serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.15 0.02 160)',
            primary: 'linear-gradient(90deg, oklch(0.80 0.15 160), oklch(0.78 0.12 250))',
      secondary: 'oklch(0.65 0.15 340)',
      chartColors: ['oklch(0.65 0.15 160)', 'oklch(0.65 0.15 205)', 'oklch(0.65 0.15 250)', 'oklch(0.65 0.15 295)', 'oklch(0.65 0.15 340)', 'oklch(0.65 0.15 25)', 'oklch(0.65 0.15 70)', 'oklch(0.65 0.15 115)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 500,
      color: 'oklch(0.80 0.15 160)',
      backgroundColor: '#0f172a',
      borderRadius: '2px',
      border: '1px solid oklch(0.80 0.15 160)',
    },
  },
  {
    id: 'dark-elegant-purple',
    name: 'DarkElegPurple',
    nameJa: 'ダーク エレガ パープル',
    baseStyle: 'DarkElegant',
    color: 'Lavender',
    style: {
      name: 'dark-elegant-purple',
      bgNormal: 'oklch(0.15 0.02 290)',
      bgCover: 'oklch(0.10 0.03 290)',
      headingColor: 'linear-gradient(90deg, oklch(0.78 0.15 300), oklch(0.78 0.18 350))',
      textColor: 'oklch(0.95 0 0)',
      fontHeading: '"Shippori Mincho", serif',
      fontBody: '"Noto Serif JP", serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.15 0.02 290)',
            primary: 'linear-gradient(90deg, oklch(0.78 0.15 300), oklch(0.78 0.18 350))',
      secondary: 'oklch(0.65 0.15 120)',
      chartColors: ['oklch(0.65 0.15 300)', 'oklch(0.65 0.15 345)', 'oklch(0.65 0.15 30)', 'oklch(0.65 0.15 75)', 'oklch(0.65 0.15 120)', 'oklch(0.65 0.15 165)', 'oklch(0.65 0.15 210)', 'oklch(0.65 0.15 255)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 500,
      color: 'oklch(0.78 0.15 300)',
      backgroundColor: '#0f172a',
      borderRadius: '2px',
      border: '1px solid oklch(0.78 0.15 300)',
    },
  },
  {
    id: 'dark-elegant-orange',
    name: 'DarkElegOrange',
    nameJa: 'ダーク エレガ オレンジ',
    baseStyle: 'DarkElegant',
    color: 'Amber',
    style: {
      name: 'dark-elegant-orange',
      bgNormal: 'oklch(0.15 0.02 60)',
      bgCover: 'oklch(0.10 0.03 60)',
      headingColor: 'linear-gradient(90deg, oklch(0.85 0.14 80), oklch(0.78 0.18 350))',
      textColor: 'oklch(0.95 0 0)',
      fontHeading: '"Shippori Mincho", serif',
      fontBody: '"Noto Serif JP", serif',
      letterSpacing: '0.05em',
      baseColor: 'oklch(0.15 0.02 60)',
            primary: 'linear-gradient(90deg, oklch(0.85 0.14 80), oklch(0.78 0.18 350))',
      secondary: 'oklch(0.65 0.14 260)',
      chartColors: ['oklch(0.65 0.14 80)', 'oklch(0.65 0.14 125)', 'oklch(0.65 0.14 170)', 'oklch(0.65 0.14 215)', 'oklch(0.65 0.14 260)', 'oklch(0.65 0.14 305)', 'oklch(0.65 0.14 350)', 'oklch(0.65 0.14 35)'],
    },
    chipStyle: {
      fontFamily: '"Shippori Mincho", serif',
      fontWeight: 500,
      color: 'oklch(0.85 0.14 80)',
      backgroundColor: '#0f172a',
      borderRadius: '2px',
      border: '1px solid oklch(0.85 0.14 80)',
    },
  },

  // ============================================
  // DarkCasual（ダーク カジュアル・親しみやすい）
  // ============================================
  {
    id: 'dark-casual-blue',
    name: 'DarkCasuBlue',
    nameJa: 'ダーク カジュ ブルー',
    baseStyle: 'DarkCasual',
    color: 'Sky',
    style: {
      name: 'dark-casual-blue',
      bgNormal: 'oklch(0.18 0.01 230)',
      bgCover: 'oklch(0.12 0.02 230)',
      headingColor: 'linear-gradient(90deg, oklch(0.78 0.12 220), oklch(0.76 0.14 290))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS Rounded 1c", sans-serif',
      fontBody: '"M PLUS Rounded 1c", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.18 0.01 230)',
            primary: 'linear-gradient(90deg, oklch(0.78 0.12 220), oklch(0.76 0.14 290))',
      secondary: 'oklch(0.65 0.12 40)',
      chartColors: ['oklch(0.65 0.12 220)', 'oklch(0.65 0.12 265)', 'oklch(0.65 0.12 310)', 'oklch(0.65 0.12 355)', 'oklch(0.65 0.12 40)', 'oklch(0.65 0.12 85)', 'oklch(0.65 0.12 130)', 'oklch(0.65 0.12 175)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS Rounded 1c", sans-serif',
      fontWeight: 500,
      color: 'oklch(0.78 0.12 220)',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '2px solid oklch(0.78 0.12 220)',
    },
  },
  {
    id: 'dark-casual-green',
    name: 'DarkCasuGreen',
    nameJa: 'ダーク カジュ グリーン',
    baseStyle: 'DarkCasual',
    color: 'Lime',
    style: {
      name: 'dark-casual-green',
      bgNormal: 'oklch(0.18 0.01 130)',
      bgCover: 'oklch(0.12 0.02 130)',
      headingColor: 'linear-gradient(90deg, oklch(0.85 0.18 115), oklch(0.78 0.12 220))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS Rounded 1c", sans-serif',
      fontBody: '"M PLUS Rounded 1c", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.18 0.01 130)',
            primary: 'linear-gradient(90deg, oklch(0.85 0.18 115), oklch(0.78 0.12 220))',
      secondary: 'oklch(0.65 0.18 295)',
      chartColors: ['oklch(0.65 0.18 115)', 'oklch(0.65 0.18 160)', 'oklch(0.65 0.18 205)', 'oklch(0.65 0.18 250)', 'oklch(0.65 0.18 295)', 'oklch(0.65 0.18 340)', 'oklch(0.65 0.18 25)', 'oklch(0.65 0.18 70)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS Rounded 1c", sans-serif',
      fontWeight: 500,
      color: 'oklch(0.85 0.18 115)',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '2px solid oklch(0.85 0.18 115)',
    },
  },
  {
    id: 'dark-casual-purple',
    name: 'DarkCasuPurple',
    nameJa: 'ダーク カジュ パープル',
    baseStyle: 'DarkCasual',
    color: 'Lavender',
    style: {
      name: 'dark-casual-purple',
      bgNormal: 'oklch(0.18 0.01 290)',
      bgCover: 'oklch(0.12 0.02 290)',
      headingColor: 'linear-gradient(90deg, oklch(0.82 0.12 300), oklch(0.78 0.16 360))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS Rounded 1c", sans-serif',
      fontBody: '"M PLUS Rounded 1c", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.18 0.01 290)',
            primary: 'linear-gradient(90deg, oklch(0.82 0.12 300), oklch(0.78 0.16 360))',
      secondary: 'oklch(0.65 0.12 120)',
      chartColors: ['oklch(0.65 0.12 300)', 'oklch(0.65 0.12 345)', 'oklch(0.65 0.12 30)', 'oklch(0.65 0.12 75)', 'oklch(0.65 0.12 120)', 'oklch(0.65 0.12 165)', 'oklch(0.65 0.12 210)', 'oklch(0.65 0.12 255)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS Rounded 1c", sans-serif',
      fontWeight: 500,
      color: 'oklch(0.82 0.12 300)',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '2px solid oklch(0.82 0.12 300)',
    },
  },
  {
    id: 'dark-casual-orange',
    name: 'DarkCasuOrange',
    nameJa: 'ダーク カジュ オレンジ',
    baseStyle: 'DarkCasual',
    color: 'Coral',
    style: {
      name: 'dark-casual-orange',
      bgNormal: 'oklch(0.18 0.01 30)',
      bgCover: 'oklch(0.12 0.02 30)',
      headingColor: 'linear-gradient(90deg, oklch(0.80 0.15 50), oklch(0.78 0.16 360))',
      textColor: 'oklch(0.92 0 0)',
      fontHeading: '"M PLUS Rounded 1c", sans-serif',
      fontBody: '"M PLUS Rounded 1c", sans-serif',
      letterSpacing: '0.02em',
      baseColor: 'oklch(0.18 0.01 30)',
            primary: 'linear-gradient(90deg, oklch(0.80 0.15 50), oklch(0.78 0.16 360))',
      secondary: 'oklch(0.65 0.15 230)',
      chartColors: ['oklch(0.65 0.15 50)', 'oklch(0.65 0.15 95)', 'oklch(0.65 0.15 140)', 'oklch(0.65 0.15 185)', 'oklch(0.65 0.15 230)', 'oklch(0.65 0.15 275)', 'oklch(0.65 0.15 320)', 'oklch(0.65 0.15 5)'],
    },
    chipStyle: {
      fontFamily: '"M PLUS Rounded 1c", sans-serif',
      fontWeight: 500,
      color: 'oklch(0.80 0.15 50)',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '2px solid oklch(0.80 0.15 50)',
    },
  },
]

// ============================================
// ヘルパー関数
// ============================================

/**
 * バイオームIDからバイオームを取得
 */
export function getBiomeById(id: string): TonmanaBiome | undefined {
  return tonmanaBiomes.find(biome => biome.id === id)
}

/**
 * ベーススタイルでグループ化されたバイオームを取得
 */
export function getBiomesByBaseStyle(): Map<TonmanaBaseStyle, TonmanaBiome[]> {
  const styleMap = new Map<TonmanaBaseStyle, TonmanaBiome[]>()
  
  for (const biome of tonmanaBiomes) {
    const biomes = styleMap.get(biome.baseStyle) || []
    biomes.push(biome)
    styleMap.set(biome.baseStyle, biomes)
  }
  
  return styleMap
}

/**
 * デフォルトのバイオームを取得
 */
export function getDefaultBiome(): TonmanaBiome {
  return tonmanaBiomes[0]
}

/**
 * バイオームのスタイルを取得
 */
export function getBiomeStyle(biomeId: string): TonmanaStyle {
  const biome = getBiomeById(biomeId)
  return biome?.style ?? getDefaultBiome().style
}

// ============================================
// フィルターカテゴリシステム
// ============================================

/**
 * 全フィルターカテゴリ定義（ラベル付き）
 */
export const allFilterCategories: { id: TonmanaFilterCategory; label: string }[] = [
  { id: 'light', label: 'ライトテーマ' },
  { id: 'dark', label: 'ダークテーマ' },
  { id: 'formal', label: 'フォーマル' },
  { id: 'casual', label: 'カジュアル' },
  { id: 'gradient', label: 'グラデーション' },
  { id: 'handwritten', label: '手書き風' },
  { id: 'used', label: '利用済み' },
]

/**
 * 第1レベル（初期表示）のカテゴリ
 */
export const rootCategories: TonmanaFilterCategory[] = ['light', 'dark', 'formal', 'casual', 'used']

/**
 * 各カテゴリのサブカテゴリ定義（階層構造）
 * 空配列は終端（サブカテゴリなし）を意味する
 */
export const subcategoryMap: Record<TonmanaFilterCategory, TonmanaFilterCategory[]> = {
  light: ['formal', 'gradient', 'handwritten'],
  dark: [],  // 終端
  formal: ['light', 'dark'],
  casual: ['light', 'dark', 'gradient', 'handwritten'],
  gradient: [],  // 終端
  handwritten: [],  // 終端
  used: [],  // 終端
}

/**
 * ベーススタイルとフィルターカテゴリのマッピング
 * 各ベーススタイルが属するカテゴリを定義
 */
const baseStyleCategoryMap: Record<TonmanaBaseStyle, TonmanaFilterCategory[]> = {
  // ライトテーマ
  Plain: ['light', 'casual'],
  Corporate: ['light', 'formal'],
  Elegant: ['light', 'formal'],
  Casual: ['light', 'casual'],
  Natural: ['light', 'casual'],
  Gradient: ['light', 'casual', 'gradient'],
  Handwritten: ['light', 'casual', 'handwritten'],
  // ダークテーマ
  Tech: ['dark', 'formal'],
  Neon: ['dark', 'casual'],
  NeonBold: ['dark', 'casual'],
  DarkTech: ['dark', 'formal'],
  DarkElegant: ['dark', 'formal'],
  DarkCasual: ['dark', 'casual'],
}

/**
 * カテゴリのラベルを取得
 */
export function getCategoryLabel(category: TonmanaFilterCategory): string {
  return allFilterCategories.find(c => c.id === category)?.label ?? category
}

/**
 * 選択されたカテゴリに基づいて次のサブカテゴリを取得
 * @param selectedCategories 現在選択されているカテゴリ
 */
export function getAvailableSubcategories(
  selectedCategories: TonmanaFilterCategory[]
): TonmanaFilterCategory[] {
  if (selectedCategories.length === 0) {
    return rootCategories
  }
  
  // 最後に選択されたカテゴリのサブカテゴリを返す
  const lastCategory = selectedCategories[selectedCategories.length - 1]
  const subcategories = subcategoryMap[lastCategory]
  
  // すでに選択されているカテゴリは除外
  return subcategories.filter(cat => !selectedCategories.includes(cat))
}

/**
 * 複数カテゴリでフィルタリングされたバイオームを取得（AND条件）
 * @param categories フィルターカテゴリの配列
 * @param usedBiomeIds 「利用済み」カテゴリで使用するバイオームIDリスト
 */
export function getBiomesByCategories(
  categories: TonmanaFilterCategory[],
  usedBiomeIds: string[] = []
): TonmanaBiome[] {
  if (categories.length === 0) {
    return tonmanaBiomes
  }
  
  return tonmanaBiomes.filter(biome => {
    return categories.every(cat => {
      if (cat === 'used') {
        return usedBiomeIds.includes(biome.id)
      }
      // biomeのbaseStyleがこのカテゴリに属しているか
      const biomeCategories = baseStyleCategoryMap[biome.baseStyle]
      return biomeCategories.includes(cat)
    })
  })
}

/**
 * 指定されたフィルターカテゴリに属するバイオームを取得（単一カテゴリ用）
 * @param category フィルターカテゴリ
 * @param usedBiomeIds 「利用済み」カテゴリで使用するバイオームIDリスト
 */
export function getBiomesByCategory(
  category: TonmanaFilterCategory,
  usedBiomeIds: string[] = []
): TonmanaBiome[] {
  return getBiomesByCategories([category], usedBiomeIds)
}
