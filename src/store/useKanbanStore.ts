import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useCardEventsStore } from './useCardEventsStore'

export interface KanbanCard {
    id: string
    title: string
    columnId: string
    priority: 'high' | 'normal'
    origin: string
    destination: string
    value: string
    vehicle_type?: string
    date: string
    driver?: string
    status?: string
    // Phase 5 Fields
    broadcast_status?: 'pending' | 'sent'
    risk_status?: 'pending' | 'approved' | 'rejected'
    documents_status?: 'pending' | 'verified'
    contract_url?: string
    checkin_time?: string
    pod_url?: string
    invoice_status?: 'pending' | 'sent' | 'paid'
    whatsapp_group_id?: string
    // Automation Fields
    arrival_time?: string
    auto_advance?: boolean
}

export interface KanbanColumn {
    id: string
    title: string
}

interface KanbanState {
    columns: KanbanColumn[]
    cards: KanbanCard[]
    activeTab: string
    setActiveTab: (tab: string) => void
    selectedCard: KanbanCard | null
    setSelectedCard: (card: KanbanCard | null) => void
    fetchCards: () => Promise<void>
    moveCard: (cardId: string, toColumnId: string) => Promise<void>
    addCard: (card: Omit<KanbanCard, 'id'>) => Promise<void>
    updateCard: (id: string, card: Partial<KanbanCard>) => Promise<void>
    deleteCard: (id: string) => Promise<void>
    subscribeToCards: () => () => void
    assignDriver: (cardId: string, driverId: string) => Promise<void>
    autoAdvanceCard: (cardId: string, trigger: string) => Promise<void>
    isCompactMode: boolean
    toggleCompactMode: () => void
}

const initialColumns: KanbanColumn[] = [
    { id: 'registration', title: 'Cadastro' },
    { id: 'broadcast', title: 'Divulgação' },
    { id: 'initial_service', title: 'Atendimento' },
    { id: 'documentation', title: 'Documentação' },
    { id: 'risk', title: 'Risco' },
    { id: 'contract', title: 'Contratação' },
    { id: 'loading', title: 'Carregamento' },
    { id: 'transit', title: 'Trânsito' },
    { id: 'unloading', title: 'Descarga' },
    { id: 'completed', title: 'Finalização' },
]

