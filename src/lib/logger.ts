/**
 * Conditional Logger - Only logs in development mode
 *
 * Usage:
 * import { logger } from '@/lib/logger'
 *
 * logger.log('Debug message')
 * logger.error('Error message')
 * logger.warn('Warning message')
 * logger.info('Info message')
 */

const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  // Always log errors in production too (to error tracking service)
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args)
    // TODO: Send to error tracking service (Sentry, etc.)
  }
}

// Helper to check if in development mode
export const isDev = isDevelopment
