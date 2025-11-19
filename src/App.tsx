import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toPng } from 'html-to-image'
import PptxGenJS from 'pptxgenjs'
import rehypeRaw from 'rehype-raw'
import './App.css'

type SlideFormat = 'webinar' | 'meeting' | 'seminar' | 'conference' | 'instapost' | 'instastory' | 'a4'
type Tone = 'simple' | 'casual' | 'luxury' | 'warm'
type ConsoleMessageType = 'error' | 'warning' | 'info'

interface ConsoleMessage {
  type: ConsoleMessageType
  message: string
  line: number
}

interface Slide {
  content: string
}

function App() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentFormat, setCurrentFormat] = useState<SlideFormat>('webinar')
  const [currentTone, setCurrentTone] = useState<Tone>('simple')
  const [editorContent, setEditorContent] = useState(`# プレゼンテーションタイトル

あなたのプレゼンテーションをここに作成

---

## セクション1

- ポイント1
- ポイント2
- ポイント3

---

## セクション2

重要な内容をここに記述

1. 最初のステップ
2. 次のステップ
3. 最後のステップ

---

# まとめ

- 結論1
- 結論2
- 結論3

ご清聴ありがとうございました`)
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [isComposing, setIsComposing] = useState(false)
  const calculateHeadingLength = (text: string) => {
    let length = 0
    for (const char of text) {
      length += /[ -~]/.test(char) ? 0.5 : 1
    }
    return length
  }


  // スライドのパース
  useEffect(() => {
    const slideTexts = editorContent.split(/^---$/m)
    const parsedSlides = slideTexts
      .filter(text => text.trim())
      .map((text) => ({
        content: text.trim()
      }))
    
    setSlides(parsedSlides)
    if (currentIndex >= parsedSlides.length) {
      setCurrentIndex(Math.max(0, parsedSlides.length - 1))
    }
  }, [editorContent])

  useEffect(() => {
    const lines = editorContent.split('\n')
    const messages: ConsoleMessage[] = []

    lines.forEach((line, idx) => {
      const match = line.match(/^(#+)\s+(.*)$/)
      if (match) {
        const headingText = match[2].trim()
        const headingLength = calculateHeadingLength(headingText)
        if (headingLength >= 14) {
          const lengthLabel =
            Number.isInteger(headingLength) ? String(headingLength) : headingLength.toFixed(1)
          messages.push({
            type: 'error',
            message: `見出しが長すぎます (${lengthLabel}文字相当): 「${headingText}」`,
            line: idx + 1
          })
        }
      }
    })

    setConsoleMessages(messages)
  }, [editorContent])

  // スライド操作関数
  const addSlide = () => {
    setEditorContent(prev => prev + '\n\n---\n\n# 新しいスライド\n\n内容を入力')
  }

  const deleteSlide = () => {
    if (slides.length <= 1) {
      alert('最後のスライドは削除できません')
      return
    }

    if (!confirm('現在のスライドを削除しますか？')) {
      return
    }

    const newSlides = slides.filter((_, index) => index !== currentIndex)
    setEditorContent(newSlides.map(slide => slide.content).join('\n\n---\n\n'))
  }

  const savePresentation = () => {
    const blob = new Blob([editorContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'presentation.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadPresentation = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event: any) => {
        setEditorContent(event.target.result)
        setCurrentIndex(0)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const waitForRender = () =>
    new Promise<void>(resolve =>
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    )

  const captureCurrentSlide = async () => {
    if (!previewRef.current) throw new Error('プレビューが見つかりません')
    await waitForRender()
    const node = previewRef.current
    return await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: window.getComputedStyle(node).backgroundColor || '#ffffff'
    })
  }

  const exportSlideAsImage = async () => {
    try {
      const dataUrl = await captureCurrentSlide()
      const link = document.createElement('a')
      link.download = `slide-${currentIndex + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error(error)
      alert('画像の書き出しに失敗しました')
    }
  }

  const exportAllSlidesAsImages = async () => {
    if (slides.length === 0) {
      alert('書き出すスライドがありません')
      return
    }
    if (isBulkExporting) return
    setIsBulkExporting(true)
    const originalIndex = currentIndex
    try {
      for (let i = 0; i < slides.length; i++) {
        if (i !== originalIndex) {
          setCurrentIndex(i)
        }
        const dataUrl = await captureCurrentSlide()
        const link = document.createElement('a')
        link.download = `slide-${i + 1}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (error) {
      console.error(error)
      alert('一括書き出しに失敗しました')
    } finally {
      setCurrentIndex(originalIndex)
      await waitForRender()
      setIsBulkExporting(false)
    }
  }

  const formatConfigs: Record<SlideFormat, { icon: string; name: string; ratio: string }> = {
    webinar: { icon: 'videocam', name: 'Webinar', ratio: '16:9' },
    meeting: { icon: 'groups', name: 'TeamMtg', ratio: '16:9' },
    seminar: { icon: 'school', name: 'RoomSemi', ratio: '16:9' },
    conference: { icon: 'business', name: 'HallConf', ratio: '16:9' },
    instapost: { icon: 'camera_alt', name: 'InstaPost', ratio: '4:5' },
    instastory: { icon: 'phone_android', name: 'InstaStory', ratio: '9:16' },
    a4: { icon: 'description', name: '印刷', ratio: 'A4' },
  }

  const toneConfigs: Record<Tone, { name: string }> = {
    simple: { name: 'シンプル' },
    warm: { name: '暖かい' },
    casual: { name: 'カジュアル' },
    luxury: {  name: 'ラグジュアリー' }
  }

  // キーメッセージ記法をHTMLタグに変換する関数
  const convertKeyMessageToHTML = (content: string): string => {
    const lines = content.split('\n')
    let foundKeyMessage = false
    const convertedLines = lines.map(line => {
      if (!foundKeyMessage && line.trim().startsWith('! ')) {
        foundKeyMessage = true
        const keyMessageText = line.trim().substring(2) // '! 'を除去
        // HTMLタグに変換
        return `<div class="key-message">${keyMessageText}</div>`
      }
      return line
    })
    return convertedLines.join('\n')
  }

  const previewRef = useRef<HTMLDivElement>(null)
  const [isBulkExporting, setIsBulkExporting] = useState(false)
  const [isPptExporting, setIsPptExporting] = useState(false)

  const getPptSizeForFormat = (format: SlideFormat): { w: number; h: number; layoutName: string } => {
    // sizes in inches
    switch (format) {
      case 'webinar':
      case 'meeting':
      case 'seminar':
      case 'conference':
        return { w: 13.33, h: 7.5, layoutName: 'LAYOUT_16x9_CUSTOM' }
      case 'instastory':
        return { w: 7.5, h: 13.33, layoutName: 'LAYOUT_9x16_CUSTOM' }
      case 'instapost':
        return { w: 12, h: 15, layoutName: 'LAYOUT_4x5_CUSTOM' }
      case 'a4':
      default:
        return { w: 8.27, h: 11.69, layoutName: 'LAYOUT_A4_P_CUSTOM' }
    }
  }

  const getToneBgColor = (tone: Tone): string => {
    switch (tone) {
      case 'simple':
        return '#f5f5f5'
      case 'casual':
        return '#25b7c0'
      case 'luxury':
        return '#2a2a2a'
      case 'warm':
      default:
        return '#FAF9F5'
    }
  }

  const estimateAverageColorFromDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise(resolve => {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          // downscale for performance
          const targetW = 64
          const ratio = img.width ? targetW / img.width : 1
          canvas.width = Math.max(1, Math.min(targetW, img.width))
          canvas.height = Math.max(1, Math.round((img.height || 1) * ratio))
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve('#333333')
            return
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
          let r = 0, g = 0, b = 0, count = 0
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3]
            if (a === 0) continue
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            count++
          }
          if (count === 0) {
            resolve('#333333')
            return
          }
          r = Math.round(r / count)
          g = Math.round(g / count)
          b = Math.round(b / count)
          const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
          resolve(hex)
        }
        img.onerror = () => resolve('#333333')
        img.src = dataUrl
      } catch {
        resolve('#333333')
      }
    })
  }

  const exportCurrentAsPptx = async () => {
    if (slides.length === 0) {
      alert('書き出すスライドがありません')
      return
    }
    if (isPptExporting) return
    setIsPptExporting(true)
    const originalIndex = currentIndex
    try {
      const pptx = new PptxGenJS()
      const { w, h, layoutName } = getPptSizeForFormat(currentFormat)
      pptx.defineLayout({ name: layoutName, width: w, height: h })
      pptx.layout = layoutName

      // pre-capture PNGs to avoid layout changes during addSlide
      const pngs: string[] = []
      for (let i = 0; i < slides.length; i++) {
        if (i !== originalIndex) setCurrentIndex(i)
        const dataUrl = await captureCurrentSlide()
        pngs.push(dataUrl)
      }
      // restore
      setCurrentIndex(originalIndex)
      await waitForRender()

      for (let i = 0; i < pngs.length; i++) {
        const dataUrl = pngs[i]
        const fallbackColor = getToneBgColor(currentTone)
        const avgColor = await estimateAverageColorFromDataUrl(dataUrl).then(c => c || fallbackColor)
        const slide = pptx.addSlide({ bkgd: avgColor })
        slide.addImage({ data: dataUrl, x: 0, y: 0, w, h })
      }

      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${formatConfigs[currentFormat].name}_${stamp}.pptx`
      await pptx.writeFile({ fileName })
    } catch (e) {
      console.error(e)
      alert('PPTXの書き出しに失敗しました')
    } finally {
      setIsPptExporting(false)
    }
  }

  // Code block component for syntax highlighting with auto-sizing
  const CodeBlock = ({ 
    inline, 
    className, 
    children, 
    ...props 
  }: {
    inline?: boolean
    className?: string
    children?: React.ReactNode
    [key: string]: any
  }) => {
    const codeRef = useRef<HTMLDivElement>(null)
    const [fontSize, setFontSize] = useState<string>('clamp(0.75em, 1.5vmin, 0.9em)')
    
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    
    useEffect(() => {
      if (inline || !language || !codeRef.current) return
      
      const adjustFontSize = () => {
        const codeElement = codeRef.current
        if (!codeElement) return
        
        // SyntaxHighlighterがレンダリングする内部のdiv要素を取得
        const syntaxHighlighterDiv = codeElement.querySelector('div[class*="language-"]') as HTMLElement
        if (!syntaxHighlighterDiv) return
        
        // スライドコンテナを取得（.proseの親の親）
        const slideContainer = codeElement.closest('.shadow-2xl') as HTMLElement
        if (!slideContainer) return
        
        const slideHeight = slideContainer.clientHeight
        const slidePadding = parseFloat(getComputedStyle(slideContainer).paddingTop) + 
                             parseFloat(getComputedStyle(slideContainer).paddingBottom)
        
        // proseコンテナを取得
        const proseContainer = codeElement.closest('.prose')?.parentElement as HTMLElement
        if (!proseContainer) return
        
        const prosePadding = parseFloat(getComputedStyle(proseContainer).paddingTop) + 
                            parseFloat(getComputedStyle(proseContainer).paddingBottom)
        
        // コードブロック以外のコンテンツの高さを推定
        const codeBlockTop = codeElement.getBoundingClientRect().top - proseContainer.getBoundingClientRect().top
        const availableHeight = slideHeight - slidePadding - prosePadding - codeBlockTop - 40 // 下部の余白
        
        const codeHeight = syntaxHighlighterDiv.scrollHeight
        
        if (codeHeight > availableHeight) {
          const ratio = availableHeight / codeHeight
          const currentFontSize = parseFloat(getComputedStyle(syntaxHighlighterDiv).fontSize) || 14
          const newFontSize = Math.max(currentFontSize * ratio * 0.9, 6) // 最小6px、さらに余裕を持たせる
          setFontSize(`${newFontSize}px`)
        } else {
          setFontSize('clamp(0.75em, 1.5vmin, 0.9em)')
        }
      }
      
      // レンダリング後に調整（複数回試行）
      let attemptCount = 0
      const maxAttempts = 5
      
      const tryAdjust = () => {
        adjustFontSize()
        attemptCount++
        if (attemptCount < maxAttempts) {
          setTimeout(tryAdjust, 150)
        }
      }
      
      const timeoutId = setTimeout(tryAdjust, 100)
      
      const resizeObserver = new ResizeObserver(() => {
        attemptCount = 0
        tryAdjust()
      })
      
      if (codeRef.current) {
        resizeObserver.observe(codeRef.current)
      }
      
      const slideContainer = codeRef.current?.closest('.shadow-2xl')
      if (slideContainer) {
        resizeObserver.observe(slideContainer)
      }
      
      const proseContainer = codeRef.current?.closest('.prose')?.parentElement
      if (proseContainer) {
        resizeObserver.observe(proseContainer)
      }
      
      return () => {
        clearTimeout(timeoutId)
        resizeObserver.disconnect()
      }
    }, [children, inline, language])
    
    if (inline || !language) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }

  return (
      <div ref={codeRef} className="code-block-wrapper">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: '0',
            borderRadius: '0.375rem',
            fontSize: fontSize,
            lineHeight: '1.4',
            overflow: 'hidden',
            backgroundColor: '#1e1e1e', // 固定の背景色（トンマナの影響を受けない）
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    )
  }

  

  return (
    <div className="h-screen flex flex-col">

            {/* ツールバー */}
            <div className="border-b px-4 py-3 flex gap-3 items-center flex-wrap shadow-sm" style={{ backgroundColor: '#2b2b2b', borderColor: '#3a3a3a', color: '#e5e7eb' }}>
        <button 
          onClick={addSlide} 
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">add</span>
          <span>スライド追加</span>
        </button>
        <button 
          onClick={deleteSlide} 
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">delete</span>
          <span>スライド削除</span>
        </button>
        
        <div className="w-px h-6" style={{ backgroundColor: '#4a4a4a' }} />
        <button 
          onClick={savePresentation} 
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">save</span>
          <span>保存</span>
        </button>
        <button 
          onClick={loadPresentation} 
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">folder_open</span>
          <span>読み込み</span>
        </button>
        <button
          onClick={exportSlideAsImage}
          disabled={slides.length === 0 || isBulkExporting}
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">image</span>
          <span>画像保存</span>
        </button>
        <button
          onClick={exportAllSlidesAsImages}
          disabled={slides.length === 0 || isBulkExporting}
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">folder</span>
          <span>まとめて保存</span>
        </button>
        <button
          onClick={exportCurrentAsPptx}
          disabled={slides.length === 0 || isPptExporting}
          className="px-4 py-2 rounded-lg transition-colors border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ backgroundColor: '#3a3a3a', borderColor: '#4a4a4a', color: '#e5e7eb' }}
        >
          <span className="material-icons text-lg">description</span>
          <span>PPTX出力</span>
        </button>
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* プレビュー */}
        <div className="w-1/2 flex flex-col p-4">
          {/* トンマナ（チップ） */}
          <div className="mb-3 flex gap-2 flex-wrap">
            {(Object.keys(toneConfigs) as Tone[]).map(tone => (
              <button
                key={tone}
                onClick={() => setCurrentTone(tone)}
                className={`tone-chip ${currentTone === tone ? 'active' : ''}`}
                type="button"
              >
                {toneConfigs[tone].name}
              </button>
            ))}
          </div>

          {/* フォーマットタブ（ブラウザタブ風） */}
          <div className="preview-tab-list flex gap-0">
            {(Object.keys(formatConfigs) as SlideFormat[]).map(format => (
              <button
                key={format}
                onClick={() => setCurrentFormat(format)}
                className={`preview-tab ${currentFormat === format ? 'active' : ''}`}
                type="button"
              >
                <span className="material-icons text-lg mr-1">{formatConfigs[format].icon}</span>
                {currentFormat === format && (
                  <span className="tab-main-text">
                    {formatConfigs[format].name}
                    <span className="tab-ratio text-xs opacity-60 ml-1">{formatConfigs[format].ratio}</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* プレビューエリア */}
          <div
            className="flex-1 rounded-b-lg p-4 flex items-center justify-center relative overflow-hidden"
            style={{ paddingTop: 0, marginTop: '-1px', borderTop: '1.5px solid #e5e7eb', backgroundColor: '#1e1e1e' }}
          >
            {slides.length > 0 ? (() => {
              const slideContent = slides[currentIndex]?.content || ''
              const convertedContent = convertKeyMessageToHTML(slideContent)
              
              if (currentFormat === 'instapost') {
                return (
                <div
                  ref={previewRef}
                  className={`shadow-2xl overflow-hidden instapost-wrapper tone-${currentTone} h-5/6 aspect-[4/5]`}
                >
                  <div className="instapost-frame">
                    <div className="instapost-inner">
                      <div className="prose prose-lg max-w-none">
                        <ReactMarkdown
                          components={{
                            code: CodeBlock,
                          }}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {convertedContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
                )
              }
              
              return (
                <div
                  ref={previewRef}
                  className={`shadow-2xl overflow-hidden tone-${currentTone} ${
                    ['webinar', 'meeting', 'seminar', 'conference'].includes(currentFormat)
                      ? 'w-full max-w-4xl aspect-video' :
                    currentFormat === 'instastory'
                      ? 'h-5/6 aspect-[9/16]' :
                'h-5/6 aspect-[210/297]'
                  }`}
                >
                  <div className={`h-full ${currentFormat === 'instastory' ? 'text-center' : ''} ${
                    currentTone === 'simple' ? 'bg-tone-simple' :
                    currentTone === 'casual' ? 'bg-tone-casual' :
                    currentTone === 'luxury' ? 'bg-tone-luxury' :
                    'bg-tone-warm'
                  } p-8`}>
                  <div className="prose prose-lg max-w-none">
                      <ReactMarkdown
                        components={{
                          code: CodeBlock,
                        }}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {convertedContent}
                    </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )
            })() : (
              <p className="text-gray-400">スライドがありません</p>
            )}

            {/* ナビゲーション */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 items-center">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2a2a2a', color: '#eee' }}
              >
                ◀
              </button>
              <span className="px-4 py-2 rounded-lg shadow" style={{ backgroundColor: '#2a2a2a', color: '#eee' }}>
                {currentIndex + 1} / {slides.length || 1}
              </span>
              <button
                onClick={() => setCurrentIndex(Math.min(slides.length - 1, currentIndex + 1))}
                disabled={currentIndex >= slides.length - 1}
                className="px-4 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2a2a2a', color: '#eee' }}
              >
                ▶
              </button>
        </div>
      </div>

          {/* スライドカルーセル */}
          <div className="px-2" style={{ marginTop: '16px', height: '12vh', minHeight: '120px', maxHeight: '150px' }}>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar h-full items-center">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all border hover:border-blue-400 ${
                    idx === currentIndex ? 'border-2 border-blue-500 shadow-lg ring-2 ring-blue-100' : 'border-gray-300'
                  } bg-white rounded-lg flex-shrink-0 cursor-pointer overflow-hidden`}
                  style={{
                    width: currentFormat === 'instastory' ? '80px' : currentFormat === 'a4' ? '70px' : '140px',
                    aspectRatio:
                      ['webinar', 'meeting', 'seminar', 'conference'].includes(currentFormat)
                        ? '16/9'
                        : currentFormat === 'instastory'
                        ? '9/16'
                        : currentFormat === 'a4'
                        ? '210/297'
                        : '4/5'
                  }}
                  tabIndex={0}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  <div className="w-full h-full p-1 overflow-hidden">
                    <div 
                      className="w-full h-full bg-white p-2 overflow-hidden"
                      style={{ 
                        fontSize: '0.15em',
                        lineHeight: '1.2'
                      }}
                    >
                      <div className={`prose-thumbnail ${currentFormat === 'instastory' ? 'text-center' : ''}`}>
                        <ReactMarkdown
                          components={{
                            code: CodeBlock,
                          }}
                        >
                          {slide.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* エディター */}
        <div className="w-1/2 flex flex-col p-4">
          <div className="mb-3">
            
            <div className="p-3 rounded-lg text-xs text-white" style={{ backgroundColor: '#2a2a2a' }}>
              <strong>Markdown記法:</strong> # 見出し | ## 小見出し | - 箇条書き | --- でスライド区切り
            </div>
          </div>
          <div className="editor-with-lines flex flex-1 overflow-hidden border rounded-lg" style={{ backgroundColor: '#1e1e1e', borderColor: '#3a3a3a' }}>
            <div
              className="editor-lines font-mono text-xs select-none p-4 text-right border-r overflow-hidden box-border"
              style={{ minWidth: 38, lineHeight: '1.5', boxSizing: 'border-box', backgroundColor: '#222', borderColor: '#3a3a3a', color: '#666' }}
              id="line-number-column"
            >
              {editorContent.split("\n").map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
          </div>
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                if (isComposing) return
                const target = e.currentTarget
                const { selectionStart, selectionEnd, value } = target
                if (selectionStart !== selectionEnd) return

                const beforeCursor = value.slice(0, selectionStart)
                const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
                const currentLine = beforeCursor.slice(currentLineStart)

                const unorderedListMatch = currentLine.match(/^(\s*)([-*+])\s+/)
                const orderedListMatch = currentLine.match(/^(\s*)(\d+)\.\s+/)

                if (!unorderedListMatch && !orderedListMatch) return

                e.preventDefault()

                const indent = unorderedListMatch?.[1] ?? orderedListMatch?.[1] ?? ''
                let insertText = '\n'

                if (unorderedListMatch) {
                  insertText += `${indent}${unorderedListMatch[2]} `
                } else if (orderedListMatch) {
                  const nextNumber = Number(orderedListMatch[2]) + 1
                  insertText += `${indent}${nextNumber}. `
                }

                const newValue =
                  value.slice(0, selectionStart) + insertText + value.slice(selectionEnd)
                const newCursor = selectionStart + insertText.length

                setEditorContent(newValue)
                requestAnimationFrame(() => {
                  target.selectionStart = target.selectionEnd = newCursor
                })
              }}
              className="flex-1 p-4 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent box-border text-white"
            placeholder="スライドの内容を入力..."
              style={{ border: 'none', outline: 'none', minHeight: 0, lineHeight: '1.5', boxSizing: 'border-box' }}
              id="slide-editor-textarea"
              onScroll={e => {
                const line = document.getElementById('line-number-column');
                if (line) line.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
              }}
            />
          </div>
          <div className="console-panel mt-4">
            <div className="console-header">
              <span>コンソール</span>
              <span className="console-count">{consoleMessages.length}件</span>
            </div>
            <div className="console-body">
              {consoleMessages.length === 0 ? (
                <div className="console-empty">エラーはありません</div>
              ) : (
                consoleMessages.map((msg, index) => (
                  <div key={`${msg.line}-${index}`} className={`console-entry ${msg.type}`}>
                    <span className="console-line">L{msg.line}</span>
                    <span>{msg.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  )
}

export default App
