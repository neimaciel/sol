/**
 * Form Validation Utilities
 * Provides reusable validation functions for forms across the application
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface ValidationRule {
  field: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

/**
 * Validate a single field value against rules
 */
export function validateField(value: any, rules: Omit<ValidationRule, 'field'>): string | null {
  // Required check
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return rules.message || 'Este campo é obrigatório'
  }

  // If not required and empty, skip other validations
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }

  // String validations
  if (typeof value === 'string') {
    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return `Mínimo de ${rules.minLength} caracteres`
    }

    // Max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Máximo de ${rules.maxLength} caracteres`
    }

    // Pattern matching
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Formato inválido'
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

/**
 * Validate an object against multiple rules
 */
export function validateForm(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {}

  for (const rule of rules) {
    const value = data[rule.field]
    const error = validateField(value, rule)

    if (error) {
      errors[rule.field] = error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s()+-]{10,}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  cpfCnpj: /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/,
  vehiclePlate: /^[A-Z]{3}-?\d{4}$/,
  cep: /^\d{5}-?\d{3}$/,
  url: /^https?:\/\/.+/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d{1,2})?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/
}

/**
 * Validate email
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email é obrigatório'
  }
  if (!ValidationPatterns.email.test(email)) {
    return 'Email inválido'
  }
  return null
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'Telefone é obrigatório'
  }
  if (!ValidationPatterns.phone.test(phone)) {
    return 'Telefone inválido'
  }
  return null
}

/**
 * Validate CPF
 */
export function validateCPF(cpf: string): string | null {
  if (!cpf || cpf.trim() === '') {
    return null // Optional field
  }

  // Remove formatting
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  if (cleanCPF.length !== 11) {
    return 'CPF deve ter 11 dígitos'
  }

  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return 'CPF inválido'
  }

  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) {
    return 'CPF inválido'
  }

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) {
    return 'CPF inválido'
  }

  return null
}

/**
 * Validate CNPJ
 */
export function validateCNPJ(cnpj: string): string | null {
  if (!cnpj || cnpj.trim() === '') {
    return null // Optional field
  }

  // Remove formatting
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')

  if (cleanCNPJ.length !== 14) {
    return 'CNPJ deve ter 14 dígitos'
  }

  // Check if all digits are the same
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return 'CNPJ inválido'
  }

  // Validate check digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (checkDigit !== parseInt(cleanCNPJ.charAt(12))) {
    return 'CNPJ inválido'
  }

  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (checkDigit !== parseInt(cleanCNPJ.charAt(13))) {
    return 'CNPJ inválido'
  }

  return null
}

/**
 * Validate CPF or CNPJ
 */
export function validateCPForCNPJ(value: string): string | null {
  if (!value || value.trim() === '') {
    return null // Optional field
  }

  const clean = value.replace(/[^\d]/g, '')

  if (clean.length === 11) {
    return validateCPF(value)
  } else if (clean.length === 14) {
    return validateCNPJ(value)
  } else {
    return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
  }
}

/**
 * Validate vehicle plate (Brazilian format)
 */
export function validateVehiclePlate(plate: string): string | null {
  if (!plate || plate.trim() === '') {
    return null // Optional field
  }
  if (!ValidationPatterns.vehiclePlate.test(plate.toUpperCase())) {
    return 'Placa inválida (formato: ABC-1234)'
  }
  return null
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'Campo'): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} é obrigatório`
  }
  return null
}

/**
 * Validate number (positive)
 */
export function validatePositiveNumber(value: any): string | null {
  if (!value) {
    return null // Optional field
  }

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return 'Deve ser um número válido'
  }

  if (num <= 0) {
    return 'Deve ser um número positivo'
  }

  return null
}

/**
 * Validate date (not in the past)
 */
export function validateFutureDate(value: string): string | null {
  if (!value || value.trim() === '') {
    return null // Optional field
  }

  const inputDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (inputDate < today) {
    return 'Data não pode ser no passado'
  }

  return null
}

/**
 * Show validation errors in the UI
 */
export function showValidationErrors(errors: Record<string, string>) {
  Object.entries(errors).forEach(([field, message]) => {
    const element = document.querySelector(`[name="${field}"]`)
    if (element) {
      element.classList.add('error')
      const errorDiv = document.createElement('div')
      errorDiv.className = 'error-message'
      errorDiv.textContent = message
      element.parentElement?.appendChild(errorDiv)
    }
  })
}

/**
 * Clear validation errors
 */
export function clearValidationErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'))
  document.querySelectorAll('.error-message').forEach(el => el.remove())
}

/**
 * SANITIZAÇÃO - Proteção contra XSS e SQL Injection
 * Bug Fix: P34
 */

/**
 * Remove tags HTML e scripts maliciosos
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''

  // Remove tags HTML perigosas
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+='[^']*'/gi, '')
}

/**
 * Sanitiza texto removendo todos os caracteres HTML
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '').trim()
}

/**
 * Sanitiza URL para prevenir javascript: e data: attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:']

    if (dangerous.some(proto => parsed.protocol.toLowerCase().startsWith(proto))) {
      return ''
    }

    return parsed.href
  } catch {
    return ''
  }
}

/**
 * Escapa SQL para queries dinâmicas
 * NOTA: Prefira usar parameterized queries!
 */
export function escapeSql(value: string): string {
  if (!value) return ''
  return value.replace(/'/g, "''").replace(/\\/g, '\\\\')
}

/**
 * Sanitiza input geral para formulários
 */
export function sanitizeInput(input: string, options: {
  maxLength?: number
  allowHtml?: boolean
  trim?: boolean
} = {}): string {
  if (!input) return ''

  let result = input

  // Trim por padrão
  if (options.trim !== false) {
    result = result.trim()
  }

  // Remove HTML se não permitido
  if (!options.allowHtml) {
    result = sanitizeText(result)
  }

  // Limita tamanho
  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength)
  }

  return result
}