export const useKanbanStore = create<KanbanState>((set, get) => ({
    columns: initialColumns,
    cards: [],
    activeTab: 'info',
    setActiveTab: (tab) => set({ activeTab: tab }),
    selectedCard: null,
    setSelectedCard: (card) => set({ selectedCard: card }),
    isCompactMode: false,
    toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),

    fetchCards: async () => {
        const { data, error } = await supabase
            .from('loads')
            .select('*')

        if (error) {
            console.error('Error fetching cards:', error)
            return
        }

        // Map database fields to frontend model
        const mappedCards: KanbanCard[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            columnId: item.column_id,
            priority: item.priority,
            origin: item.origin,
            destination: item.destination,
            value: item.value,
            date: item.date,
            driver: item.driver_id, // Adjust if needed
            status: item.status,
            // Phase 5 Mappings
            broadcast_status: item.broadcast_status,
            risk_status: item.risk_status,
            documents_status: item.documents_status,
            contract_url: item.contract_url,
            checkin_time: item.checkin_time,
            pod_url: item.pod_url,
            invoice_status: item.invoice_status,
            whatsapp_group_id: item.whatsapp_group_id,
            arrival_time: item.arrival_time,
            auto_advance: item.auto_advance
        }))

        set({ cards: mappedCards })
    },

    moveCard: async (cardId, toColumnId) => {
        // Optimistic update
        set((state) => ({
            cards: state.cards.map((card) =>
                card.id === cardId ? { ...card, columnId: toColumnId } : card
            ),
        }))

        const { error } = await supabase
            .from('loads')
            .update({ column_id: toColumnId })
            .eq('id', cardId)

        if (error) {
            console.error('Error moving card:', error)
        } else {
            // Log event
            useCardEventsStore.getState().logEvent(cardId, 'moved', { to: toColumnId })
        }
    },

    addCard: async (card) => {
        const newCardId = `CARGA-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        const newCard = { ...card, id: newCardId }

        // Optimistic update
        set((state) => ({
            cards: [...state.cards, newCard],
        }))

        const { error } = await supabase
            .from('loads')
            .insert([{
                id: newCardId,
                title: card.title,
                column_id: card.columnId,
                priority: card.priority,
                origin: card.origin,
                destination: card.destination,
                value: card.value,
                date: card.date,
                // Default values for new fields
                broadcast_status: 'pending',
                risk_status: 'pending',
                documents_status: 'pending',
                invoice_status: 'pending'
            }])

        if (error) {
            console.error('Error adding card:', error)
        } else {
            useCardEventsStore.getState().logEvent(newCardId, 'created', { title: card.title })
        }
    },

    updateCard: async (id, updatedCard) => {
        // Optimistic update
        set((state) => ({
            cards: state.cards.map((card) =>
                card.id === id ? { ...card, ...updatedCard } : card
            ),
            selectedCard:
                state.selectedCard?.id === id
                    ? { ...state.selectedCard, ...updatedCard }
                    : state.selectedCard,
        }))

        // Prepare DB update object (snake_case)
        const dbUpdate: any = {}
        if (updatedCard.columnId) dbUpdate.column_id = updatedCard.columnId
        if (updatedCard.title) dbUpdate.title = updatedCard.title
        if (updatedCard.priority) dbUpdate.priority = updatedCard.priority
        if (updatedCard.origin) dbUpdate.origin = updatedCard.origin
        if (updatedCard.destination) dbUpdate.destination = updatedCard.destination
        if (updatedCard.value) dbUpdate.value = updatedCard.value
        if (updatedCard.date) dbUpdate.date = updatedCard.date
        // Phase 5 Updates
        if (updatedCard.broadcast_status) dbUpdate.broadcast_status = updatedCard.broadcast_status
        if (updatedCard.risk_status) dbUpdate.risk_status = updatedCard.risk_status
        if (updatedCard.documents_status) dbUpdate.documents_status = updatedCard.documents_status
        if (updatedCard.contract_url) dbUpdate.contract_url = updatedCard.contract_url
        if (updatedCard.checkin_time) dbUpdate.checkin_time = updatedCard.checkin_time
        if (updatedCard.pod_url) dbUpdate.pod_url = updatedCard.pod_url
        if (updatedCard.invoice_status) dbUpdate.invoice_status = updatedCard.invoice_status
        if (updatedCard.whatsapp_group_id) dbUpdate.whatsapp_group_id = updatedCard.whatsapp_group_id
        if (updatedCard.arrival_time) dbUpdate.arrival_time = updatedCard.arrival_time
        if (updatedCard.auto_advance !== undefined) dbUpdate.auto_advance = updatedCard.auto_advance

        const { error } = await supabase
            .from('loads')
            .update(dbUpdate)
            .eq('id', id)

        if (error) {
            console.error('Error updating card:', error)
        } else {
            // Log significant updates
            if (updatedCard.checkin_time) useCardEventsStore.getState().logEvent(id, 'check-in', { time: updatedCard.checkin_time })
            if (updatedCard.pod_url) useCardEventsStore.getState().logEvent(id, 'pod_uploaded', { url: updatedCard.pod_url })
            if (updatedCard.broadcast_status === 'sent') useCardEventsStore.getState().logEvent(id, 'broadcast_sent')
            if (updatedCard.risk_status) useCardEventsStore.getState().logEvent(id, 'risk_updated', { status: updatedCard.risk_status })
            if (updatedCard.documents_status) useCardEventsStore.getState().logEvent(id, 'documents_updated', { status: updatedCard.documents_status })
        }
    },

    deleteCard: async (id) => {
        // Optimistic update
        set((state) => ({
            cards: state.cards.filter((card) => card.id !== id),
            selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
        }))

        const { error } = await supabase
            .from('loads')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting card:', error)
        }
    },

    subscribeToCards: () => {
        const subscription = supabase
            .channel('loads_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'loads' },
                (payload) => {
                    console.log('Real-time update:', payload)
                    // Refresh cards on any change
                    // In a more complex app, we would merge the payload into the state directly
                    // to avoid a full refetch, but for now, refetching is safer and easier.
                    useKanbanStore.getState().fetchCards()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    },

    assignDriver: async (cardId, driverId) => {
        try {
            const { error } = await supabase
                .from('loads')
                .update({
                    driver_id: driverId,
                    column_id: 'documentation'
                })
                .eq('id', cardId)

            if (error) throw error

            // Log event
            useCardEventsStore.getState().logEvent(
                cardId,
                'driver_assigned',
                { driverId }
            )

            // Refresh cards to update UI
            await get().fetchCards()
        } catch (error) {
            console.error('Error assigning driver:', error)
            throw error
        }
    },

    autoAdvanceCard: async (cardId: string, trigger: string) => {
        const card = get().cards.find(c => c.id === cardId)
        if (!card) {
            console.warn('Card not found for auto-advance:', cardId)
            return
        }

        // Check if auto-advance is enabled for this card
        if (card.auto_advance === false) {
            console.log('Auto-advance disabled for card:', cardId)
            return
        }

        const currentColumn = card.columnId

        // Define transition rules
        type TransitionRule = {
            next: string
            condition: () => boolean
        }

        const transitions: Record<string, TransitionRule> = {
            'registration': {
                next: 'broadcast',
                condition: () => !!card.whatsapp_group_id
            },
            'broadcast': {
                next: 'initial_service',
                condition: () => card.broadcast_status === 'sent'
            },
            'initial_service': {
                next: 'documentation',
                condition: () => !!card.driver // Driver assigned
            },
            'documentation': {
                next: 'risk',
                condition: () => card.documents_status === 'verified'
            },
            'risk': {
                next: 'contract',
                condition: () => card.risk_status === 'approved'
            },
            'contract': {
                next: 'loading',
                condition: () => !!card.contract_url
            },
            'loading': {
                next: 'transit',
                condition: () => !!card.checkin_time
            },
            'transit': {
                next: 'unloading',
                condition: () => !!card.arrival_time
            },
            'unloading': {
                next: 'completed',
                condition: () => !!card.pod_url
            }
        }

        const transition = transitions[currentColumn]

        if (!transition) {
            console.log('No transition defined for column:', currentColumn)
            return
        }

        if (!transition.condition()) {
            console.log('Transition condition not met for:', currentColumn, '→', transition.next)
            return
        }

        // Perform the auto-advance
        console.log(`🤖 Auto-advancing card ${cardId} from ${currentColumn} to ${transition.next} (trigger: ${trigger})`)

        try {
            await get().moveCard(cardId, transition.next)

            // Log auto-advance event
            useCardEventsStore.getState().logEvent(
                cardId,
                'auto_advanced',
                {
                    from: currentColumn,
                    to: transition.next,
                    trigger
                }
            )
        } catch (error) {
            console.error('Error during auto-advance:', error)
        }
    }
}))

// Expose store to window for testing
if (typeof window !== 'undefined') {
    (window as any).useKanbanStore = useKanbanStore
}
