import { useState, useEffect } from 'react'
import type { Item, ItemType, PictoItem, EulerItem } from '../../types'
import { DEFAULT_CANVAS_SIZE } from '../../constants/pictoConfigs'
import { DEFAULT_EULER_CANVAS_SIZE } from '../../constants/eulerConfigs'
import { EulerIcon } from '../euler/EulerIcon'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<Item>) => void
  editingItem?: Item | null
  existingNames: string[]
}

export const ItemModal = ({ isOpen, onClose, onSave, editingItem, existingNames }: ItemModalProps) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<ItemType>('text')
  const [nameError, setNameError] = useState('')

  // Initialize form when editing (name only for editing mode)
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setType(editingItem.type)
    } else {
      resetForm()
    }
  }, [editingItem, isOpen])

  const resetForm = () => {
    setName('')
    setType('text')
    setNameError('')
  }

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError('Name is required')
      return false
    }
    const isDuplicate = existingNames.some(
      n => n === value && (!editingItem || editingItem.name !== value)
    )
    if (isDuplicate) {
      setNameError('Name already exists')
      return false
    }
    setNameError('')
    return true
  }

  const handleNameChange = (value: string) => {
    setName(value)
    validateName(value)
  }

  const handleSave = () => {
    if (!validateName(name)) return

    const baseItem: Partial<Item> = {
      id: editingItem?.id,
      name: name.trim(),
      type
    }

    // For new items, just pass basic info with default empty content
    // Actual content editing will be done after creation
    let itemData: Partial<Item>
    switch (type) {
      case 'table':
        itemData = {
          ...baseItem,
          data: [['', ''], ['', '']],  // Default empty table
          headers: undefined
        }
        break
      case 'image':
        itemData = {
          ...baseItem,
          dataUrl: '',
          alt: ''
        }
        break
      case 'text':
        itemData = {
          ...baseItem,
          content: ''
        }
        break
      case 'picto':
        itemData = {
          ...baseItem,
          elements: [],
          connectors: [],
          groups: [],
          comments: [],
          canvasSize: DEFAULT_CANVAS_SIZE
        } as Partial<PictoItem>
        break
      case 'euler':
        itemData = {
          ...baseItem,
          circles: [],
          elements: [],
          canvasSize: DEFAULT_EULER_CANVAS_SIZE
        } as Partial<EulerItem>
        break
      default:
        return
    }

    onSave(itemData)
    onClose()
    resetForm()
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingItem ? 'Edit Item' : 'Create New Item'}</h2>
          <button className="modal-close-button" onClick={handleClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Name Input */}
          <div className="item-modal-field">
            <label htmlFor="item-name">Name *</label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter item name"
              className={nameError ? 'error' : ''}
            />
            {nameError && <div className="item-modal-error">{nameError}</div>}
          </div>

          {/* Type Selection (only when creating) */}
          {!editingItem && (
            <div className="item-modal-field">
              <label>Type *</label>
              <div className="item-type-selector">
                <button
                  className={`item-type-button ${type === 'text' ? 'active' : ''}`}
                  onClick={() => setType('text')}
                >
                  <span className="material-icons">notes</span>
                  Text
                </button>
                <button
                  className={`item-type-button ${type === 'table' ? 'active' : ''}`}
                  onClick={() => setType('table')}
                >
                  <span className="material-icons">table_chart</span>
                  Table
                </button>
                <button
                  className={`item-type-button ${type === 'image' ? 'active' : ''}`}
                  onClick={() => setType('image')}
                >
                  <span className="material-icons">image</span>
                  Image
                </button>
                <button
                  className={`item-type-button ${type === 'picto' ? 'active' : ''}`}
                  onClick={() => setType('picto')}
                >
                  <span className="material-icons">schema</span>
                  Pictogram
                </button>
                <button
                  className={`item-type-button ${type === 'euler' ? 'active' : ''}`}
                  onClick={() => setType('euler')}
                >
                  <EulerIcon size={24} />
                  Euler
                </button>
              </div>
              <p className="item-modal-hint">
                <span className="material-icons">info</span>
                実際の編集は追加後に行います
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleClose} className="modal-button secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="modal-button primary">
            {editingItem ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

