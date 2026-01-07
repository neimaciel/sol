import { create } from 'zustand'
import { api } from '@/lib/apiClient'
// import type { LoginResponse } from '@/lib/apiClient'

interface Operator {
    id: string
    email: string
    name: string
    role: string
    permissions: {
        can_manage_drivers: boolean
        can_manage_loads: boolean
        can_confirm_payments: boolean
        can_manage_operators: boolean
        can_access_reports: boolean
        can_manage_contracts: boolean
    }
}

interface AuthState {
    user: Operator | null
    loading: boolean
    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    initialize: async () => {
        try {
            set({ loading: true })
            
            // Check if we have a token
            const token = api.getToken()
            if (!token) {
                set({ user: null, loading: false })
                return
            }

            // Try to get current user with existing token
            try {
                const currentUser = await api.getCurrentUser()
                set({ 
                    user: {
                        id: currentUser.id,
                        email: currentUser.email,
                        name: currentUser.name,
                        role: currentUser.role,
                        permissions: currentUser.permissions
                    },
                    loading: false 
                })
            } catch (error) {
                // Token is invalid, clear it
                console.error('Invalid token, clearing...', error)
                api.clearToken()
                set({ user: null, loading: false })
            }
        } catch (error) {
            console.error('Auth initialization error:', error)
            set({ user: null, loading: false })
        }
    },
    signIn: async (email, password) => {
        try {
            set({ loading: true })
            const response = await api.login(email, password)
            
            set({ 
                user: response.operator,
                loading: false 
            })
            
            return { error: null }
        } catch (error: any) {
            console.error('Login error:', error)
            set({ loading: false })
            return { 
                error: {
                    message: error.message || 'Erro ao fazer login'
                }
            }
        }
    },
    signUp: async (_email: string, _password: string, _name: string) => {
        // Mock signUp for now, as it's not implemented in the API
        return { 
            error: {
                message: 'SignUp não implementado. Use as credenciais existentes.'
            }
        }
    },
    signOut: async () => {
        try {
            await api.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            set({ user: null })
        }
    },
}))
