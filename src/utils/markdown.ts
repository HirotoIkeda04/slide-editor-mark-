// 見出しの文字数を計算（半角は0.5文字としてカウント）
export const calculateHeadingLength = (text: string): number => {
  let length = 0
  for (const char of text) {
    length += /[ -~]/.test(char) ? 0.5 : 1
  }
  return length
}

// Blob URLのキャッシュ（data URL → Blob URLのマッピング）
const blobUrlCache = new Map<string, string>()

// Convert base64 data URL to Blob URL (with caching)
export const dataUrlToBlobUrl = (dataUrl: string): string => {
  // キャッシュに存在する場合は再利用
  if (blobUrlCache.has(dataUrl)) {
    const cachedBlobUrl = blobUrlCache.get(dataUrl)!
    console.log('[dataUrlToBlobUrl] Using cached Blob URL:', cachedBlobUrl.substring(0, 50) + '...')
    return cachedBlobUrl
  }
  
  try {
    const [header, base64Data] = dataUrl.split(',')
    const mimeMatch = header.match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'
    
    const byteString = atob(base64Data)
    const arrayBuffer = new ArrayBuffer(byteString.length)
    const uint8Array = new Uint8Array(arrayBuffer)
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i)
    }
    
    const blob = new Blob([arrayBuffer], { type: mime })
    const blobUrl = URL.createObjectURL(blob)
    
    // キャッシュに保存
    blobUrlCache.set(dataUrl, blobUrl)
    console.log('[dataUrlToBlobUrl] Created new Blob URL and cached:', blobUrl.substring(0, 50) + '...')
    
    return blobUrl
  } catch (error) {
    console.error('[dataUrlToBlobUrl] Failed to convert data URL to Blob URL:', error)
    return dataUrl // Fallback to original data URL
  }
}

// キーメッセージ記法をHTMLタグに変換する関数
// 画像のMarkdown記法をHTMLに変換し、画像情報を抽出する関数
// base64 data URLをBlob URLに変換して、ReactMarkdownのパーサーの負荷を軽減
export const extractImagesFromContent = (content: string): { html: string, images: Array<{ alt: string, src: string, placeholder: string, blobUrl: string }> } => {
  const images: Array<{ alt: string, src: string, placeholder: string, blobUrl: string }> = []
  let imageIndex = 0

  // 画像のMarkdown記法（![alt](url)）を抽出し、プレースホルダーに置き換え
  const imageMarkdownPattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  const html = content.replace(imageMarkdownPattern, (match, alt, url) => {
    // base64のdataUrlのみを許可（セキュリティ対策）
    if (!url.startsWith('data:image/')) {
      console.warn('[extractImagesFromContent] Invalid image URL (not a data URL):', url.substring(0, 50))
      return match // 無効なURLの場合はそのまま返す
    }

    // base64 data URLをBlob URLに変換
    const blobUrl = dataUrlToBlobUrl(url)
    console.log('[extractImagesFromContent] Converted data URL to Blob URL:', { dataUrlLength: url.length, blobUrl })

    const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
    images.push({ alt: alt || '', src: url, placeholder, blobUrl })
    imageIndex++
    return placeholder
  })

  return { html, images }
}

