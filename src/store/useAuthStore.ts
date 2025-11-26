import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
    user: User | null
    loading: boolean
    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signUp: (email: string, password: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    initialize: async () => {
        try {
            // Mock Mode Check
            const isMock = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')

            if (isMock) {
                console.log('Running in Mock Mode')
                set({
                    user: {
                        id: 'mock-user-id',
                        email: 'demo@sol-tms.com',
                        app_metadata: {},
                        user_metadata: {},
                        aud: 'authenticated',
                        created_at: new Date().toISOString()
                    } as User,
                    loading: false
                })
                return
            }

            const { data: { session } } = await supabase.auth.getSession()
            set({ user: session?.user ?? null, loading: false })

            supabase.auth.onAuthStateChange((_event, session) => {
                set({ user: session?.user ?? null })
            })
        } catch (error) {
            console.error('Auth initialization error:', error)
            set({ loading: false })
        }
    },
    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { error }
    },
    signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({
            email,
            password
        })
        return { error }
    },
    signOut: async () => {
        const isMock = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')
        if (!isMock) {
            await supabase.auth.signOut()
        }
        set({ user: null })
    },
}))
