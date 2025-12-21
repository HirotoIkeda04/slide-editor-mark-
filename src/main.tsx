import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './index.css'
import './styles/base.css'
import './styles/layouts.css'
import './styles/tones.css'
import './styles/formats.css'
import App from './App.tsx'

// 開発時のみ: 視認性チェッカーをグローバルに公開
import './utils/visibilityChecker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
