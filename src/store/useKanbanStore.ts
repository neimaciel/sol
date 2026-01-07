import { create } from 'zustand'
import { api } from '@/lib/apiClient'
import { useCardEventsStore } from './useCardEventsStore'

export interface KanbanColumn {
    id: string
    title: string
}

export interface Driver {
    id: string
    name: string
    photo: string
    rating: number
    phone: string
    location: string
    vehicle: string
    status: 'available' | 'busy' | 'offline'
    vehicle_plate?: string
    cpf_cnpj?: string
}

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
    driver?: Driver
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
    sent_groups?: string[]
    // Automation Fields
    arrival_time?: string
    auto_advance?: boolean
}

interface KanbanState {
    cards: KanbanCard[]
    columns: KanbanColumn[]
    selectedCard: KanbanCard | null
    activeTab: string
    isCompactMode: boolean
    fetchCards: () => Promise<void>
    addCard: (card: Omit<KanbanCard, 'id'>) => Promise<void>
    moveCard: (cardId: string, toColumnId: string) => Promise<void>
    updateCard: (id: string, card: Partial<KanbanCard>) => Promise<void>
    deleteCard: (id: string) => Promise<void>
    setSelectedCard: (card: KanbanCard | null) => void
    setActiveTab: (tab: string) => void
    toggleCompactMode: () => void
    subscribeToCards: () => () => void
    assignDriver: (cardId: string, driverId: string) => Promise<void>
    unassignDriver: (cardId: string) => Promise<void>
    autoAdvanceCard: (cardId: string, trigger: string) => Promise<void>
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
    cards: [],
    columns: [
        { id: 'registration', title: 'Cadastro' },
        { id: 'broadcast', title: 'Divulgação' },
        { id: 'initial_service', title: 'Atendimento' },
        { id: 'documentation', title: 'Documentação' },
        { id: 'risk', title: 'Risco' },
        { id: 'contract', title: 'Contrato' },
        { id: 'loading', title: 'Carregamento' },
        { id: 'transit', title: 'Em Trânsito' },
        { id: 'unloading', title: 'Descarga' },
        { id: 'completed', title: 'Finalizado' }
    ],
    selectedCard: null,
    activeTab: 'info',
    isCompactMode: false,
    setSelectedCard: (card) => set({ selectedCard: card }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),

