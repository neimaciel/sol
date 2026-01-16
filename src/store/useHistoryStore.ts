import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

export interface HistoryItem {
    id: string
    loadId: string
    type: 'Carga Completa' | 'Carga Fracionada'
    status: 'Nova oferta' | 'Atendimento' | 'Documentação' | 'Finalizada'
    origin: string
    destination: string
    vehicleType: string
    weight: string
    value: string
    interactions: number
    date: string
}

interface HistoryState {
    history: HistoryItem[]
    isLoading: boolean
    fetchHistory: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>((set) => ({
    history: [],
    isLoading: false,
    fetchHistory: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('loads')
                .select('*')
                .eq('column_id', 'completed')
                .order('date', { ascending: false })

            if (error) throw error

            const mappedHistory: HistoryItem[] = data.map((item: any) => ({
                id: item.id,
                loadId: item.id,
                type: 'Carga Completa', // Default as it's not in loads table yet
                status: 'Finalizada',
                origin: item.origin,
                destination: item.destination,
                vehicleType: 'Carreta', // Default
                weight: 'N/A', // Default
                value: item.value,
                interactions: 0,
                date: item.date
            }))

            set({ history: mappedHistory, isLoading: false })
        } catch (error) {
            logger.error('Error fetching history:', error)
            const message = error instanceof Error ? error.message : 'Erro ao buscar histórico'
            toast.error(message)
            set({ isLoading: false })
        }
    }
}))
