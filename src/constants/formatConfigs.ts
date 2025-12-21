import type { SlideFormat } from '../types'

// 各フォーマットの固定サイズ（px単位）
// PowerPointの標準サイズを基準に設定
export const formatSizes: Record<SlideFormat, { width: number; height: number }> = {
  webinar: { width: 1920, height: 1080 }, // 16:9 (Full HD)
  meeting: { width: 1920, height: 1080 }, // 16:9
  seminar: { width: 1920, height: 1080 }, // 16:9
  conference: { width: 1920, height: 1080 }, // 16:9
  instapost: { width: 1080, height: 1350 }, // 4:5 (Instagram Post)
  instastory: { width: 1080, height: 1920 }, // 9:16 (Instagram Story)
  a4: { width: 1123, height: 1587 }, // A4 (210mm x 297mm at 96dpi)
}

// フォントサイズ設定
// 本文フォントサイズを基準として、ジャンプ率で見出しやキーメッセージのサイズを計算
export const fontConfigs: Record<SlideFormat, {
  baseFontSize: number // 本文フォントサイズ（px）
  headingJumpRate: number // 見出しのジャンプ率
  keyMessageJumpRate: number // キーメッセージのジャンプ率
  codeJumpRate: number // コードブロックのジャンプ率
  fontFamily: string // フォントファミリー
}> = {
  webinar: { baseFontSize: 28, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "Yu Gothic", sans-serif' },
  meeting: { baseFontSize: 34, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "Yu Gothic", sans-serif' },
  seminar: { baseFontSize: 43, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "Yu Gothic", sans-serif' },
  conference: { baseFontSize: 67, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", "Yu Gothic Medium", sans-serif' },
  instapost: { baseFontSize: 34, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' },
  instastory: { baseFontSize: 36, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' },
  a4: { baseFontSize: 22, headingJumpRate: 1.5, keyMessageJumpRate: 1.6, codeJumpRate: 0.9, fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' },
}

// セーフエリア設定（px単位）
// 用途に応じた業界標準に基づいて設定
export const safeAreaConfigs: Record<SlideFormat, {
  top: number      // 上部パディング（px）
  bottom: number   // 下部パディング（px）
  left: number     // 左側パディング（px）
  right: number    // 右側パディング（px）
}> = {
  // 16:9 スライド系 - 画面共有・投影環境を考慮
  webinar: { top: 11, bottom: 11, left: 38, right: 38 },     // 水平2%、垂直1% - オンライン画面共有向け
  meeting: { top: 22, bottom: 22, left: 58, right: 58 },     // 水平3%、垂直2% - チームミーティング向け
  seminar: { top: 43, bottom: 43, left: 77, right: 77 },     // 水平4%、垂直4% - プロジェクター投影考慮
  conference: { top: 65, bottom: 65, left: 96, right: 96 },  // 水平5%、垂直6% - 大型スクリーン・放送規格考慮
  // SNS系 - プラットフォームUIとの干渉を考慮
  instapost: { top: 68, bottom: 68, left: 54, right: 54 },   // 水平5%、垂直5% - フィード・グリッド表示対応
  instastory: { top: 269, bottom: 230, left: 54, right: 54 }, // 上14%、下12%、左右5% - Story UI回避
  // 印刷系 - 一般的な文書余白
  a4: { top: 95, bottom: 95, left: 79, right: 79 },          // 水平7%、垂直6% - 約20mm余白相当
}

export const formatConfigs: Record<SlideFormat, { icon: string; name: string; description: string; ratio: string; slideSplitLevel: number; width: number; height: number; tocMaxColumns: number; tocItemsPerColumn: number }> = {
  webinar: { icon: 'videocam', name: 'SlideS', description: '小規模会議・オンライン向け', ratio: '16:9', slideSplitLevel: 2, width: formatSizes.webinar.width, height: formatSizes.webinar.height, tocMaxColumns: 2, tocItemsPerColumn: 12 },
  meeting: { icon: 'groups', name: 'SlideS', description: '小規模な会議やチームミーティング向け', ratio: '16:9', slideSplitLevel: 2, width: formatSizes.meeting.width, height: formatSizes.meeting.height, tocMaxColumns: 2, tocItemsPerColumn: 10 },
  seminar: { icon: 'school', name: 'SlideM', description: '中規模なセミナーや研修、勉強会向け', ratio: '16:9', slideSplitLevel: 2, width: formatSizes.seminar.width, height: formatSizes.seminar.height, tocMaxColumns: 2, tocItemsPerColumn: 8 },
  conference: { icon: 'business', name: 'SlideL', description: '大規模な会議やカンファレンス、講演会向け', ratio: '16:9', slideSplitLevel: 3, width: formatSizes.conference.width, height: formatSizes.conference.height, tocMaxColumns: 2, tocItemsPerColumn: 5 },
  instapost: { icon: 'collections', name: 'Post', description: 'Instagram投稿用の縦長フォーマット', ratio: '4:5', slideSplitLevel: 3, width: formatSizes.instapost.width, height: formatSizes.instapost.height, tocMaxColumns: 1, tocItemsPerColumn: 13 },
  instastory: { icon: 'phone_android', name: 'Story', description: 'Instagramストーリーやショート動画向け', ratio: '9:16', slideSplitLevel: 3, width: formatSizes.instastory.width, height: formatSizes.instastory.height, tocMaxColumns: 1, tocItemsPerColumn: 18 },
  a4: { icon: 'description', name: 'A4', description: '印刷・配布資料向けのA4サイズ', ratio: 'A4', slideSplitLevel: 1, width: formatSizes.a4.width, height: formatSizes.a4.height, tocMaxColumns: 1, tocItemsPerColumn: 22 },
}

