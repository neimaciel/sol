import { create } from 'zustand'
import { api } from '@/lib/apiClient'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

interface Payment {
    id: string
    load_id: string
    driver_id: string
    amount: number
    currency: string
    status: string
    method: string
    gateway_provider?: string
    created_at: string
    processed_at?: string
    manual_confirmed_by?: string
    manual_confirmed_at?: string
    manual_confirmation_notes?: string
    receipt_url?: string
    bank_data?: {
        bank_name?: string
        bank_agency?: string
        bank_account?: string
        bank_account_type?: string
        pix_key?: string
        pix_key_type?: string
    }
}

interface PaymentMethod {
    id: string
    name: string
    type: string
    gateway_provider?: string
    requires_bank_data: boolean
    supports_instant: boolean
    processing_time: string
}

interface PaymentsState {
    payments: { [loadId: string]: Payment }
    paymentMethods: PaymentMethod[]
    loading: boolean
    error: string | null

    // Actions
    fetchPayment: (loadId: string) => Promise<Payment | null>
    createPayment: (loadId: string, driverId: string, amount: number, method?: string) => Promise<Payment>
    confirmManualPayment: (paymentId: string, notes?: string, receiptUrl?: string) => Promise<Payment>
    fetchPaymentMethods: () => Promise<void>
    updateDriverBankData: (driverId: string, bankData: any) => Promise<void>
    uploadReceipt: (paymentId: string, file: File) => Promise<string>
    clearError: () => void
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
    payments: {},
    paymentMethods: [],
    loading: false,
    error: null,

    fetchPayment: async (loadId: string) => {
        set({ loading: true, error: null })
        try {
            const data = await api.getPayment(loadId)

            if (data.payment) {
                set(state => ({
                    payments: { ...state.payments, [loadId]: data.payment },
                    loading: false
                }))
                return data.payment
            } else {
                set({ loading: false })
                return null
            }
        } catch (error: any) {
            const message = error.message || 'Erro ao buscar pagamento'
            set({ error: message, loading: false })
            logger.error('Erro ao buscar pagamento:', error)
            toast.error(message)
            return null
        }
    },

    createPayment: async (loadId: string, driverId: string, amount: number, method = 'MANUAL') => {
        set({ loading: true, error: null })
        try {
            const result = await api.createPayment({
                load_id: loadId,
                driver_id: driverId,
                amount,
                payment_method: method
            })

            if (!result.success) {
                throw new Error('Erro ao criar pagamento')
            }

            // Buscar o pagamento completo criado
            const payment = await get().fetchPayment(loadId)
            set({ loading: false })

            if (!payment) {
                throw new Error('Pagamento criado mas não foi possível recuperar os dados')
            }

            toast.success('Pagamento criado com sucesso!')
            return payment
        } catch (error: any) {
            const message = error.message || 'Erro ao criar pagamento'
            set({ error: message, loading: false })
            logger.error('Erro ao criar pagamento:', error)
            toast.error(message)
            throw error
        }
    },

    confirmManualPayment: async (paymentId: string, notes?: string, receiptUrl?: string) => {
        set({ loading: true, error: null })
        try {
            const result = await api.confirmManualPayment(paymentId, {
                confirmed_by: 'admin', // TODO: usar ID do usuário logado
                notes,
                receipt_url: receiptUrl
            })

            if (!result.success) {
                throw new Error('Erro ao confirmar pagamento')
            }

            // Atualizar o pagamento no estado
            const currentPayments = get().payments
            const updatedPayments = { ...currentPayments }

            // Encontrar e atualizar o pagamento
            for (const [loadId, payment] of Object.entries(currentPayments)) {
                if (payment.id === paymentId) {
                    updatedPayments[loadId] = {
                        ...payment,
                        status: 'MANUAL_CONFIRMED',
                        manual_confirmed_at: result.confirmed_at,
                        manual_confirmation_notes: notes,
                        receipt_url: receiptUrl || payment.receipt_url,
                        processed_at: result.confirmed_at
                    }
                    break
                }
            }

            set({ payments: updatedPayments, loading: false })
            toast.success('Pagamento confirmado com sucesso!')
            return updatedPayments[Object.keys(updatedPayments).find(loadId =>
                updatedPayments[loadId].id === paymentId
            )!]
        } catch (error: any) {
            const message = error.message || 'Erro ao confirmar pagamento'
            set({ error: message, loading: false })
            logger.error('Erro ao confirmar pagamento:', error)
            toast.error(message)
            throw error
        }
    },

    fetchPaymentMethods: async () => {
        try {
            const data = await api.getPaymentMethods()
            set({ paymentMethods: data.methods || [] })
        } catch (error: any) {
            const message = error.message || 'Erro ao buscar métodos de pagamento'
            set({ error: message })
            logger.error('Erro ao buscar métodos de pagamento:', error)
            toast.error(message)
        }
    },

    updateDriverBankData: async (_driverId: string, _bankData: any) => {
        set({ loading: true, error: null })
        try {
            // TODO: Implement API endpoint for bank data update
            logger.warn('updateDriverBankData not implemented yet')
            set({ loading: false })
        } catch (error: any) {
            const message = error.message || 'Erro ao atualizar dados bancários'
            set({ error: message, loading: false })
            logger.error('Erro ao atualizar dados bancários:', error)
            toast.error(message)
            throw error
        }
    },

    uploadReceipt: async (_paymentId: string, _file: File) => {
        set({ loading: true, error: null })
        try {
            // TODO: Implement API endpoint for receipt upload
            logger.warn('uploadReceipt not implemented yet')
            set({ loading: false })
            return ''
        } catch (error: any) {
            const message = error.message || 'Erro ao fazer upload do comprovante'
            set({ error: message, loading: false })
            logger.error('Erro ao fazer upload do comprovante:', error)
            toast.error(message)
            throw error
        }
    },

    clearError: () => set({ error: null })
}))

// Utilitários
export const formatCurrency = (value: number, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency
    }).format(value)
}

export const getPaymentStatusColor = (status: string) => {
    const colors = {
        'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'PROCESSING': 'bg-blue-100 text-blue-800 border-blue-200',
        'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
        'MANUAL_CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
        'FAILED': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground border-border'
}

export const getPaymentStatusLabel = (status: string) => {
    const labels = {
        'PENDING': 'Pendente',
        'PROCESSING': 'Processando',
        'COMPLETED': 'Completo',
        'MANUAL_CONFIRMED': 'Confirmado',
        'FAILED': 'Falhou'
    }
    return labels[status as keyof typeof labels] || status
}