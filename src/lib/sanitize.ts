/**
 * Sanitization and Validation Utilities
 * Protects against XSS, injection attacks, and invalid data
 */

import DOMPurify from 'dompurify'
import validator from 'validator'

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all dangerous tags and attributes
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove ALL HTML tags
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize text input - escapes HTML entities
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return validator.escape(input.trim())
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  return validator.isEmail(trimmed) ? trimmed : null
}

/**
 * Sanitize phone number - removes non-numeric characters
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/\D/g, '')
}

/**
 * Sanitize URL - validates and normalizes
 */
export function sanitizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()

  if (!validator.isURL(trimmed, { require_protocol: false })) {
    return null
  }

  // Add protocol if missing
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }

  return trimmed
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? null : input
  }

  if (!input || typeof input !== 'string') return null

  const num = parseFloat(input.replace(/[^\d.-]/g, ''))
  return isNaN(num) || !isFinite(num) ? null : num
}

/**
 * Sanitize CPF/CNPJ - removes formatting, keeps only digits
 */
export function sanitizeCPF_CNPJ(input: string): string {
  if (!input || typeof input !== 'string') return ''
  const digits = input.replace(/\D/g, '')

  // Validate length (CPF = 11, CNPJ = 14)
  if (digits.length !== 11 && digits.length !== 14) {
    return ''
  }

  return digits
}

/**
 * Sanitize vehicle plate (Brazilian format)
 */
export function sanitizePlate(plate: string): string {
  if (!plate || typeof plate !== 'string') return ''

  // Remove special characters and convert to uppercase
  const clean = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase()

  // Validate format: ABC1234 or ABC1D23 (Mercosul)
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/
  const newFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/

  if (!oldFormat.test(clean) && !newFormat.test(clean)) {
    return ''
  }

  return clean
}

/**
 * Sanitize object - recursively sanitizes all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    allowHTML?: boolean
    trimStrings?: boolean
  } = {}
): T {
  const { allowHTML = false, trimStrings = true } = options

  const sanitized = { ...obj }

  for (const key in sanitized) {
    const value = sanitized[key]

    if (typeof value === 'string') {
      let clean = trimStrings ? value.trim() : value
      if (!allowHTML) {
        clean = sanitizeHTML(clean)
      }
      sanitized[key] = clean as any
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) =>
        typeof item === 'string'
          ? (allowHTML ? item : sanitizeHTML(item))
          : item && typeof item === 'object'
          ? sanitizeObject(item, options)
          : item
      ) as any
    }
  }

  return sanitized
}

/**
 * Validate string length
 */
export function validateLength(
  input: string,
  min: number,
  max: number
): boolean {
  if (!input || typeof input !== 'string') return false
  return validator.isLength(input, { min, max })
}

/**
 * Sanitize file path - prevent path traversal
 */
export function sanitizeFilePath(path: string): string | null {
  if (!path || typeof path !== 'string') return null

  // Remove path traversal attempts
  const clean = path.replace(/\.\./g, '').replace(/^\/+/, '')

  // Check for suspicious patterns
  if (clean.includes('../') || clean.includes('..\\')) {
    return null
  }

  return clean
}

/**
 * Comprehensive form data sanitizer
 * Use this for all form submissions
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema?: {
    [K in keyof T]?: 'html' | 'text' | 'email' | 'phone' | 'url' | 'number' | 'cpf_cnpj' | 'plate'
  }
): Partial<T> {
  const result: Partial<T> = {}

  for (const key in data) {
    const value = data[key]
    const type = schema?.[key]

    if (value === null || value === undefined) {
      result[key] = value
      continue
    }

    if (typeof value !== 'string') {
      result[key] = value
      continue
    }

    switch (type) {
      case 'html':
        result[key] = sanitizeHTML(value) as any
        break
      case 'email':
        result[key] = (sanitizeEmail(value) ?? '') as any
        break
      case 'phone':
        result[key] = sanitizePhone(value) as any
        break
      case 'url':
        result[key] = (sanitizeURL(value) ?? '') as any
        break
      case 'number':
        result[key] = sanitizeNumber(value) as any
        break
      case 'cpf_cnpj':
        result[key] = sanitizeCPF_CNPJ(value) as any
        break
      case 'plate':
        result[key] = sanitizePlate(value) as any
        break
      case 'text':
      default:
        result[key] = sanitizeText(value) as any
        break
    }
  }

  return result
}
