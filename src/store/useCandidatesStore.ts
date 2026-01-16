import { create } from 'zustand'
import { api } from '@/lib/apiClient'

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
            const data = await api.getCandidatesByLoad(loadId)
            set({ candidates: data })
        } catch (err) {
            console.error('Error fetching candidates:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch candidates'
            set({ error: errorMessage })
        } finally {
            set({ loading: false })
        }
    },

    selectCandidate: async (candidateId: string) => {
        try {
            await api.selectCandidate(candidateId)

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
