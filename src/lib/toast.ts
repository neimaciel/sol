/**
 * Simple Toast Notification System
 * Lightweight alternative to external libraries
 *
 * Usage:
 * import { toast } from '@/lib/toast'
 *
 * toast.success('Operação realizada com sucesso!')
 * toast.error('Erro ao processar')
 * toast.warning('Atenção: verifique os dados')
 * toast.info('Informação importante')
 */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  duration?: number
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
}

const DEFAULT_DURATION = 3000
const DEFAULT_POSITION = 'top-right'

let toastContainer: HTMLElement | null = null
let toastCounter = 0

function getOrCreateContainer(position: string): HTMLElement {
  if (!toastContainer || toastContainer.dataset.position !== position) {
    // Remove old container if position changed
    if (toastContainer) {
      toastContainer.remove()
    }

    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.dataset.position = position

    // Position styles
    const positionStyles: Record<string, string> = {
      'top-right': 'top: 1rem; right: 1rem;',
      'top-center': 'top: 1rem; left: 50%; transform: translateX(-50%);',
      'bottom-right': 'bottom: 1rem; right: 1rem;',
      'bottom-center': 'bottom: 1rem; left: 50%; transform: translateX(-50%);'
    }

    toastContainer.style.cssText = `
      position: fixed;
      ${positionStyles[position] || positionStyles['top-right']}
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `

    document.body.appendChild(toastContainer)
  }

  return toastContainer
}

function showToast(message: string, type: ToastType, options: ToastOptions = {}) {
  const duration = options.duration || DEFAULT_DURATION
  const position = options.position || DEFAULT_POSITION

  const container = getOrCreateContainer(position)
  const id = `toast-${toastCounter++}`

  // Create toast element
  const toast = document.createElement('div')
  toast.id = id
  toast.style.cssText = `
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 24rem;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `

  // Type-specific styles and icons
  const typeConfig = {
    success: {
      bg: '#10b981',
      color: '#ffffff',
      icon: '✓'
    },
    error: {
      bg: '#ef4444',
      color: '#ffffff',
      icon: '✕'
    },
    warning: {
      bg: '#f59e0b',
      color: '#ffffff',
      icon: '⚠'
    },
    info: {
      bg: '#3b82f6',
      color: '#ffffff',
      icon: 'ℹ'
    }
  }

  const config = typeConfig[type]
  toast.style.backgroundColor = config.bg
  toast.style.color = config.color

  // Add icon and message
  const iconSpan = document.createElement('span')
  iconSpan.textContent = config.icon
  iconSpan.style.cssText = `
    font-size: 1.25rem;
    font-weight: bold;
    flex-shrink: 0;
  `

  const messageSpan = document.createElement('span')
  messageSpan.textContent = message
  messageSpan.style.cssText = 'flex: 1;'

  toast.appendChild(iconSpan)
  toast.appendChild(messageSpan)

  // Add animation keyframes if not exists
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style')
    style.id = 'toast-animations'
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `
    document.head.appendChild(style)
  }

  container.appendChild(toast)

  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => {
      toast.remove()
      // Clean up container if empty
      if (container.children.length === 0) {
        container.remove()
        toastContainer = null
      }
    }, 300)
  }, duration)

  // Allow manual dismissal on click
  toast.addEventListener('click', () => {
    toast.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => toast.remove(), 300)
  })
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    showToast(message, 'success', options)
  },

  error: (message: string, options?: ToastOptions) => {
    showToast(message, 'error', options)
  },

  warning: (message: string, options?: ToastOptions) => {
    showToast(message, 'warning', options)
  },

  info: (message: string, options?: ToastOptions) => {
    showToast(message, 'info', options)
  }
}
