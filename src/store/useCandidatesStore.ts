import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useCardEventsStore } from './useCardEventsStore'

export interface Candidate {
    id: string
    loadId: string
    driverId: string
    status: 'interested' | 'negotiating' | 'accepted' | 'rejected'
    bidValue?: number
    createdAt: string
    driver: {
        name: string
        avatar_url: string
        rating: number
        vehicle: string
    }
}

interface CandidatesState {
    candidates: Candidate[]
    isLoading: boolean
    fetchCandidates: (loadId: string) => Promise<void>
    addCandidate: (loadId: string, driverId: string, bidValue?: number) => Promise<void>
    updateCandidateStatus: (candidateId: string, status: 'interested' | 'negotiating' | 'accepted' | 'rejected') => Promise<void>
    acceptCandidate: (candidateId: string, loadId: string) => Promise<string>
    removeCandidate: (candidateId: string) => Promise<void>
}

export const useCandidatesStore = create<CandidatesState>((set, get) => ({
    candidates: [],
    isLoading: false,
    fetchCandidates: async (loadId) => {
        set({ isLoading: true })
        try {
            // Fetch load_candidates
            const { data: candidatesData, error: candidatesError } = await supabase
                .from('load_candidates')
                .select('*')
                .eq('load_id', loadId)
                .order('created_at', { ascending: false })

            if (candidatesError) throw candidatesError

            // If no candidates, return empty array
            if (!candidatesData || candidatesData.length === 0) {
                set({ candidates: [], isLoading: false })
                return
            }

            // Extract unique driver IDs
            const driverIds = [...new Set(candidatesData.map(c => c.driver_id))]

            // Fetch drivers data
            const { data: driversData, error: driversError } = await supabase
                .from('drivers')
                .select('id, name, avatar_url, rating, vehicle')
                .in('id', driverIds)

            if (driversError) throw driversError

            // Create a map of drivers for quick lookup
            const driversMap = new Map(
                (driversData || []).map(driver => [driver.id, driver])
            )

            // Merge candidates with driver data
            const mappedCandidates = candidatesData.map((item: any) => ({
                id: item.id,
                loadId: item.load_id,
                driverId: item.driver_id,
                status: item.status,
                bidValue: item.bid_value,
                createdAt: item.created_at,
                driver: {
                    name: driversMap.get(item.driver_id)?.name || 'Motorista Desconhecido',
                    avatar_url: driversMap.get(item.driver_id)?.avatar_url || '',
                    rating: driversMap.get(item.driver_id)?.rating || 0,
                    vehicle: driversMap.get(item.driver_id)?.vehicle || 'N/A'
                }
            }))

            set({ candidates: mappedCandidates, isLoading: false })
        } catch (error) {
            console.error('Error fetching candidates:', error)
            set({ isLoading: false })
        }
    },
    addCandidate: async (loadId, driverId, bidValue) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('load_candidates')
                .insert([{
                    load_id: loadId,
                    driver_id: driverId,
                    bid_value: bidValue,
                    status: 'interested'
                }])

            if (error) throw error

            await get().fetchCandidates(loadId)

            // Log event
            useCardEventsStore.getState().logEvent(loadId, 'candidate_invited', { driverId })
        } catch (error) {
            console.error('Error adding candidate:', error)
            set({ isLoading: false })
        }
    },
    updateCandidateStatus: async (candidateId, status) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('load_candidates')
                .update({ status })
                .eq('id', candidateId)

            if (error) throw error

            // Optimistic update
            set(state => ({
                candidates: state.candidates.map(c =>
                    c.id === candidateId ? { ...c, status } : c
                ),
                isLoading: false
            }))

            // Log event - we need to find the cardId first, but for now we might skip or fetch it
            // Ideally we pass cardId to this function or store it in the candidate object
        } catch (error) {
            console.error('Error updating candidate status:', error)
            set({ isLoading: false })
        }
    },
    acceptCandidate: async (candidateId, loadId) => {
        set({ isLoading: true })
        try {
            // 1. Get candidate details first
            const candidate = get().candidates.find(c => c.id === candidateId)
            if (!candidate) throw new Error('Candidate not found')

            // 2. Update selected candidate to 'accepted'
            const { error: acceptError } = await supabase
                .from('load_candidates')
                .update({ status: 'accepted' })
                .eq('id', candidateId)

            if (acceptError) throw acceptError

            // 3. Reject all other candidates for this load
            const { error: rejectError } = await supabase
                .from('load_candidates')
                .update({ status: 'rejected' })
                .eq('load_id', loadId)
                .neq('id', candidateId)

            if (rejectError) throw rejectError

            // 4. Log events
            useCardEventsStore.getState().logEvent(
                loadId,
                'candidate_accepted',
                {
                    candidateId,
                    driverId: candidate.driverId,
                    driverName: candidate.driver.name
                }
            )

            useCardEventsStore.getState().logEvent(
                loadId,
                'candidates_rejected',
                {
                    reason: 'another_candidate_accepted',
                    acceptedCandidateId: candidateId
                }
            )

            // 5. Trigger auto-advance if applicable
            const { useKanbanStore } = await import('./useKanbanStore')
            await useKanbanStore.getState().autoAdvanceCard(loadId, 'driver_accepted')

            // 6. Refresh candidates list
            await get().fetchCandidates(loadId)

            return candidate.driverId
        } catch (error) {
            console.error('Error accepting candidate:', error)
            set({ isLoading: false })
            throw error
        }
    },
    removeCandidate: async (candidateId) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('load_candidates')
                .delete()
                .eq('id', candidateId)

            if (error) throw error

            set(state => ({
                candidates: state.candidates.filter(c => c.id !== candidateId),
                isLoading: false
            }))
        } catch (error) {
            console.error('Error removing candidate:', error)
            set({ isLoading: false })
        }
    }
}))
