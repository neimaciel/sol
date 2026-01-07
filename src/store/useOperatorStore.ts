import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Operator {
    id: string
    email: string
    name: string
    role: string
    role_display: string
    department?: string
    phone?: string
    photo?: string
    is_superuser: boolean
    last_login?: string
    created_at: string
    permissions: {
        can_manage_drivers: boolean
        can_manage_loads: boolean
        can_confirm_payments: boolean
        can_manage_operators: boolean
        can_access_reports: boolean
        can_manage_contracts: boolean
    }
}

interface OperatorState {
    operator: Operator | null
    sessionToken: string | null
    expiresAt: string | null
    loading: boolean
    error: string | null

    // Actions
    login: (email: string, password: string) => Promise<boolean>
    logout: () => Promise<void>
    getCurrentOperator: () => Promise<void>
    isAuthenticated: () => boolean
    hasPermission: (permission: string) => boolean
    clearError: () => void
}

export const useOperatorStore = create<OperatorState>()(
    persist(
        (set, get) => ({
            operator: null,
            sessionToken: null,
            expiresAt: null,
            loading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ loading: true, error: null })
                try {
                    // Supabase Edge Function Authentication - v2.0
                    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDEzNjgsImV4cCI6MjA4MjM3NzM2OH0.0Ig35iloZLzSUQnvmj9oVSQ2mYmSeWjpdaRudEU5qOo'
                    const API_URL = 'https://ekimcihxrnigghnappjv.supabase.co/functions/v1/operators/auth/login'

                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${ANON_KEY}`,
                            'apikey': ANON_KEY
                        },
                        body: JSON.stringify({ email, password })
                    })

                    const data = await response.json()

                    if (!response.ok) {
                        throw new Error(data.error || data.detail || 'Erro no login')
                    }

                    if (!data.success) {
                        throw new Error(data.message || 'Falha na autenticação')
                    }

                    set({
                        operator: data.operator,
                        sessionToken: data.access_token,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                        loading: false
                    })

                    return true
                } catch (error: any) {
                    set({ error: error.message, loading: false })
                    return false
                }
            },

            logout: async () => {
                const { sessionToken } = get()
                
                if (sessionToken) {
                    try {
                        await fetch('/api/v1/operators/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${sessionToken}`,
                                'Content-Type': 'application/json'
                            }
                        })
                    } catch (error) {
                        console.warn('Erro ao fazer logout no servidor:', error)
                    }
                }

                set({
                    operator: null,
                    sessionToken: null,
                    expiresAt: null,
                    error: null
                })
            },

            getCurrentOperator: async () => {
                const { sessionToken } = get()
                
                if (!sessionToken) {
                    return
                }

                set({ loading: true })
                try {
                    const response = await fetch('/api/v1/operators/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${sessionToken}`
                        }
                    })

                    if (!response.ok) {
                        if (response.status === 401) {
                            // Token expirado
                            set({
                                operator: null,
                                sessionToken: null,
                                expiresAt: null,
                                loading: false
                            })
                            return
                        }
                        throw new Error('Erro ao buscar dados do operador')
                    }

                    const operatorData = await response.json()
                    set({ operator: operatorData, loading: false })
                } catch (error: any) {
                    set({ error: error.message, loading: false })
                }
            },

            isAuthenticated: () => {
                const { sessionToken, expiresAt } = get()
                
                if (!sessionToken || !expiresAt) {
                    return false
                }

                // Verificar se o token expirou
                const now = new Date()
                const expiry = new Date(expiresAt)
                
                if (now >= expiry) {
                    // Token expirado, limpar estado
                    set({
                        operator: null,
                        sessionToken: null,
                        expiresAt: null
                    })
                    return false
                }

                return true
            },

            hasPermission: (permission: string) => {
                const { operator } = get()
                
                if (!operator) return false
                if (operator.is_superuser) return true

                return operator.permissions[permission as keyof typeof operator.permissions] || false
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'operator-auth',
            partialize: (state) => ({
                operator: state.operator,
                sessionToken: state.sessionToken,
                expiresAt: state.expiresAt
            })
        }
    )
)

// Auto-refresh do token se estiver próximo do vencimento
setInterval(() => {
    const state = useOperatorStore.getState()
    if (state.isAuthenticated()) {
        const { expiresAt } = state
        if (expiresAt) {
            const now = new Date()
            const expiry = new Date(expiresAt)
            const timeLeft = expiry.getTime() - now.getTime()
            
            // Se restam menos de 15 minutos, atualizar dados
            if (timeLeft < 15 * 60 * 1000) {
                state.getCurrentOperator()
            }
        }
    }
}, 5 * 60 * 1000) // Verificar a cada 5 minutos