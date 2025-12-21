/**
 * GraphCategoryChips - Spotify風カテゴリフィルターチップ
 * 
 * グラフカテゴリを横並びのチップボタンで表示し、
 * 選択に応じてカルーセルに表示するグラフタイプをフィルタリングする
 */

import type { GraphCategory } from '../../types'
import { graphCategories } from '../../constants/graphConfigs'

interface GraphCategoryChipsProps {
  selectedCategory: GraphCategory
  onCategoryChange: (category: GraphCategory) => void
}

export const GraphCategoryChips = ({
  selectedCategory,
  onCategoryChange,
}: GraphCategoryChipsProps) => {
  return (
    <div className="graph-category-chips">
      <div className="graph-category-chips-scroll">
        {graphCategories.map(category => (
          <button
            key={category.id}
            className={`graph-category-chip ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
            type="button"
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}