    fetchCards: async () => {
        try {
            const response = await api.getLoads()
            const data = response.loads

            if (!data) {
                console.warn('No loads data received')
                return
            }

            // Map database fields to frontend model
            const mappedCards: KanbanCard[] = data.map((item: any) => ({
                id: item.id,
                title: item.title || 'Carga sem título',
                columnId: item.column_id || 'registration',
                priority: item.priority || 'normal',
                origin: item.origin || 'Origem não informada',
                destination: item.destination || 'Destino não informado',
                value: item.value || 'R$ 0,00',
                date: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                driver: item.driver, // Driver object if assigned
                status: item.status || 'registration',
                // Phase 5 Mappings
                broadcast_status: item.broadcast_status,
                sent_groups: item.sent_groups || [],
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
        } catch (error) {
            console.error('Error fetching cards:', error)
        }
    },

    addCard: async (card) => {
        try {
            const response = await api.createLoad({
                title: card.title,
                origin: card.origin,
                destination: card.destination,
                value: card.value,
                priority: card.priority || 'normal',
                column_id: card.columnId || 'registration'
            })

            if (response.success) {
                // Refresh cards to get the latest data
                await get().fetchCards()
                useCardEventsStore.getState().logEvent(response.load.id, 'created', { title: card.title })
            }
        } catch (error) {
            console.error('Error adding card:', error)
        }
    },

    moveCard: async (cardId, toColumnId) => {
        try {
            // Determine if we need to reset broadcast status
            const shouldResetBroadcast = toColumnId === 'registration' || toColumnId === 'broadcast'

            // Optimistic update
            set((state) => ({
                cards: state.cards.map((card) =>
                    card.id === cardId
                        ? {
                            ...card,
                            columnId: toColumnId,
                            // Reset broadcast_status if moving to Cadastro
                            ...(shouldResetBroadcast ? { broadcast_status: 'pending' } : {})
                        }
                        : card
                ),
            }))

            const updateData: any = { column_id: toColumnId }

            // Reset broadcast_status in database if moving to Cadastro
            if (shouldResetBroadcast) {
                updateData.broadcast_status = 'pending'
            }

            const response = await api.updateLoad(cardId, updateData)

            if (response.success) {
                // Log event
                useCardEventsStore.getState().logEvent(cardId, 'moved', { to: toColumnId })
            }
        } catch (error) {
            console.error('Error moving card:', error)
            // Revert optimistic update on error
            await get().fetchCards()
        }
    },

    updateCard: async (id, updatedCard) => {
        try {
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
            if (updatedCard.broadcast_status) dbUpdate.broadcast_status = updatedCard.broadcast_status
            if (updatedCard.driver !== undefined) dbUpdate.driver_id = typeof updatedCard.driver === 'string' ? updatedCard.driver : updatedCard.driver?.id

            const response = await api.updateLoad(id, dbUpdate)

            if (response.success) {
                // Log significant updates
                if (updatedCard.checkin_time) useCardEventsStore.getState().logEvent(id, 'check-in', { time: updatedCard.checkin_time })
                if (updatedCard.pod_url) useCardEventsStore.getState().logEvent(id, 'pod_uploaded', { url: updatedCard.pod_url })
                if (updatedCard.broadcast_status === 'sent') useCardEventsStore.getState().logEvent(id, 'broadcast_sent')
                if (updatedCard.risk_status) useCardEventsStore.getState().logEvent(id, 'risk_updated', { status: updatedCard.risk_status })
                if (updatedCard.documents_status) useCardEventsStore.getState().logEvent(id, 'documents_updated', { status: updatedCard.documents_status })
            }
        } catch (error) {
            console.error('Error updating card:', error)
            // Revert optimistic update on error
            await get().fetchCards()
        }
    },

    deleteCard: async (id) => {
        try {
            // Optimistic update
            set((state) => ({
                cards: state.cards.filter((card) => card.id !== id),
                selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
            }))

            const response = await api.deleteLoad(id)

            if (!response.success) {
                throw new Error('Failed to delete load')
            }
        } catch (error) {
            console.error('Error deleting card:', error)
            // Revert optimistic update on error
            await get().fetchCards()
        }
    },

    subscribeToCards: () => {
        // For local development, we'll use polling or manual refresh
        // Real-time subscriptions would require WebSocket implementation
        console.log('Real-time subscriptions disabled for local API')
        
        // Return empty unsubscribe function
        return () => {
            // No-op
        }
    },

    assignDriver: async (cardId, driverId) => {
        try {
            const response = await api.updateLoad(cardId, {
                driver_id: driverId,
                column_id: 'documentation'
            })

            if (!response.success) {
                throw new Error('Failed to assign driver')
            }

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

    unassignDriver: async (cardId) => {
        try {
            const response = await api.updateLoad(cardId, {
                driver_id: null,
                column_id: 'initial_service'
            })

            if (!response.success) {
                throw new Error('Failed to unassign driver')
            }

            // Optimistic update
            set((state) => ({
                cards: state.cards.map((card) =>
                    card.id === cardId
                        ? { ...card, driver: undefined, columnId: 'initial_service' }
                        : card
                ),
                selectedCard: state.selectedCard?.id === cardId
                    ? { ...state.selectedCard, driver: undefined, columnId: 'initial_service' }
                    : state.selectedCard
            }))

            // Log event
            useCardEventsStore.getState().logEvent(cardId, 'driver_unassigned')

            // Refresh to ensure sync
            await get().fetchCards()
        } catch (error) {
            console.error('Error unassigning driver:', error)
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
