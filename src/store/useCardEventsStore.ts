import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

export interface CardEvent {
    id: string
    cardId: string
    userId?: string
    action: string
    details: any
    createdAt: string
}

interface CardEventsState {
    events: CardEvent[]
    isLoading: boolean
    fetchEvents: (cardId: string) => Promise<void>
    logEvent: (cardId: string, action: string, details?: any) => Promise<void>
}

export const useCardEventsStore = create<CardEventsState>((set) => ({
    events: [],
    isLoading: false,

    fetchEvents: async (cardId) => {
        logger.log('📥 fetchEvents called for cardId:', cardId)
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('card_events')
                .select('*')
                .eq('card_id', cardId)
                .order('created_at', { ascending: false })

            if (error) {
                logger.error('❌ Error fetching events:', error)
                throw error
            }

            logger.log('✅ Fetched events:', data)

            const mappedEvents = data.map((item: any) => ({
                id: item.id,
                cardId: item.card_id,
                userId: item.user_id,
                action: item.action,
                details: item.details,
                createdAt: item.created_at
            }))

            logger.log('✅ Mapped events:', mappedEvents)
            set({ events: mappedEvents, isLoading: false })
        } catch (error) {
            logger.error('❌ Error fetching events:', error)
            const message = error instanceof Error ? error.message : 'Erro ao buscar eventos'
            toast.error(message)
            set({ isLoading: false })
        }
    },

    logEvent: async (cardId, action, details = {}) => {
        logger.log('📝 logEvent called:', { cardId, action, details })
        try {
            const insertData = {
                card_id: cardId,
                action,
                details
            }
            logger.log('📝 Inserting:', insertData)

            const { data, error } = await supabase
                .from('card_events')
                .insert([insertData])
                .select()

            if (error) {
                logger.error('❌ Supabase insert error:', error)
                throw error
            }

            logger.log('✅ Event logged successfully:', data)
        } catch (error) {
            logger.error('❌ Error logging event:', error)
            const message = error instanceof Error ? error.message : 'Erro ao registrar evento'
            toast.error(message)
        }
    }
}))
