interface HelpModalProps {
  show: boolean
  onClose: () => void
}

export const HelpModal = ({ show, onClose }: HelpModalProps) => {
  if (!show) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-lg shadow-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: '#2b2b2b', border: '1px solid #3a3a3a' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: '#e5e7eb' }}>使い方</h2>
          <button
            onClick={onClose}
            className="rounded-lg transition-colors flex items-center justify-center"
            style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: '#3a3a3a', 
              color: '#e5e7eb',
              border: '1px solid #4a4a4a'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a4a4a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3a3a3a'
            }}
          >
            <span className="material-icons text-lg">close</span>
          </button>
        </div>
        <div className="space-y-4" style={{ color: '#e5e7eb' }}>
          <section>
            <h3 className="text-lg font-semibold mb-2">インデントベースの見出し</h3>
            <div className="opacity-90 text-sm mb-3">
              <p className="mb-2">見出しは<strong>インデントレベル</strong>で自動的に決定されます：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>インデント0 → <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>#</code> 見出し1</li>
                <li>インデント1（Tab×1） → <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>##</code> 見出し2</li>
                <li>インデント2（Tab×2） → <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>###</code> 見出し3</li>
              </ul>
            </div>
            <div className="opacity-90 text-sm mb-2">
              <p className="mb-2"><strong>操作方法：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><kbd className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>Tab</kbd> キーでインデント（右に移動）</li>
                <li><kbd className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>Shift+Tab</kbd> キーでアンインデント（左に移動）</li>
                <li><kbd className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>Enter</kbd> キーで改行時、インデントが継続されます</li>
              </ul>
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">属性値の設定</h3>
            <div className="opacity-90 text-sm mb-3">
              <p className="mb-2">行頭に<strong>記号+半角スペース</strong>を入力すると、属性値が設定されます：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}># </code> 見出し1（インデントレベル0で自動設定）</li>
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>## </code> 見出し2（インデントレベル1で自動設定）</li>
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>### </code> 見出し3（インデントレベル2で自動設定）</li>
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>- </code> または <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>* </code> 箇条書き</li>
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>1. </code> 番号付きリスト（自動で連番）</li>
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>a. </code> アルファベット付きリスト（自動で連番、表示は大文字）</li>
                <li><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>! </code> キーメッセージ</li>
              </ul>
            </div>
            <div className="opacity-70 text-xs mb-2">例：</div>
            <pre className="p-2 rounded text-xs" style={{ backgroundColor: '#1e1e1e', color: '#c9a961' }}>
{`# 見出し1
  見出し2（Tabキーでインデント）
    見出し3（Tabキーで2回インデント）
- 箇条書き1
- 箇条書き2
1. 番号付きリスト1
2. 番号付きリスト2
a. アルファベットリスト1
b. アルファベットリスト2
! キーメッセージ`}
            </pre>
            <div className="opacity-70 text-xs mt-2">
              ※ 記号+半角スペースを入力すると、記号は削除され、左側に属性値が表示されます
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">スライドの分割</h3>
            <div className="opacity-90 text-sm mb-2">
              <p>スライドは<strong>インデントレベル0の見出し（#）</strong>で自動的に分割されます。</p>
            </div>
            <div className="opacity-70 text-xs mb-2">例：</div>
            <pre className="p-2 rounded text-xs" style={{ backgroundColor: '#1e1e1e', color: '#c9a961' }}>
{`# スライド1のタイトル
コンテンツ

# スライド2のタイトル
コンテンツ`}
            </pre>
            <div className="opacity-70 text-xs mt-2">
              ※ インデントレベル0の見出し（#）が新しいスライドの開始を意味します
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">キーメッセージ</h3>
            <div className="opacity-90 text-sm mb-2">
              <p>行頭に <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#3a3a3a' }}>! </code>（感嘆符+半角スペース）で始まる行をキーメッセージとして認識します。</p>
            </div>
            <div className="opacity-70 text-xs mb-2">例：</div>
            <pre className="p-2 rounded text-xs" style={{ backgroundColor: '#1e1e1e', color: '#c9a961' }}>
{`! これはキーメッセージです

## 見出し
通常のコンテンツ`}
            </pre>
            <div className="opacity-70 text-xs mt-2">
              ※ 1スライドに1つのキーメッセージのみ（最初のものを採用）
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">コードブロック</h3>
            <div className="opacity-90 text-sm mb-2">
              コードブロックは自動的にフォントサイズが調整され、スクロールなしで全体が表示されます。
            </div>
            <pre className="p-2 rounded text-xs" style={{ backgroundColor: '#1e1e1e', color: '#c9a961' }}>
{`\`\`\`python
def hello():
    print("Hello, World!")
\`\`\``}
            </pre>
          </section>
          <section>
            <h3 className="text-lg font-semibold mb-2">フォーマットとトンマナ</h3>
            <div className="opacity-90 text-sm space-y-2">
              <div>
                <div className="font-medium">フォーマット</div>
                <div className="opacity-80">Webinar、TeamMtg、RoomSemi、HallConf、InstaPost、InstaStory、A4から選択できます。</div>
              </div>
              <div>
                <div className="font-medium">トンマナ</div>
                <div className="opacity-80">シンプル、カジュアル、ラグジュアリー、暖かいから選択できます。各トンマナで背景色やフォントが変わります。</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

