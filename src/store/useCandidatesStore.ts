import { create } from 'zustand'

interface Driver {
    id: string
    name: string
    phone: string
    vehicle_type: string
    vehicle_plate?: string
    cpf_cnpj?: string
}

export interface Candidate {
    id: string
    load_id: string
    driver_id: string
    status: 'pending' | 'negotiating' | 'selected' | 'rejected'
    driver: Driver
    chat_messages: any[]
    created_at: string
}

interface CandidatesStore {
    candidates: Candidate[]
    loading: boolean
    error: string | null
    fetchCandidates: (loadId: string) => Promise<void>
    selectCandidate: (candidateId: string) => Promise<void>
}

export const useCandidatesStore = create<CandidatesStore>((set) => ({
    candidates: [],
    loading: false,
    error: null,

    fetchCandidates: async (loadId: string) => {
        set({ loading: true, error: null })
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

            // Add timeout to prevent infinite loading
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

            const response = await fetch(`${apiUrl}/api/v1/candidates/by-load/${loadId}`, {
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) throw new Error('Failed to fetch candidates')

            const data = await response.json()
            set({ candidates: data })
        } catch (err) {
            console.error('Error fetching candidates:', err)
            const errorMessage = err instanceof Error
                ? (err.name === 'AbortError' ? 'Tempo limite excedido. O servidor pode estar reiniciando.' : err.message)
                : 'Failed to fetch candidates'
            set({ error: errorMessage })
        } finally {
            set({ loading: false })
        }
    },

    selectCandidate: async (candidateId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/candidates/${candidateId}/select`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to select candidate')

            // Optimistic update
            set((state) => ({
                candidates: state.candidates.map((c) =>
                    c.id === candidateId
                        ? { ...c, status: 'selected' }
                        : { ...c, status: 'rejected' } // Assuming single selection
                )
            }))
        } catch (err) {
            console.error('Error selecting candidate:', err)
            // Revert or show error
        }
    }
}))
