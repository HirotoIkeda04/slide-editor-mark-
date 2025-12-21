import { useMemo } from 'react'
import { 
  rootCategories, 
  getAvailableSubcategories,
  getCategoryLabel,
  getBiomesByCategories,
} from '../../constants/tonmanaBiomes'
import type { TonmanaFilterCategory } from '../../types'

interface TonmanaCategoryTabsProps {
  selectedCategories: TonmanaFilterCategory[]
  onCategoryAdd: (category: TonmanaFilterCategory) => void
  onCategoriesClear: () => void
  usedBiomeIds?: string[]
}

/**
 * Spotify風ドリルダウンUIのフィルターカテゴリタブ（階層構造対応）
 * 
 * State 0 (未選択): 第1レベルカテゴリをダークピルで表示
 * State 1+ (選択済): ×ボタン + 選択カテゴリをグリーンピル + サブカテゴリをダークピルで表示
 * 
 * Tone & Mannerの選択は TonmanaChipList で行う
 */
export const TonmanaCategoryTabs = ({
  selectedCategories,
  onCategoryAdd,
  onCategoriesClear,
  usedBiomeIds = [],
}: TonmanaCategoryTabsProps) => {
  // 利用可能なサブカテゴリを取得
  const availableSubcategories = useMemo(() => {
    const subcats = getAvailableSubcategories(selectedCategories)
    
    // 「利用済み」カテゴリは、利用済みバイオームがある場合のみ表示
    return subcats.filter(cat => {
      if (cat === 'used') {
        return usedBiomeIds.length > 0
      }
      // サブカテゴリを選択した結果、該当バイオームが0件になる場合は非表示
      const potentialCategories = [...selectedCategories, cat]
      const biomes = getBiomesByCategories(potentialCategories, usedBiomeIds)
      return biomes.length > 0
    })
  }, [selectedCategories, usedBiomeIds])

  // State 0: カテゴリ未選択
  if (selectedCategories.length === 0) {
    // 第1レベルカテゴリを表示
    const visibleRootCategories = rootCategories.filter(cat => {
      if (cat === 'used') {
        return usedBiomeIds.length > 0
      }
      return true
    })
    
    return (
      <div className="tonmana-category-tabs">
        <div className="tonmana-tabs-scroll">
          {visibleRootCategories.map(catId => (
            <button
              key={catId}
              className="tonmana-chip-dark"
              onClick={() => onCategoryAdd(catId)}
              type="button"
            >
              {getCategoryLabel(catId)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // State 1+: カテゴリ選択済み
  return (
    <div className="tonmana-category-tabs">
      <div className="tonmana-tabs-scroll">
        {/* × ボタン（全クリア） */}
        <button
          className="tonmana-back-btn"
          onClick={onCategoriesClear}
          type="button"
          aria-label="フィルターをクリア"
        >
          <span className="material-icons">close</span>
        </button>
        
        {/* 選択されたカテゴリ（連結グリーンピル） */}
        <div className="tonmana-selected-group">
          {selectedCategories.map((catId, index) => (
            <span key={catId} className="tonmana-selected-item">
              {index > 0 && <span className="tonmana-selected-divider" />}
              <span className="tonmana-selected-label">{getCategoryLabel(catId)}</span>
            </span>
          ))}
        </div>
        
        {/* サブカテゴリ（ダークピル） */}
        {availableSubcategories.map(catId => (
          <button
            key={catId}
            className="tonmana-chip-dark"
            onClick={() => onCategoryAdd(catId)}
            type="button"
          >
            {getCategoryLabel(catId)}
          </button>
        ))}
      </div>
    </div>
  )
}
