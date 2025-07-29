import React, { useState } from 'react'

interface DisclosureProps {
  title: string
  children: React.ReactNode
  badge?: React.ReactNode
  className?: string
  defaultOpen?: boolean
  onAddClick?: () => void
  showAddButton?: boolean
  [key: string]: React.ReactNode | string | boolean | undefined | (() => void) // Allow additional props like data-* attributes
}

export default function Disclosure({
  title,
  children,
  badge,
  className = '',
  defaultOpen = true,
  onAddClick,
  showAddButton = false,
  ...props
}: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the disclosure toggle
    if (onAddClick) {
      onAddClick()
    }
  }

  return (
    <div className={`disclosure ${className}`} {...props}>
      <button
        className="disclosure-trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`disclosure-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="disclosure-title">{title}</span>
        {badge !== undefined && <span className="disclosure-badge">{badge}</span>}
        <div className="disclosure-actions">
          {showAddButton && (
            <button
              className="disclosure-add-btn"
              onClick={handleAddClick}
              aria-label={`Add task to ${title}`}
              title={`Add task to ${title}`}
            >
              +
            </button>
          )}
          <span className="disclosure-icon">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>
      <div
        id={`disclosure-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`disclosure-content ${isOpen ? 'disclosure-open' : 'disclosure-closed'}`}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  )
}
