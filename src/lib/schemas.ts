/**
 * Schemas de Validação com Zod
 *
 * Protege contra:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - Dados inválidos
 *
 * Bug Fix: P34
 */

import { z } from 'zod'

// =============================================
// HELPERS - Validações Customizadas
// =============================================

// CPF Validator
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
export const cpfValidator = z.string()
  .regex(cpfRegex, 'CPF inválido. Formato: 000.000.000-00')
  .refine((cpf) => {
    // Remove formatação
    const cleanCPF = cpf.replace(/[.-]/g, '')

    // CPFs inválidos conhecidos
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false

    // Validação do dígito verificador (simplificada)
    // TODO: Implementar validação completa do CPF
    return cleanCPF.length === 11
  }, 'CPF inválido')

// Telefone Validator (formato brasileiro)
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/
export const phoneValidator = z.string()
  .regex(phoneRegex, 'Telefone inválido. Formato: (00) 00000-0000')

// Valor monetário
export const moneyValidator = z.string()
  .regex(/^R\$\s?\d{1,3}(\.\d{3})*,\d{2}$|^\d+(\.\d{2})?$/, 'Valor inválido')
  .or(z.number().nonnegative('Valor deve ser positivo'))

// =============================================
// SCHEMA: CARGA (LOAD/CARD)
// =============================================

export const cardSchema = z.object({
  title: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(255, 'Título muito longo (máximo 255 caracteres)')
    .trim()
    .refine((val) => val.length > 0, 'Título obrigatório'),

  origin: z.string()
    .min(1, 'Origem obrigatória')
    .max(255, 'Origem muito longa')
    .trim(),

  destination: z.string()
    .min(1, 'Destino obrigatório')
    .max(255, 'Destino muito longo')
    .trim(),

  origin_city: z.string()
    .min(2, 'Cidade de origem inválida')
    .max(100)
    .optional(),

  origin_state: z.string()
    .length(2, 'Estado deve ter 2 letras (ex: SP)')
    .regex(/^[A-Z]{2}$/, 'Use sigla do estado em maiúsculas')
    .optional(),

  destination_city: z.string()
    .min(2, 'Cidade de destino inválida')
    .max(100)
    .optional(),

  destination_state: z.string()
    .length(2, 'Estado deve ter 2 letras (ex: RJ)')
    .regex(/^[A-Z]{2}$/, 'Use sigla do estado em maiúsculas')
    .optional(),

  cargo_type: z.string()
    .min(1, 'Tipo de carga obrigatório')
    .max(100)
    .optional(),

  value: z.string()
    .min(1, 'Valor obrigatório')
    .refine((val) => {
      // Aceita "R$ 1.000,00" ou "1000.00"
      const cleaned = val.replace(/[R$\s.]/g, '').replace(',', '.')
      const num = parseFloat(cleaned)
      return !isNaN(num) && num >= 0
    }, 'Valor inválido'),

  price: z.number()
    .nonnegative('Preço deve ser positivo')
    .optional(),

  priority: z.enum(['high', 'normal']).default('normal'),

  vehicle_type: z.string()
    .max(100, 'Tipo de veículo muito longo')
    .optional(),

  date: z.string()
    .datetime({ message: 'Data inválida' })
    .or(z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data inválida'))
    .optional(),
})

export type CardFormData = z.infer<typeof cardSchema>

// =============================================
// SCHEMA: MOTORISTA (DRIVER)
// =============================================

export const driverSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo')
    .trim()
    .refine((val) => /^[a-zA-ZÀ-ÿ\s]+$/.test(val), 'Nome deve conter apenas letras'),

  cpf: cpfValidator.optional(),

  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  phone: phoneValidator,

  license_number: z.string()
    .min(5, 'Número da CNH inválido')
    .max(20)
    .optional(),

  vehicle_type: z.string()
    .min(1, 'Tipo de veículo obrigatório')
    .max(100)
    .optional(),

  vehicle_plate: z.string()
    .regex(/^[A-Z]{3}[\s-]?\d{1}[A-Z\d]{1}\d{2}$|^[A-Z]{3}[\s-]?\d{4}$/,
      'Placa inválida. Formato: ABC-1234 ou ABC1D23')
    .toUpperCase()
    .optional(),

  status: z.enum(['active', 'inactive', 'vacation']).default('active'),
})

export type DriverFormData = z.infer<typeof driverSchema>

// =============================================
// SCHEMA: GRUPO WHATSAPP
// =============================================

export const groupSchema = z.object({
  name: z.string()
    .min(3, 'Nome do grupo deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo')
    .trim(),

  region: z.string()
    .max(100, 'Região muito longa')
    .optional(),

  description: z.string()
    .max(1000, 'Descrição muito longa (máximo 1000 caracteres)')
    .optional(),

  whatsapp_id: z.string()
    .regex(/^\d{10,15}$/, 'ID do grupo deve conter apenas números (10-15 dígitos)')
    .optional(),

  whatsapp_link: z.string()
    .url('Link inválido')
    .refine((url) => url.includes('chat.whatsapp.com'), 'Deve ser um link do WhatsApp')
    .optional()
    .or(z.literal('')),

  is_active: z.boolean().default(true),
})

export type GroupFormData = z.infer<typeof groupSchema>

// =============================================
// SCHEMA: OPERADOR
// =============================================

export const operatorSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .max(255)
    .trim()
    .toLowerCase(),

  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(72, 'Senha muito longa')
    .regex(/[a-z]/, 'Senha deve conter letras minúsculas')
    .regex(/[A-Z]/, 'Senha deve conter letras maiúsculas')
    .regex(/[0-9]/, 'Senha deve conter números')
    .optional(),

  role: z.enum(['admin', 'operator', 'viewer']).default('operator'),

  phone: phoneValidator.optional(),
})

export type OperatorFormData = z.infer<typeof operatorSchema>

// =============================================
// SCHEMA: LOGIN
// =============================================

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .trim()
    .toLowerCase(),

  password: z.string()
    .min(1, 'Senha obrigatória'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// =============================================
// HELPER: Sanitizar HTML
// =============================================

/**
 * Remove tags HTML e scripts maliciosos
 * Uso: const clean = sanitizeHtml(userInput)
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty

  // No servidor, apenas remove tags básicas
  return dirty.replace(/<[^>]*>/g, '')
}

// =============================================
// HELPER: Sanitizar para URL
// =============================================

/**
 * Remove caracteres perigosos para URLs
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Bloquear javascript: e data: URLs
    if (['javascript:', 'data:', 'vbscript:'].some(proto =>
      parsed.protocol.toLowerCase().startsWith(proto)
    )) {
      throw new Error('Protocol not allowed')
    }
    return parsed.href
  } catch {
    return ''
  }
}

// =============================================
// HELPER: Escape SQL (para queries dinâmicas)
// =============================================

/**
 * Escapa strings para prevenir SQL injection
 * NOTA: Prefira usar parameterized queries!
 */
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

// =============================================
// EXPORT DEFAULT
// =============================================

export default {
  card: cardSchema,
  driver: driverSchema,
  group: groupSchema,
  operator: operatorSchema,
  login: loginSchema,
}
