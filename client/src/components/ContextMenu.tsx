import React, { useEffect, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onClose: () => void
  onAdd?: () => void
  onEdit?: () => void
  onDelete?: () => void
  target?: 'node' | 'canvas'
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  visible,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  target = 'node'
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onClose])

  if (!visible) return null

  const menuItems = target === 'node' ? [
    { label: '编辑知识点', icon: PencilIcon, onClick: onEdit, color: 'text-blue-600' },
    { label: '删除知识点', icon: TrashIcon, onClick: onDelete, color: 'text-red-600' },
  ] : [
    { label: '添加知识点', icon: PlusIcon, onClick: onAdd, color: 'text-green-600' },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px]"
      style={{
        left: x,
        top: y,
        transform: 'translate(0, 0)'
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 ${item.color}`}
          onClick={() => {
            item.onClick?.()
            onClose()
          }}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ContextMenu