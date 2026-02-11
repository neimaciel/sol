/**
 * Validated Form Hook
 * Combines react-hook-form + Zod validation + input sanitization
 *
 * Usage:
 * ```typescript
 * import { useValidatedForm } from '@/hooks/useValidatedForm'
 * import { loadSchema } from '@/lib/schemas'
 *
 * function MyForm() {
 *   const { register, handleSubmit, errors, isSubmitting } = useValidatedForm({
 *     schema: loadSchema,
 *     onSubmit: async (data) => {
 *       await createLoad(data)
 *     }
 *   })
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input {...register('title')} />
 *       {errors.title && <span>{errors.title.message}</span>}
 *
 *       <button type="submit" disabled={isSubmitting}>
 *         Submit
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */

import { useForm } from 'react-hook-form'
import type { UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sanitizeObject } from '@/lib/sanitize'
import { toast } from '@/lib/toast'

interface UseValidatedFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => Promise<void> | void
  onError?: (errors: any) => void
  sanitize?: boolean // Default: true
  showToastOnError?: boolean // Default: true
}

interface UseValidatedFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  errors: UseFormReturn<T>['formState']['errors']
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
}

export function useValidatedForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onError,
  sanitize = true,
  showToastOnError = true,
}: UseValidatedFormOptions<T>): UseValidatedFormReturn<T> {
  const form = useForm<T>({
    resolver: zodResolver(schema as any), // Type workaround for Zod + RHF compatibility
    defaultValues,
    mode: 'onBlur', // Validate on blur for better UX
  })

  const { formState, handleSubmit: rhfHandleSubmit } = form
  const { errors, isSubmitting, isDirty, isValid } = formState

  const wrappedHandleSubmit = (e?: React.BaseSyntheticEvent) => {
    return rhfHandleSubmit(
      async (data) => {
        try {
          // Sanitize data if enabled
          const cleanData = sanitize ? sanitizeObject(data) : data

          // Call onSubmit with sanitized data
          await onSubmit(cleanData as T)
        } catch (error) {
          console.error('Form submission error:', error)

          if (showToastOnError) {
            const message = error instanceof Error ? error.message : 'Erro ao enviar formulário'
            toast.error(message)
          }

          // Call custom error handler if provided
          if (onError) {
            onError(error)
          }
        }
      },
      (errors) => {
        console.error('Form validation errors:', errors)

        if (showToastOnError) {
          // Show first error message
          const firstError = Object.values(errors)[0]
          if (firstError?.message) {
            toast.error(String(firstError.message))
          } else {
            toast.error('Verifique os campos do formulário')
          }
        }

        // Call custom error handler if provided
        if (onError) {
          onError(errors)
        }
      }
    )(e)
  }

  return {
    ...form,
    handleSubmit: wrappedHandleSubmit as any, // Type workaround
    errors,
    isSubmitting,
    isDirty,
    isValid,
  }
}

/**
 * Helper to get error message from field
 */
export function getFieldError(errors: any, fieldName: string): string | undefined {
  const error = errors[fieldName]
  return error?.message as string | undefined
}

/**
 * Helper to check if field has error
 */
export function hasFieldError(errors: any, fieldName: string): boolean {
  return !!errors[fieldName]
}

/**
 * Example schemas for common forms
 */

// Load/Card form schema
export const loadFormSchema = z.object({
  title: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(255, 'Título deve ter no máximo 255 caracteres'),

  origin_city: z.string()
    .min(1, 'Cidade de origem é obrigatória')
    .max(100),

  origin_state: z.string()
    .length(2, 'Estado deve ter 2 letras')
    .regex(/^[A-Z]{2}$/, 'Estado inválido'),

  destination_city: z.string()
    .min(1, 'Cidade de destino é obrigatória')
    .max(100),

  destination_state: z.string()
    .length(2, 'Estado deve ter 2 letras')
    .regex(/^[A-Z]{2}$/, 'Estado inválido'),

  cargo_type: z.string()
    .min(1, 'Tipo de carga é obrigatório')
    .max(100),

  weight: z.number()
    .positive('Peso deve ser positivo')
    .optional(),

  price: z.number()
    .positive('Valor deve ser positivo')
    .optional(),

  notes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
})

// Driver form schema
export const driverFormSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255),

  phone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone inválido (10 ou 11 dígitos)'),

  cpf_cnpj: z.string()
    .regex(/^\d{11}$|^\d{14}$/, 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos'),

  vehicle_type: z.string()
    .min(1, 'Tipo de veículo é obrigatório'),

  vehicle_plate: z.string()
    .regex(/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/, 'Placa inválida (ABC1234 ou ABC1D23)'),

  email: z.string()
    .email('Email inválido')
    .optional(),
})

// Group form schema
export const groupFormSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255),

  whatsapp_id: z.string()
    .regex(/^\d{10,20}(@g\.us)?$/, 'ID de grupo inválido'),

  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
})

// Payment form schema
export const paymentFormSchema = z.object({
  amount: z.number()
    .positive('Valor deve ser positivo'),

  payment_method: z.enum(['pix', 'transferencia', 'boleto', 'dinheiro', 'cartao'], {
    message: 'Método de pagamento inválido'
  }),

  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)')
    .optional(),

  notes: z.string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
})
