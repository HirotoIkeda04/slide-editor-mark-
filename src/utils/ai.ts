import type { ChatMessage, ChatMode, ClaudeModel, AIStreamEvent, AIEditToolInput, SearchReplaceInput, InsertAfterInput, DeleteContentInput } from '../types'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

if (!apiKey) {
  console.warn('VITE_ANTHROPIC_API_KEY is not set. AI features will not work.')
}

// ツール定義（Anthropic API形式）
const EDIT_TOOLS = [
  {
    name: 'replace_content',
    description: 'エディタのコンテンツを全て置き換えます。大幅な変更や新規作成に使用します。',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '新しいコンテンツ全体'
        },
        reason: {
          type: 'string',
          description: '変更理由（任意）'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'search_replace',
    description: '特定の文字列を検索して置換します。部分的な編集に使用します。検索文字列は完全一致である必要があります。',
    input_schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: '検索する文字列（完全一致）'
        },
        replace: {
          type: 'string',
          description: '置換後の文字列'
        },
        reason: {
          type: 'string',
          description: '変更理由（任意）'
        }
      },
      required: ['search', 'replace']
    }
  },
  {
    name: 'insert_after',
    description: '指定した文字列の後にコンテンツを挿入します。',
    input_schema: {
      type: 'object',
      properties: {
        after: {
          type: 'string',
          description: 'この文字列の後に挿入（完全一致）'
        },
        content: {
          type: 'string',
          description: '挿入するコンテンツ'
        },
        reason: {
          type: 'string',
          description: '変更理由（任意）'
        }
      },
      required: ['after', 'content']
    }
  },
  {
    name: 'delete_content',
    description: '指定した文字列を削除します。',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '削除する文字列（完全一致）'
        },
        reason: {
          type: 'string',
          description: '変更理由（任意）'
        }
      },
      required: ['content']
    }
  }
]

const getSystemPrompt = (mode: ChatMode, editorContent: string): string => {
  const baseContext = `このエディタはスライド作成用のMarkdown記法を使用します。以下の記法を理解し、適切に使用してください：

1. レイアウトタイプ記法:
   - \`#ttl タイトル\` - 表紙スライド (title)
   - \`#agd タイトル\` - 目次スライド (agenda)
   - \`#! タイトル\` - まとめスライド
   - \`# タイトル\` - 中扉スライド（セクション区切り、自動的に中央揃え）

2. キーメッセージ記法:
   - \`! メッセージ\` で始まる行はキーメッセージ
   - スライドごとに1つのキーメッセージが表示される

3. スライド分割:
   - # (h1) の見出しでスライドが分割される
   - レイアウトタイプ(#ttl, #agd, #!)もスライド区切りになる
   - --- 区切り線は使用しない

4. 見出し制限:
   - 見出しは14文字以内（半角は0.5文字）

5. H2の横並びレイアウト:
   - 1つのスライド内に複数の ## があるとグリッド表示

6. 標準Markdown:
   - \`-\` または \`*\` で箇条書き
   - \`1.\` で番号付きリスト
   - コードブロック対応

現在のエディタ内容:
\`\`\`
${editorContent}
\`\`\``

  switch (mode) {
    case 'write':
      return `あなたはスライド作成を支援するAIアシスタントです。

${baseContext}

ユーザーの依頼に基づいて、スライドの内容を作成または大幅に書き換えます。
replace_contentツールを使用して、新しいコンテンツを提供してください。

重要:
- 必ずreplace_contentツールを使用してコンテンツを返してください
- 説明やコメントは最小限に、ツールの実行を優先してください
- 日本語で作成してください`

    case 'edit':
      return `あなたはスライド編集を支援するAIアシスタントです。

${baseContext}

ユーザーの依頼に基づいて、スライドの内容を部分的に編集します。
以下のツールを使用して編集を行ってください：
- search_replace: 特定の文字列を検索して置換
- insert_after: 特定の文字列の後にコンテンツを挿入
- delete_content: 特定の文字列を削除
- replace_content: 大幅な変更が必要な場合のみ

重要:
- 必ずツールを使用して編集を行ってください
- 検索文字列は現在のコンテンツから正確にコピーしてください
- 複数の編集が必要な場合は、複数回ツールを呼び出してください
- 説明やコメントは最小限に、ツールの実行を優先してください`

    case 'ask':
      return `あなたはスライド作成を支援するAIアシスタントです。

${baseContext}

ユーザーの質問に回答します。コンテンツの編集は行いません。
- 現在のスライドについての質問に答える
- 改善提案を説明する（実際の編集はしない）
- 使い方やベストプラクティスを説明する

ツールは使用しないでください。テキストで回答のみを行ってください。`

    default:
      return `あなたはスライド作成を支援するAIアシスタントです。

${baseContext}`
  }
}