export const convertKeyMessageToHTML = (content: string): string => {
  console.log('[convertKeyMessageToHTML] Input length:', content.length)
  console.log('[convertKeyMessageToHTML] Contains image markdown:', /!\[.*?\]\(/.test(content))
  console.log('[convertKeyMessageToHTML] Contains img tag:', /<img\s+src=/.test(content))
  
  const lines = content.split('\n')
  let foundKeyMessage = false
  const convertedLines = lines.map((line, index) => {
    // HTMLのimgタグを含む行は保護する（そのまま返す）
    if (/<img\s+src=/.test(line)) {
      console.log('[convertKeyMessageToHTML] Found img tag at line', index, 'length:', line.length)
      return line // HTMLのimgタグはそのまま返す
    }
    
    // 画像のMarkdown記法（![alt](url)）を含む行は保護する
    // react-markdownに処理させるため、そのまま返す
    if (/!\[.*?\]\(/.test(line)) {
      console.log('[convertKeyMessageToHTML] Found image markdown at line', index, 'length:', line.length)
      return line // 画像のMarkdown記法はそのまま返す
    }
    
    // レイアウト属性値（#ttl, #agd, #!）を通常のH1に変換
    const layoutConverted = line
      .replace(/^#ttl\s+(.*)$/, '# $1')
      .replace(/^#agd\s+(.*)$/, '# $1')
      .replace(/^#!\s+(.*)$/, '# $1')
    
    // 画像のMarkdown記法（![alt](url)）を除外してキーメッセージをチェック
    const trimmed = layoutConverted.trim()
    if (!foundKeyMessage && trimmed.startsWith('! ') && !trimmed.startsWith('![')) {
      foundKeyMessage = true
      const keyMessageText = trimmed.substring(2) // '! 'を除去
      // HTMLタグに変換し、その後に空行を追加（Markdownパーサーがリストを正しく認識するため）
      return `<div class="key-message">${keyMessageText}</div>\n\n`
    }
    return layoutConverted
  })
  const result = convertedLines.join('\n')
  console.log('[convertKeyMessageToHTML] Output length:', result.length)
  return result
}

// スライドのタイトルを抽出する関数
export const extractSlideTitle = (content: string): string => {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // レイアウト属性値（#ttl, #agd, #!）を優先
    if (trimmed.startsWith('#ttl ')) {
      return trimmed.substring(5).trim()
    }
    if (trimmed.startsWith('#agd ')) {
      return trimmed.substring(5).trim()
    }
    if (trimmed.startsWith('#! ')) {
      return trimmed.substring(3).trim()
    }
    // 通常のh1を優先
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim()
    }
    // h2を次に優先
    if (trimmed.startsWith('## ')) {
      return trimmed.substring(3).trim()
    }
    // h3も考慮
    if (trimmed.startsWith('### ')) {
      return trimmed.substring(4).trim()
    }
  }
  // タイトルが見つからない場合は「新しいスライド」
  return '新しいスライド'
}

// スライドのレイアウトタイプを抽出する関数
// 属性値ベースの新記法: #ttl (表紙), #agd (目次), #! (まとめ), # (中扉)
// スライドの先頭の見出しで判定する（slideSplitLevelによりスライドの先頭がH1/H2/H3の場合がある）
export const extractSlideLayout = (content: string): 'cover' | 'toc' | 'section' | 'summary' | 'normal' => {
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    // 空行はスキップ
    if (trimmed.length === 0) continue
    
    // 属性値ベースのレイアウト記法をチェック（先頭の見出しで判定）
    if (trimmed.match(/^#ttl\s+/) || trimmed.match(/^#ttl$/)) {
      return 'cover'
    }
    if (trimmed.match(/^#agd\s+/) || trimmed.match(/^#agd$/)) {
      return 'toc'
    }
    if (trimmed.match(/^#!\s+/) || trimmed.match(/^#!$/)) {
      return 'summary'
    }
    // 通常のH1見出し（#で始まり、##や###ではない）→ 中扉
    if (trimmed.match(/^#\s+/) && !trimmed.match(/^##/)) {
      return 'section'
    }
    // H2やH3で始まる場合は通常スライド
    if (trimmed.match(/^##/)) {
      return 'normal'
    }
    // 見出し以外のコンテンツで始まる場合も通常スライド
    break
  }
  
  return 'normal'
}

// 各スライドの開始行インデックス（0-based）を返す関数
// splitSlidesByHeadingと同じロジックで分割位置を特定
export const getSlideStartLines = (
  content: string,
  headingLevel: number,
  attributeMap?: Map<number, string | null>
): number[] => {
  const lines = content.split('\n')
  const startLines: number[] = []
  let firstHeadingFound = false
  let currentSlideStartLine = 0

  // 行から見出しレベルを取得（属性値優先）
  const getHeadingLevel = (line: string, lineIndex: number): number | null => {
    const attribute = attributeMap?.get(lineIndex)
    // レイアウト属性値はH1相当
    if (attribute === '#' || attribute === '#ttl' || attribute === '#agd' || attribute === '#!') return 1
    if (attribute === '##') return 2
    if (attribute === '###') return 3
    
    // 属性値がない場合は行のテキストから判断
    const trimmed = line.trim()
    // レイアウト記法もH1として扱う
    if (trimmed.match(/^#ttl\s+/) || trimmed.match(/^#agd\s+/) || trimmed.match(/^#!\s+/)) {
      return 1
    }
    const headingMatch = trimmed.match(/^(#+)\s+/)
    if (headingMatch) {
      return headingMatch[1].length
    }
    return null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingLevelInLine = getHeadingLevel(line, i)
    
    if (headingLevelInLine !== null && headingLevelInLine <= headingLevel) {
      if (!firstHeadingFound) {
        // 最初の見出し前にコンテンツがある場合、それを最初のスライドとする
        if (i > 0) {
          const beforeContent = lines.slice(0, i).join('\n').trim()
          if (beforeContent.length > 0) {
            startLines.push(0)
          }
        }
        firstHeadingFound = true
        currentSlideStartLine = i
        startLines.push(i)
      } else {
        // 新しいスライドの開始
        currentSlideStartLine = i
        startLines.push(i)
      }
    }
  }

  // スライドがない場合（見出しがない場合）
  if (startLines.length === 0 && lines.length > 0) {
    startLines.push(0)
  }

  return startLines
}

// 見出しレベルに基づいてスライドを分割する関数
// attributeMap: 行インデックス（0-based）から属性値へのマップ
export const splitSlidesByHeading = (
  content: string, 
  headingLevel: number,
  attributeMap?: Map<number, string | null>
): string[] => {
  const lines = content.split('\n')
  const slides: string[] = []
  let currentSlide: string[] = []
  let firstHeadingFound = false

  // 属性値を含む行を生成するヘルパー関数
  const lineWithAttribute = (line: string, lineIndex: number): string => {
    const attribute = attributeMap?.get(lineIndex)
    if (!attribute) return line
    // 属性値が既に行に含まれている場合はそのまま返す
    const trimmed = line.trim()
    if (trimmed.startsWith(attribute)) return line
    // 属性値を追加
    return `${attribute} ${line}`
  }

  // 行から見出しレベルを取得（属性値優先）
  const getHeadingLevel = (line: string, lineIndex: number): number | null => {
    const attribute = attributeMap?.get(lineIndex)
    // レイアウト属性値はH1相当
    if (attribute === '#' || attribute === '#ttl' || attribute === '#agd' || attribute === '#!') return 1
    if (attribute === '##') return 2
    if (attribute === '###') return 3
    
    // 属性値がない場合は行のテキストから判断
    const trimmed = line.trim()
    // レイアウト記法もH1として扱う
    if (trimmed.match(/^#ttl\s+/) || trimmed.match(/^#agd\s+/) || trimmed.match(/^#!\s+/)) {
      return 1
    }
    const headingMatch = trimmed.match(/^(#+)\s+/)
    if (headingMatch) {
      return headingMatch[1].length
    }
    return null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingLevelInLine = getHeadingLevel(line, i)
    
    if (headingLevelInLine !== null && headingLevelInLine <= headingLevel) {
      // 最初の見出しが見つかった場合、それまでのコンテンツを最初のスライドとして追加
      if (!firstHeadingFound) {
        if (currentSlide.length > 0) {
          slides.push(currentSlide.join('\n'))
          currentSlide = []
        }
        firstHeadingFound = true
      } else {
        // 現在のスライドを保存して新しいスライドを開始
        if (currentSlide.length > 0) {
          slides.push(currentSlide.join('\n'))
        }
        currentSlide = []
      }
    }
    
    // 現在の行をスライドに追加（属性値を含む）
    currentSlide.push(lineWithAttribute(line, i))
  }
  
  // 最後のスライドを追加
  if (currentSlide.length > 0) {
    slides.push(currentSlide.join('\n'))
  }
  
  // 空のスライドを除外（ただし、最初の見出しまでのコンテンツが空の場合は含める）
  return slides.filter(slide => slide.trim().length > 0 || !firstHeadingFound)
}

/**
 * splitContentByH2の戻り値の型
 */
export interface SplitContentByH2Result {
  h1Section: string
  h2Sections: string[]
  h2Ratios: (number | null)[]  // 各H2セクションの比率（省略時は1）
  h2Alignments: ('top' | 'mid' | 'btm')[]  // 各H2セクションの垂直配置（省略時はtop）
  ratioErrors: Array<{ rawValue: string; lineNumber: number; message: string }>  // 不正な比率・配置指定のエラー情報
}

// スライドコンテンツをh2で分割する関数（横並び表示用）
// h1とその後のコンテンツは最初のセクションとして返し、h2セクションのみを横並びにする
export const splitContentByH2 = (content: string): SplitContentByH2Result => {
  const lines = content.split('\n')
  const h2Sections: string[] = []
  const h2Ratios: (number | null)[] = []
  const h2Alignments: ('top' | 'mid' | 'btm')[] = []
  const ratioErrors: Array<{ rawValue: string; lineNumber: number; message: string }> = []
  let h1Section: string[] = []
  let currentH2Section: string[] = []
  let h2Count = 0
  let h1Found = false
  let currentH2Ratio: number | null = null
  let currentH2Alignment: 'top' | 'mid' | 'btm' = 'top'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // h1を見つけたら、h1セクションに追加
    if (trimmed.match(/^#\s+/)) {
      if (!h1Found) {
        h1Found = true
        h1Section.push(line)
      } else {
        // 2つ目のh1が見つかった場合は、現在のh2セクションを保存して終了
        if (currentH2Section.length > 0) {
          h2Sections.push(currentH2Section.join('\n'))
          h2Ratios.push(currentH2Ratio)
          h2Alignments.push(currentH2Alignment)
        }
        break
      }
    } else if (trimmed.match(/^##(\s|$)/)) {
      // h2を見つけたら、現在のh2セクションを保存して新しいh2セクションを開始
      // 空のH2（##のみ）も含める
      h2Count++
      if (currentH2Section.length > 0) {
        h2Sections.push(currentH2Section.join('\n'))
        h2Ratios.push(currentH2Ratio)
        h2Alignments.push(currentH2Alignment)
      }
      
      // 比率・配置指定をパース
      const ratioResult = parseColumnRatio(line)
      currentH2Ratio = ratioResult.ratio
      currentH2Alignment = ratioResult.alignment ?? 'top'
      
      // エラーがある場合は記録
      if (ratioResult.hasRatioSyntax) {
        if (ratioResult.ratioError || ratioResult.alignmentError) {
          let errorMessage = ''
          if (ratioResult.ratioError && ratioResult.alignmentError) {
            errorMessage = `無効な比率・配置指定 {${ratioResult.rawValue}}（正の実数とtop/mid/btmを指定してください）`
          } else if (ratioResult.ratioError) {
            errorMessage = `無効な比率指定 {${ratioResult.rawValue}}（正の実数を指定してください）`
          } else if (ratioResult.alignmentError) {
            errorMessage = `無効な配置指定 {${ratioResult.rawValue}}（top/mid/btmを指定してください）`
          }
          ratioErrors.push({
            rawValue: ratioResult.rawValue ?? '',
            lineNumber: i + 1,  // 1-based line number
            message: errorMessage
          })
        }
      }
      
      // 比率・配置指定を除去した行を追加
      currentH2Section = [removeColumnRatioFromLine(line)]
    } else {
      // h1が見つかる前のコンテンツはh1セクションに、h2が見つかった後はh2セクションに追加
      if (!h1Found) {
        h1Section.push(line)
      } else if (h2Count > 0) {
        currentH2Section.push(line)
      } else {
        h1Section.push(line)
      }
    }
  }
  
  // 最後のh2セクションを追加
  if (currentH2Section.length > 0) {
    h2Sections.push(currentH2Section.join('\n'))
    h2Ratios.push(currentH2Ratio)
    h2Alignments.push(currentH2Alignment)
  }
  
  return {
    h1Section: h1Section.join('\n'),
    h2Sections: h2Count >= 2 ? h2Sections : [],
    h2Ratios: h2Count >= 2 ? h2Ratios : [],
    h2Alignments: h2Count >= 2 ? h2Alignments : [],
    ratioErrors
  }
}

// スライド内に複数のh2があるかチェックする関数
// 空のH2（##のみ）も含めてカウント
export const hasMultipleH2 = (content: string): boolean => {
  const lines = content.split('\n')
  let h2Count = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    // ##の後に空白があるか、##のみの場合もマッチ
    if (trimmed.match(/^##(\s|$)/)) {
      h2Count++
      if (h2Count >= 2) {
        return true
      }
    }
  }
  
  return false
}

/**
 * 連続するH3セクションをグリッドレイアウト用のHTMLで囲む
 * 
 * 例:
 * ### Title 1
 * content 1
 * 
 * ### Title 2
 * content 2
 * 
 * ↓
 * 
 * <div class="h3-grid-layout">
 * <div class="h3-grid-item">
 * 
 * ### Title 1
 * content 1
 * 
 * </div>
 * <div class="h3-grid-item">
 * 
 * ### Title 2
 * content 2
 * 
 * </div>
 * </div>
 */
export const wrapConsecutiveH3InGrid = (content: string): string => {
  const lines = content.split('\n')
  const result: string[] = []
  let h3Sections: string[][] = []  // 現在収集中のH3セクション群
  let h3Ratios: (number | null)[] = []  // 各H3セクションの比率
  let h3Alignments: ('top' | 'mid' | 'btm')[] = []  // 各H3セクションの配置
  let currentH3Section: string[] = []  // 現在のH3セクション
  let currentH3Ratio: number | null = null
  let currentH3Alignment: 'top' | 'mid' | 'btm' = 'top'
  let inH3Sequence = false
  
  const flushH3Sections = () => {
    if (h3Sections.length >= 2) {
      // 2つ以上のH3がある場合はグリッドで囲む
      // 比率からgrid-template-columnsを生成
      const effectiveRatios = h3Ratios.map(r => r ?? 1)
      const gridTemplateColumns = effectiveRatios.map(r => `${r}fr`).join(' ')
      
      result.push(`<div class="h3-grid-layout" style="grid-template-columns: ${gridTemplateColumns};">`)
      const totalRatio = effectiveRatios.reduce((a, b) => a + b, 0)
      const totalColumns = h3Sections.length
      for (let idx = 0; idx < h3Sections.length; idx++) {
        const section = h3Sections[idx]
        const alignment = h3Alignments[idx] ?? 'top'
        const alignSelfValue = alignment === 'mid' ? 'center' : alignment === 'btm' ? 'flex-end' : 'flex-start'
        const myRatio = effectiveRatios[idx]
        result.push(`<div class="h3-grid-item" style="align-self: ${alignSelfValue};">`)
        result.push('')
        // table-chartタグに比率情報を追加
        const updatedSection = section.map(line => {
          if (line.includes('<table-chart ')) {
            return line.replace(
              /<table-chart ([^>]*)>/g,
              `<table-chart $1 grid-ratio="${myRatio}" grid-total="${totalRatio}" grid-columns="${totalColumns}">`
            )
          }
          return line
        })
        result.push(...updatedSection)
        result.push('')
        result.push('</div>')
      }
      result.push('</div>')
    } else if (h3Sections.length === 1) {
      // 1つだけの場合はそのまま出力
      result.push(...h3Sections[0])
    }
    h3Sections = []
    h3Ratios = []
    h3Alignments = []
    currentH3Section = []
    currentH3Ratio = null
    currentH3Alignment = 'top'
    inH3Sequence = false
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // H3の検出（### で始まる行）- 空のH3も含む
    if (trimmed.match(/^###(\s|$)/)) {
      if (inH3Sequence && currentH3Section.length > 0) {
        // 既存のH3セクションを保存
        h3Sections.push([...currentH3Section])
        h3Ratios.push(currentH3Ratio)
        h3Alignments.push(currentH3Alignment)
        currentH3Section = []
      }
      inH3Sequence = true
      
      // 比率・配置指定をパース
      const ratioResult = parseColumnRatio(line)
      currentH3Ratio = ratioResult.ratio
      currentH3Alignment = ratioResult.alignment ?? 'top'
      
      // 比率・配置指定を除去した行を追加
      currentH3Section.push(removeColumnRatioFromLine(line))
    } else if (inH3Sequence) {
      // H1, H2, H4+ に遭遇したらH3シーケンスを終了
      if (trimmed.match(/^#{1,2}\s+/) || trimmed.match(/^#{4,}\s+/)) {
        if (currentH3Section.length > 0) {
          h3Sections.push([...currentH3Section])
          h3Ratios.push(currentH3Ratio)
          h3Alignments.push(currentH3Alignment)
          currentH3Section = []
        }
        flushH3Sections()
        result.push(line)
      } else {
        // 通常の行はH3セクションに追加
        currentH3Section.push(line)
      }
    } else {
      // H3シーケンス外の行はそのまま出力
      result.push(line)
    }
  }
  
  // 最後のH3セクションを処理
  if (currentH3Section.length > 0) {
    h3Sections.push([...currentH3Section])
    h3Ratios.push(currentH3Ratio)
    h3Alignments.push(currentH3Alignment)
  }
  flushH3Sections()
  
  return result.join('\n')
}

// 各要素の高さ係数（baseFontSizeに対する倍率）
const HEIGHT_FACTORS = {
  h1: 3.0,      // H1見出し + 余白
  h2: 2.5,      // H2見出し + 余白
  h3: 2.0,      // H3見出し + 余白
  paragraph: 1.5,  // テキスト段落
  listItem: 1.2,   // リストアイテム
  keyMessage: 4.0, // キーメッセージ
  image: 8.0,      // 画像（推定）
}

/**
 * Markdown行の配列から高さ係数を推定する
 * @param lines Markdownの行配列
 * @returns 高さ係数の合計（baseFontSizeに乗算して使用）
 */
export const estimateContentHeight = (lines: string[]): number => {
  let height = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // 空行はスキップ
    if (!trimmed) continue
    
    // table-chartタグはスキップ（グラフ自体の高さは別途計算）
    if (trimmed.includes('<table-chart')) continue
    
    // picto-diagramタグはスキップ
    if (trimmed.includes('<picto-diagram')) continue
    
    // euler-diagramタグはスキップ
    if (trimmed.includes('<euler-diagram')) continue
    
    // HTMLタグ（divなど）はスキップ
    if (trimmed.startsWith('<div') || trimmed.startsWith('</div')) continue
    
    // H1見出し
    if (trimmed.match(/^#\s+/)) {
      height += HEIGHT_FACTORS.h1
      continue
    }
    
    // H2見出し
    if (trimmed.match(/^##\s+/)) {
      height += HEIGHT_FACTORS.h2
      continue
    }
    
    // H3見出し
    if (trimmed.match(/^###\s*/)) {
      height += HEIGHT_FACTORS.h3
      continue
    }
    
    // リストアイテム（箇条書き・番号付き）
    if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      height += HEIGHT_FACTORS.listItem
      continue
    }
    
    // キーメッセージ（:::key-message または key-message class）
    if (trimmed.includes('key-message') || trimmed.match(/^:::/)) {
      height += HEIGHT_FACTORS.keyMessage
      continue
    }
    
    // 画像（Markdown記法または imgタグ）
    if (trimmed.match(/^!\[/) || trimmed.includes('<img')) {
      height += HEIGHT_FACTORS.image
      continue
    }
    
    // その他のテキスト（段落）
    if (trimmed.length > 0 && !trimmed.startsWith('<')) {
      height += HEIGHT_FACTORS.paragraph
    }
  }
  
  return height
}

/**
 * Markdownコンテンツを解析し、table-chartの前後のコンテンツ高さを推定する
 * @param content Markdownコンテンツ
 * @returns table-chartタグにcontent-before/after属性を追加したコンテンツ
 */
export const injectContentHeightToCharts = (content: string): string => {
  const lines = content.split('\n')
  const result: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.includes('<table-chart ')) {
      // グラフ前のコンテンツ高さを計算
      const beforeLines = lines.slice(0, i)
      const beforeHeight = estimateContentHeight(beforeLines)
      
      // グラフ後のコンテンツ高さを計算
      const afterLines = lines.slice(i + 1)
      const afterHeight = estimateContentHeight(afterLines)
      
      // table-chartタグに属性を追加
      const updatedLine = line.replace(
        /<table-chart ([^>]*)>/g,
        `<table-chart $1 content-before="${beforeHeight.toFixed(1)}" content-after="${afterHeight.toFixed(1)}">`
      )
      result.push(updatedLine)
    } else {
      result.push(line)
    }
  }
  
  return result.join('\n')
}

// アイテム挿入記法を展開する関数
// @アイテム名 または [[sheet:xxx]] 形式でアイテムを参照
export const expandItemReferences = (
  content: string,
  itemResolverFn: (name: string) => string | null
): string => {
  let result = content
  
  // [[sheet:xxx]] パターンをマッチ（先に処理）
  const sheetPattern = /\[\[sheet:([^\]]+)\]\]/g
  result = result.replace(sheetPattern, (_match, itemName) => {
    const itemMarkdown = itemResolverFn(itemName)
    if (itemMarkdown === null) {
      // アイテムが見つからない場合はエラーメッセージを表示
      return `<span class="item-not-found">⚠️ Item not found: ${itemName}</span>`
    }
    console.log('[expandItemReferences] Expanded item (sheet):', itemName, 'markdown length:', itemMarkdown.length)
    return itemMarkdown
  })
  
  // @アイテム名 パターンをマッチ
  const itemReferencePattern = /@([^\s@]+)/g
  result = result.replace(itemReferencePattern, (_match, itemName) => {
    const itemMarkdown = itemResolverFn(itemName)
    if (itemMarkdown === null) {
      // アイテムが見つからない場合はエラーメッセージを表示
      return `<span class="item-not-found">⚠️ Item not found: ${itemName}</span>`
    }
    console.log('[expandItemReferences] Expanded item (@):', itemName, 'markdown length:', itemMarkdown.length)
    return itemMarkdown
  })
  
  console.log('[expandItemReferences] Result length:', result.length)
  return result
}

// アイテム参照があるかチェックする関数
export const hasItemReferences = (content: string): boolean => {
  return /@([^\s@]+)/.test(content) || /\[\[sheet:([^\]]+)\]\]/.test(content)
}

// ============================================
// カラム比率指定機能
// ============================================

/**
 * 比率指定のパース結果
 */
export interface ColumnRatioParseResult {
  ratio: number | null  // 有効な比率値、無効な場合はnull（省略時は1）
  alignment: 'top' | 'mid' | 'btm' | null  // 垂直配置（省略時はtop）
  rawValue: string | null  // 元の値（エラー表示用）
  title: string  // 比率指定を除いたタイトル
  hasRatioSyntax: boolean  // 比率構文が存在したか
  ratioError: boolean  // 比率のエラーがあるか
  alignmentError: boolean  // 配置のエラーがあるか
}

/**
 * H2/H3行から比率指定と配置指定をパースする
 * 
 * @param line - パースする行（例: "## {2 mid} タイトル"）
 * @returns パース結果
 */
export const parseColumnRatio = (line: string): ColumnRatioParseResult => {
  const trimmed = line.trim()
  
  // H2またはH3の比率・配置指定パターン: ## {比率 配置} タイトル または ### {比率 配置} タイトル
  const ratioPattern = /^(#{2,3})\s+\{([^}]*)\}\s*(.*)$/
  const match = trimmed.match(ratioPattern)
  
  if (!match) {
    // 比率指定がない場合
    // タイトル部分を抽出（## または ### を除去）
    // 空のH2/H3（##のみ）も対応
    const titleMatch = trimmed.match(/^#{2,3}(?:\s+(.*))?$/)
    return {
      ratio: null,
      alignment: null,
      rawValue: null,
      title: titleMatch && titleMatch[1] ? titleMatch[1] : '',
      hasRatioSyntax: false,
      ratioError: false,
      alignmentError: false
    }
  }
  
  const rawValue = match[2]
  const title = match[3] || ''
  
  // 空の指定 {} の場合
  if (rawValue.trim() === '') {
    return {
      ratio: null,
      alignment: null,
      rawValue: rawValue,
      title: title,
      hasRatioSyntax: true,
      ratioError: true,
      alignmentError: false
    }
  }
  
  // スペースで分割してトークンを取得
  const tokens = rawValue.trim().split(/\s+/).filter(t => t.length > 0)
  
  let ratio: number | null = null
  let alignment: 'top' | 'mid' | 'btm' | null = null
  let ratioError = false
  let alignmentError = false
  let ratioFound = false
  let alignmentFound = false
  
  // 各トークンを判定
  for (const token of tokens) {
    // 正の実数かどうかを検証
    const numValue = parseFloat(token)
    const validNumberPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/
    
    if (!isNaN(numValue) && numValue > 0 && isFinite(numValue) && validNumberPattern.test(token)) {
      // 比率として有効
      if (ratioFound) {
        // 比率が重複指定されている
        ratioError = true
      } else {
        ratio = numValue
        ratioFound = true
      }
    } else if (token === 'top' || token === 'mid' || token === 'btm') {
      // 配置指定として有効
      if (alignmentFound) {
        // 配置が重複指定されている
        alignmentError = true
      } else {
        alignment = token as 'top' | 'mid' | 'btm'
        alignmentFound = true
      }
    } else {
      // 無効なトークン
      if (!ratioFound && !alignmentFound) {
        // 最初のトークンが無効な場合、比率エラーとして扱う
        ratioError = true
      } else if (ratioFound && !alignmentFound) {
        // 比率は見つかったが、配置として無効
        alignmentError = true
      } else if (!ratioFound && alignmentFound) {
        // 配置は見つかったが、比率として無効
        ratioError = true
      } else {
        // 両方見つかった後の無効なトークン
        ratioError = true
      }
    }
  }
  
  // デフォルト値の適用
  if (!ratioFound && !ratioError) {
    ratio = 1  // 省略時は1
  }
  if (!alignmentFound && !alignmentError) {
    alignment = 'top'  // 省略時はtop
  }
  
  // エラーがある場合は、ratioとalignmentをnullにしてエラーとして扱う
  if (ratioError || alignmentError) {
    return {
      ratio: null,
      alignment: null,
      rawValue: rawValue,
      title: title,
      hasRatioSyntax: true,
      ratioError: ratioError || (ratioFound && ratio === null),
      alignmentError: alignmentError || (alignmentFound && alignment === null)
    }
  }
  
  return {
    ratio: ratio ?? 1,
    alignment: alignment ?? 'top',
    rawValue: rawValue,
    title: title,
    hasRatioSyntax: true,
    ratioError: false,
    alignmentError: false
  }
}

/**
 * 比率指定が有効かどうかを検証する
 * 
 * @param rawValue - 検証する値
 * @returns 有効な場合は比率値、無効な場合はnull
 */
export const validateColumnRatio = (rawValue: string): number | null => {
  if (!rawValue || rawValue.trim() === '') {
    return null
  }
  
  const numValue = parseFloat(rawValue.trim())
  
  if (isNaN(numValue) || numValue <= 0 || !isFinite(numValue)) {
    return null
  }
  
  // 追加の検証: 文字列として正しい数値形式か
  const validNumberPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/
  if (!validNumberPattern.test(rawValue.trim())) {
    return null
  }
  
  return numValue
}

/**
 * H2/H3行から比率指定を除去したコンテンツを返す
 * 
 * @param line - 処理する行
 * @returns 比率指定を除去した行
 */
export const removeColumnRatioFromLine = (line: string): string => {
  const trimmed = line.trim()
  
  // H2またはH3の比率指定パターン
  const ratioPattern = /^(#{2,3})\s+\{[^}]*\}\s*(.*)$/
  const match = trimmed.match(ratioPattern)
  
  if (match) {
    return `${match[1]} ${match[2]}`
  }
  
  return line
}

/**
 * ドキュメント全体から比率・配置指定 {数値} {mid} などを除去する
 * グリッドレイアウトが適用されない場合でも、比率指定がテキストとして表示されないようにする
 * 
 * @param content - 処理するコンテンツ
 * @returns 比率指定を除去したコンテンツ
 */
export const removeAllColumnRatios = (content: string): string => {
  const lines = content.split('\n')
  const result = lines.map(line => removeColumnRatioFromLine(line))
  return result.join('\n')
}

/**
 * ドキュメント全体からセクション見出し（#）を抽出する
 * レイアウト属性値付きの見出し（#ttl, #agd, #!）は除外
 * 
 * @param content - ドキュメント全体のコンテンツ
 * @returns セクション見出しの配列
 */
export const extractSectionHeadings = (content: string): string[] => {
  const lines = content.split('\n')
  const sections: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    // レイアウト属性値（#ttl, #agd, #!）は除外
    if (trimmed.match(/^#ttl\s+/) || trimmed.match(/^#agd\s+/) || trimmed.match(/^#!\s+/)) {
      continue
    }
    // 通常のH1のパターンをチェック
    const h1Match = trimmed.match(/^#\s+(.+)$/)
    if (h1Match) {
      const title = h1Match[1].trim()
      sections.push(title)
    }
  }
  
  return sections
}

/**
 * 目次を自動生成する（Markdown形式の番号付きリスト）
 * 
 * @param sections - セクション見出しの配列
 * @returns 目次のMarkdown文字列
 */
export const generateTableOfContents = (sections: string[]): string => {
  if (sections.length === 0) {
    return ''
  }
  
  return sections.map((section, index) => `${index + 1}. ${section}`).join('\n')
}

