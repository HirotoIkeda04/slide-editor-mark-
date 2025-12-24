import './Header.css'

interface HeaderProps {
  projectName: string
  selectedItemName: string
  tonmanaName: string
  isTonmanaSelected: boolean
  onTonmanaClick: () => void
  onShowExport: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export const Header = ({
  projectName,
  selectedItemName,
  tonmanaName,
  isTonmanaSelected,
  onTonmanaClick,
  onShowExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: HeaderProps) => {
  return (
    <header className="app-header">
      {/* Project Name / Selected Item */}
      <div className="header-breadcrumb">
        <span className="header-breadcrumb-project">{projectName}</span>
        <span className="header-breadcrumb-separator">/</span>
        <span className="header-breadcrumb-item">{selectedItemName}</span>
      </div>

      {/* Tone & Manner */}
      <button
        className={`header-tonmana ${isTonmanaSelected ? 'active' : ''}`}
        onClick={onTonmanaClick}
        title="Tone & Manner を選択"
      >
        <span className="header-tonmana-name">{tonmanaName}</span>
        <span className="material-icons header-tonmana-icon">expand_more</span>
      </button>

      {/* Actions */}
      <div className="header-actions">
        {/* Undo/Redo */}
        <div className="header-history-group">
          <button
            className="header-history-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="元に戻す (Ctrl+Z)"
          >
            <span className="material-icons">undo</span>
          </button>
          <button
            className="header-history-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="やり直す (Ctrl+Y)"
          >
            <span className="material-icons">redo</span>
          </button>
        </div>

        {/* Save/Export Button */}
        <button
          className="header-action-btn primary"
          onClick={onShowExport}
          title="保存・エクスポート"
        >
          <span className="material-icons">download</span>
        </button>
      </div>
    </header>
  )
}
