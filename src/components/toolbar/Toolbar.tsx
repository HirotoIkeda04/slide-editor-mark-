import { useThemeContext } from '../../contexts/ThemeContext'
import './Toolbar.css'

interface ToolbarProps {
  onShowHelp: () => void
  onShowExport: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export const Toolbar = ({
  onShowHelp,
  onShowExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: ToolbarProps) => {
  const { isDark, toggleTheme } = useThemeContext()
  return (
    <div className="toolbar-container">
      <div className="mark-logo">
        MARK
      </div>
      <div className="toolbar-buttons">
        {/* Undo/Redo buttons */}
        <div className="toolbar-button-group">
          <button 
            onClick={onUndo} 
            className={`toolbar-button toolbar-button-history ${!canUndo ? 'toolbar-button-disabled' : ''}`}
            data-tooltip="元に戻す (Ctrl+Z)"
            disabled={!canUndo}
          >
            <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9L9 4" />
              <path d="M4 9H15C17.7614 9 20 11.2386 20 14C20 16.7614 17.7614 19 15 19H11" />
            </svg>
          </button>
          <button 
            onClick={onRedo} 
            className={`toolbar-button toolbar-button-history ${!canRedo ? 'toolbar-button-disabled' : ''}`}
            data-tooltip="やり直す (Ctrl+Y)"
            disabled={!canRedo}
          >
            <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14L20 9L15 4" />
              <path d="M20 9H9C6.23858 9 4 11.2386 4 14C4 16.7614 6.23858 19 9 19H13" />
            </svg>
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-button-group">
          <button onClick={onShowHelp} className="toolbar-button" data-tooltip="使い方">
            <span className="material-icons toolbar-icon">help_outline</span>
          </button>
          <button 
            onClick={toggleTheme} 
            className="toolbar-button" 
            data-tooltip={isDark ? 'ライトモード' : 'ダークモード'}
          >
            <span className="material-icons toolbar-icon">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <button onClick={onShowExport} className="toolbar-button toolbar-button-primary" data-tooltip="保存">
          <span className="material-icons toolbar-icon">download</span>
        </button>
      </div>
    </div>
  )
}

