import type { Item } from '../types'

interface ItemsData {
  version: string
  items: Item[]
}

// Save items to JSON file
export const saveItemsToFile = (items: Item[]): void => {
  const itemsData: ItemsData = {
    version: '1.0',
    items
  }
  
  const dataStr = JSON.stringify(itemsData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = 'items.json'
  link.click()
  
  URL.revokeObjectURL(url)
}

// Load items from JSON file
export const loadItemsFromFile = (): Promise<Item[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as ItemsData
          
          // Validate data structure
          if (!data.version || !Array.isArray(data.items)) {
            reject(new Error('Invalid items file format'))
            return
          }
          
          resolve(data.items)
        } catch (error) {
          reject(new Error('Failed to parse items file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    
    input.click()
  })
}

// Save items to localStorage
export const saveItemsToLocalStorage = (items: Item[]): void => {
  const itemsData: ItemsData = {
    version: '1.0',
    items
  }
  localStorage.setItem('slide-editor-items', JSON.stringify(itemsData))
}

// Load items from localStorage
export const loadItemsFromLocalStorage = (): Item[] => {
  try {
    const data = localStorage.getItem('slide-editor-items')
    if (!data) return []
    
    const itemsData = JSON.parse(data) as ItemsData
    if (!itemsData.version || !Array.isArray(itemsData.items)) return []
    
    return itemsData.items
  } catch {
    return []
  }
}

// Clear items from localStorage
export const clearItemsFromLocalStorage = (): void => {
  localStorage.removeItem('slide-editor-items')
}

// Save editor content to localStorage
export const saveEditorContentToLocalStorage = (content: string): void => {
  localStorage.setItem('slide-editor-content', content)
}

// Load editor content from localStorage
export const loadEditorContentFromLocalStorage = (): string | null => {
  return localStorage.getItem('slide-editor-content')
}

// Save attribute map to localStorage
export const saveAttributeMapToLocalStorage = (attributeMap: Map<number, string | null>): void => {
  const obj: Record<string, string | null> = {}
  attributeMap.forEach((value, key) => {
    obj[key.toString()] = value
  })
  localStorage.setItem('slide-editor-attributes', JSON.stringify(obj))
}

// Load attribute map from localStorage
export const loadAttributeMapFromLocalStorage = (): Map<number, string | null> => {
  try {
    const data = localStorage.getItem('slide-editor-attributes')
    if (!data) return new Map()
    
    const obj = JSON.parse(data) as Record<string, string | null>
    const map = new Map<number, string | null>()
    Object.entries(obj).forEach(([key, value]) => {
      map.set(parseInt(key, 10), value)
    })
    return map
  } catch {
    return new Map()
  }
}

