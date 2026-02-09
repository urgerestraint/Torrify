import { useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'

/**
 * Props for the ConfirmDialog component.
 */
interface ConfirmDialogProps {
  /** Indicates if the dialog is visible */
  readonly isOpen: boolean
  /** The title text displayed at the top of the dialog */
  readonly title: string
  /** The descriptive message content */
  readonly message: string
  /** Label for the primary action button (defaults to 'OK') */
  readonly confirmLabel?: string
  /** Label for the secondary/dismiss button (defaults to 'Cancel') */
  readonly cancelLabel?: string
  /** If true, the secondary button is displayed */
  readonly showCancel?: boolean
  /** Triggered when the primary button is clicked */
  readonly onConfirm: () => void
  /** Triggered when the secondary button or backdrop is clicked */
  readonly onCancel?: () => void
}

/**
 * A modal dialog for critical confirmations or simple alerts.
 * Implements accessible focus management, backdrop clicking, and keyboard navigation.
 */
function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  showCancel = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Manage accessibility and focus lifecycle
  useEffect(() => {
    if (!isOpen) return
    
    // Store original focus to restore on close
    previousFocusRef.current = document.activeElement as HTMLElement
    
    // Defer focus to allow rendering to complete
    window.setTimeout(() => confirmButtonRef.current?.focus(), 0)

    return () => {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  /**
   * Handles keyboard interaction including focus trapping and Escape key closing.
   */
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // 1. Dismiss logic
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (showCancel && onCancel) {
        onCancel()
      } else {
        onConfirm()
      }
      return
    }

    // 2. Focus trapping (Tab cycling)
    if (event.key !== 'Tab') return
    
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  /**
   * Closes the dialog if the user clicks the dim backdrop.
   */
  const handleBackdropMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (showCancel && onCancel) {
      onCancel()
    } else {
      onConfirm()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        className="bg-[#2d2d30] rounded-lg shadow-xl w-[420px] max-w-[90vw] p-6 space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onKeyDown={handleKeyDown}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="text-sm text-gray-300 whitespace-pre-line">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          {showCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] rounded font-medium transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