/**
 * ストリーミング対応のチャットメッセージ送信
 */
export async function* sendChatMessageStream(
  messages: ChatMessage[],
  editorContent: string,
  mode: ChatMode = 'edit',
  model: ClaudeModel = 'claude-sonnet-4-20250514'
): AsyncGenerator<AIStreamEvent> {
  if (!apiKey) {
    yield { type: 'error', error: 'Anthropic API key is not configured' }
    return
  }

  const systemPrompt = getSystemPrompt(mode, editorContent)

  try {
    const apiUrl = 'https://api.anthropic.com/v1/messages'
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    }

    // メッセージをAnthropic API形式に変換
    const apiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const requestBody: Record<string, unknown> = {
      model: model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: apiMessages,
      stream: true
    }

    // askモード以外はツールを使用
    if (mode !== 'ask') {
      requestBody.tools = EDIT_TOOLS
      // writeモードではreplace_contentを強制、editモードでは自動選択
      if (mode === 'write') {
        requestBody.tool_choice = { type: 'tool', name: 'replace_content' }
      } else {
        requestBody.tool_choice = { type: 'auto' }
      }
    }

    console.log('[AI] Streaming request:', { model, mode, messageCount: messages.length })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API Error Response:', errorData)
      const errorMessage = errorData.error?.message || errorData.message || response.statusText
      yield { type: 'error', error: `API Error (${response.status}): ${errorMessage}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'Response body is not readable' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let currentToolName: string | undefined
    let currentToolInput = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const event = JSON.parse(data)
          
          switch (event.type) {
            case 'content_block_start':
              if (event.content_block?.type === 'tool_use') {
                currentToolName = event.content_block.name
                currentToolInput = ''
                yield { type: 'tool_use_start', toolName: currentToolName }
              }
              break

            case 'content_block_delta':
              if (event.delta?.type === 'text_delta') {
                yield { type: 'text', content: event.delta.text }
              } else if (event.delta?.type === 'input_json_delta') {
                currentToolInput += event.delta.partial_json
              }
              break

            case 'content_block_stop':
              if (currentToolName && currentToolInput) {
                try {
                  const toolInput = JSON.parse(currentToolInput) as AIEditToolInput
                  yield { type: 'tool_use_end', toolName: currentToolName, toolInput }
                } catch (e) {
                  console.error('Failed to parse tool input:', e)
                }
                currentToolName = undefined
                currentToolInput = ''
              }
              break

            case 'message_stop':
              yield { type: 'done' }
              break
          }
        } catch (e) {
          // JSON parse error for incomplete data, ignore
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      yield { type: 'error', error: 'ネットワークエラーが発生しました。' }
    } else {
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

/**
 * 非ストリーミング版（後方互換性のため）
 */
export const sendChatMessage = async (
  messages: ChatMessage[],
  editorContent: string,
  mode: ChatMode = 'edit',
  model: ClaudeModel = 'claude-sonnet-4-20250514'
): Promise<{ text: string; toolCalls: Array<{ name: string; input: AIEditToolInput }> }> => {
  let text = ''
  const toolCalls: Array<{ name: string; input: AIEditToolInput }> = []

  for await (const event of sendChatMessageStream(messages, editorContent, mode, model)) {
    switch (event.type) {
      case 'text':
        text += event.content || ''
        break
      case 'tool_use_end':
        if (event.toolName && event.toolInput) {
          toolCalls.push({ name: event.toolName, input: event.toolInput })
        }
        break
      case 'error':
        throw new Error(event.error)
    }
  }

  return { text, toolCalls }
}

/**
 * ツールの結果を元のコンテンツに適用する
 */
export const applyToolToContent = (
  originalContent: string,
  toolName: string,
  toolInput: AIEditToolInput
): { content: string; success: boolean; error?: string } => {
  console.log('[applyToolToContent]', { toolName, toolInput })

  switch (toolName) {
    case 'replace_content': {
      const input = toolInput as { content: string }
      return { content: input.content, success: true }
    }

    case 'search_replace': {
      const input = toolInput as SearchReplaceInput
      if (!originalContent.includes(input.search)) {
        return { 
          content: originalContent, 
          success: false, 
          error: `検索文字列が見つかりません: "${input.search.substring(0, 50)}..."` 
        }
      }
      const newContent = originalContent.replace(input.search, input.replace)
      return { content: newContent, success: true }
    }

    case 'insert_after': {
      const input = toolInput as InsertAfterInput
      if (!originalContent.includes(input.after)) {
        return { 
          content: originalContent, 
          success: false, 
          error: `挿入位置が見つかりません: "${input.after.substring(0, 50)}..."` 
        }
      }
      const newContent = originalContent.replace(input.after, input.after + input.content)
      return { content: newContent, success: true }
    }

    case 'delete_content': {
      const input = toolInput as DeleteContentInput
      if (!originalContent.includes(input.content)) {
        return { 
          content: originalContent, 
          success: false, 
          error: `削除対象が見つかりません: "${input.content.substring(0, 50)}..."` 
        }
      }
      const newContent = originalContent.replace(input.content, '')
      return { content: newContent, success: true }
    }

    default:
      return { content: originalContent, success: false, error: `Unknown tool: ${toolName}` }
  }
}

/**
 * 複数のツール呼び出しを順番に適用
 */
export const applyToolsToContent = (
  originalContent: string,
  toolCalls: Array<{ name: string; input: AIEditToolInput }>
): { content: string; errors: string[] } => {
  let content = originalContent
  const errors: string[] = []

  for (const tool of toolCalls) {
    const result = applyToolToContent(content, tool.name, tool.input)
    if (result.success) {
      content = result.content
    } else if (result.error) {
      errors.push(result.error)
    }
  }

  return { content, errors }
}

/**
 * AIを使用してテーブルに適切な名前を生成する
 */
export const generateTableNameWithAI = async (
  headers: string[] | undefined,
  data: string[][]
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is not set')
  }

  let tableContent = ''
  if (headers && headers.length > 0) {
    tableContent += `ヘッダー: ${headers.join(', ')}\n`
  }
  if (data && data.length > 0) {
    tableContent += `データ（最初の5行）:\n`
    const sampleData = data.slice(0, 5)
    sampleData.forEach((row, idx) => {
      tableContent += `${idx + 1}. ${row.join(', ')}\n`
    })
    if (data.length > 5) {
      tableContent += `... 他${data.length - 5}行\n`
    }
  }

  const prompt = `以下のテーブルデータに対して、適切な日本語の名前を1つだけ生成してください。

${tableContent}

条件:
- 20文字以内
- スペースを含まない（アンダースコア「_」は使用可）
- テーブルの内容・目的を端的に表す名前
- 名前のみを返答してください（説明や装飾は不要）

名前:`

  const modelId = 'claude-3-5-haiku-20241022'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 100,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[generateTableNameWithAI] API error:', errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    let generatedName = result.content?.[0]?.text?.trim() || ''
    
    generatedName = generatedName.replace(/\s+/g, '_')
    generatedName = generatedName.substring(0, 20)
    generatedName = generatedName.replace(/[「」『』【】\[\]()（）:：.。、,]/g, '')
    
    if (!generatedName) {
      throw new Error('Empty name generated')
    }
    
    return generatedName
  } catch (error) {
    console.error('[generateTableNameWithAI] Error:', error)
    throw error
  }
}

/**
 * AIの応答から表データを抽出する
 */
export const extractTableFromResponse = (response: string): { headers?: string[], data: string[][] } | null => {
  const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  const markdownTableLines: string[] = []
  let inTable = false
  
  for (const line of lines) {
    if (line.startsWith('|') && line.endsWith('|')) {
      markdownTableLines.push(line)
      inTable = true
    } else if (inTable && !line.startsWith('|')) {
      break
    }
  }
  
  if (markdownTableLines.length >= 2) {
    const headerLine = markdownTableLines[0]
    const dataLines = markdownTableLines.slice(2)
    
    const headers = headerLine
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0)
    
    const data: string[][] = dataLines.map(line => {
      const cells = line.split('|').map(cell => cell.trim())
      return cells.slice(1, -1)
    })
    
    if (headers.length > 0) {
      return { headers, data }
    }
  }
  
  // CSV形式
  const csvLines: string[] = []
  for (const line of lines) {
    if (line.includes(',') && line.split(',').length >= 2) {
      csvLines.push(line)
    } else if (csvLines.length > 0) {
      break
    }
  }
  
  if (csvLines.length >= 1) {
    const headers = csvLines[0].split(',').map(cell => cell.trim())
    const data = csvLines.slice(1).map(line => {
      return line.split(',').map(cell => cell.trim())
    })
    
    if (headers.length > 0) {
      return { headers, data: data.length > 0 ? data : [] }
    }
  }
  
  return null
}

// 後方互換性のためのダミー関数
export const applyDiffToContent = (originalContent: string, _aiResponse: string): string => {
  console.warn('[applyDiffToContent] This function is deprecated. Use applyToolsToContent instead.')
  return originalContent
}
