/**
 * GraphListSection - グラフ一覧セクション
 * 
 * すべてのグラフタイプをグリッド形式で表示
 * カテゴリフィルター付き
 */

import type { TableDisplayFormat, GraphCategory } from '../../../types'
import { graphCategories, getGraphTypesByCategory } from '../../../constants/graphConfigs'

interface GraphListSectionProps {
  currentFormat: TableDisplayFormat
  onFormatChange: (format: TableDisplayFormat) => void
  selectedCategory?: GraphCategory
  onCategoryChange?: (category: GraphCategory) => void
}

export const GraphListSection = ({
  currentFormat,
  onFormatChange,
  selectedCategory = 'all',
  onCategoryChange,
}: GraphListSectionProps) => {
  const graphTypes = getGraphTypesByCategory(selectedCategory)
  
  return (
    <div className="graph-panel-section">
      <div className="graph-section-title">グラフタイプ</div>
      
      {/* カテゴリフィルター */}
      <div className="graph-category-chips" style={{ marginBottom: '0.75rem' }}>
        <div className="graph-category-chips-scroll">
          {graphCategories.map(category => (
            <button
              key={category.id}
              className={`graph-category-chip ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onCategoryChange?.(category.id)}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* グラフ一覧グリッド */}
      <div className="graph-list-grid">
        {graphTypes.map(graphType => (
          <button
            key={graphType.id}
            className={`graph-list-item ${currentFormat === graphType.id ? 'active' : ''}`}
            onClick={() => onFormatChange(graphType.id)}
            type="button"
            title={graphType.description}
          >
            <span className="material-icons">{graphType.icon}</span>
            <span className="graph-list-item-label">{graphType.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
