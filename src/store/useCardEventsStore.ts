import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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
        console.log('📥 fetchEvents called for cardId:', cardId)
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('card_events')
                .select('*')
                .eq('card_id', cardId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('❌ Error fetching events:', error)
                throw error
            }

            console.log('✅ Fetched events:', data)

            const mappedEvents = data.map((item: any) => ({
                id: item.id,
                cardId: item.card_id,
                userId: item.user_id,
                action: item.action,
                details: item.details,
                createdAt: item.created_at
            }))

            console.log('✅ Mapped events:', mappedEvents)
            set({ events: mappedEvents, isLoading: false })
        } catch (error) {
            console.error('❌ Error fetching events:', error)
            set({ isLoading: false })
        }
    },

    logEvent: async (cardId, action, details = {}) => {
        console.log('📝 logEvent called:', { cardId, action, details })
        try {
            const insertData = {
                card_id: cardId,
                action,
                details
            }
            console.log('📝 Inserting:', insertData)

            const { data, error } = await supabase
                .from('card_events')
                .insert([insertData])
                .select()

            if (error) {
                console.error('❌ Supabase insert error:', error)
                throw error
            }

            console.log('✅ Event logged successfully:', data)
        } catch (error) {
            console.error('❌ Error logging event:', error)
        }
    }
}))
