import type { PictoElementType, PictoFlowType } from '../types'

/**
 * エレメントタイプの設定
 */
export interface PictoElementConfig {
  type: PictoElementType
  name: string
  nameJa: string
  icon: string  // Material Icons name
  defaultColor: string
  defaultSize: { width: number; height: number }
}

export const PICTO_ELEMENT_CONFIGS: Record<PictoElementType, PictoElementConfig> = {
  person: {
    type: 'person',
    name: 'Person',
    nameJa: 'ヒト',
    icon: 'person',
    defaultColor: '#666666',
    defaultSize: { width: 60, height: 80 }
  },
  company: {
    type: 'company',
    name: 'Company',
    nameJa: '会社',
    icon: 'business',
    defaultColor: '#666666',
    defaultSize: { width: 60, height: 80 }
  },
  money: {
    type: 'money',
    name: 'Money',
    nameJa: 'カネ',
    icon: 'payments',
    defaultColor: '#FFC107',
    defaultSize: { width: 50, height: 50 }
  },
  product: {
    type: 'product',
    name: 'Product',
    nameJa: 'モノ',
    icon: 'category',
    defaultColor: '#4CAF50',
    defaultSize: { width: 50, height: 50 }
  },
  info: {
    type: 'info',
    name: 'Information',
    nameJa: '情報',
    icon: 'description',
    defaultColor: '#2196F3',
    defaultSize: { width: 50, height: 50 }
  },
  smartphone: {
    type: 'smartphone',
    name: 'Smartphone',
    nameJa: 'スマホ',
    icon: 'smartphone',
    defaultColor: '#666666',
    defaultSize: { width: 40, height: 70 }
  },
  store: {
    type: 'store',
    name: 'Store',
    nameJa: '店舗',
    icon: 'storefront',
    defaultColor: '#666666',
    defaultSize: { width: 70, height: 70 }
  },
  other: {
    type: 'other',
    name: 'Other',
    nameJa: 'その他',
    icon: 'crop_square',
    defaultColor: '#999999',
    defaultSize: { width: 50, height: 50 }
  }
}

/**
 * フロータイプの設定
 */
export interface PictoFlowConfig {
  type: PictoFlowType
  name: string
  nameJa: string
  color: string
  strokeWidth: number
}

export const PICTO_FLOW_CONFIGS: Record<PictoFlowType, PictoFlowConfig> = {
  product: {
    type: 'product',
    name: 'Product Flow',
    nameJa: 'モノの流れ',
    color: '#4CAF50',
    strokeWidth: 2
  },
  money: {
    type: 'money',
    name: 'Money Flow',
    nameJa: 'カネの流れ',
    color: '#FFC107',
    strokeWidth: 2
  },
  info: {
    type: 'info',
    name: 'Information Flow',
    nameJa: '情報の流れ',
    color: '#2196F3',
    strokeWidth: 2
  },
  relation: {
    type: 'relation',
    name: 'Relation',
    nameJa: '関係性',
    color: '#9E9E9E',
    strokeWidth: 1.5
  }
}

/**
 * デフォルトのキャンバスサイズ
 */
export const DEFAULT_CANVAS_SIZE = {
  width: 800,
  height: 600
}

/**
 * グリッドサイズ（スナップ用）
 */
export const GRID_SIZE = 20

/**
 * デフォルトのグループ色
 */
export const DEFAULT_GROUP_COLOR = '#E91E63'

/**
 * エレメントのZ-index順序
 */
export const Z_INDEX = {
  GRID: 0,
  GROUP: 10,
  CONNECTOR: 20,
  ELEMENT: 30,
  COMMENT: 40,
  DRAG_PREVIEW: 100
}
