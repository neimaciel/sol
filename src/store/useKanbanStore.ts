import { create } from 'zustand'
import { api } from '@/lib/apiClient'
import { useCardEventsStore } from './useCardEventsStore'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

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
    documents_status?: 'pending' | 'verified' | 'rejected'
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
    autoAdvanceLocks: Set<string> // Track cards being auto-advanced
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
    autoAdvanceLocks: new Set<string>(),
    setSelectedCard: (card) => set({ selectedCard: card }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),

    fetchCards: async () => {
        try {
            const response = await api.getLoads()
            const data = response.loads

            if (!data) {
                logger.warn('No loads data received')
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
            logger.error('Error fetching cards:', error)
            const message = error instanceof Error ? error.message : 'Erro ao buscar cargas'
            toast.error(message)
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
                toast.success('Carga criada com sucesso!')
            }
        } catch (error) {
            logger.error('Error adding card:', error)
            const message = error instanceof Error ? error.message : 'Erro ao criar carga'
            toast.error(message)
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
            logger.error('Error moving card:', error)
            const message = error instanceof Error ? error.message : 'Erro ao mover carga'
            toast.error(message)
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
            logger.error('Error updating card:', error)
            const message = error instanceof Error ? error.message : 'Erro ao atualizar carga'
            toast.error(message)
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

            toast.success('Carga excluída com sucesso!')
        } catch (error) {
            logger.error('Error deleting card:', error)
            const message = error instanceof Error ? error.message : 'Erro ao excluir carga'
            toast.error(message)
            // Revert optimistic update on error
            await get().fetchCards()
        }
    },

    subscribeToCards: () => {
        // For local development, we'll use polling or manual refresh
        // Real-time subscriptions would require WebSocket implementation
        logger.log('Real-time subscriptions disabled for local API')

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
            toast.success('Motorista atribuído com sucesso!')
        } catch (error) {
            logger.error('Error assigning driver:', error)
            const message = error instanceof Error ? error.message : 'Erro ao atribuir motorista'
            toast.error(message)
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
            toast.success('Motorista desvinculado com sucesso!')
        } catch (error) {
            logger.error('Error unassigning driver:', error)
            const message = error instanceof Error ? error.message : 'Erro ao desvincular motorista'
            toast.error(message)
            throw error
        }
    },

    autoAdvanceCard: async (cardId: string, trigger: string) => {
        // Race condition prevention: Check if this card is already being auto-advanced
        const locks = get().autoAdvanceLocks
        if (locks.has(cardId)) {
            logger.log('Auto-advance already in progress for card:', cardId)
            return
        }

        // Acquire lock (create new Set to maintain immutability)
        const newLocks = new Set(locks)
        newLocks.add(cardId)
        set({ autoAdvanceLocks: newLocks })

        try {
            const card = get().cards.find(c => c.id === cardId)
            if (!card) {
                logger.warn('Card not found for auto-advance:', cardId)
                return
            }

            // Check if auto-advance is enabled for this card
            if (card.auto_advance === false) {
                logger.log('Auto-advance disabled for card:', cardId)
                return
            }

            const currentColumn = card.columnId

        // Define transition rules with rejection paths
        type TransitionRule = {
            next: string | null  // null = final state
            nextOnReject?: string  // Rejection path
            condition: () => boolean
            checkRejection?: () => boolean
            rejectionMessage?: string
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
                nextOnReject: 'initial_service', // Return to service if docs rejected
                condition: () => card.documents_status === 'verified',
                checkRejection: () => card.documents_status === 'rejected',
                rejectionMessage: '❌ Documentação rejeitada. Retornando para Atendimento.'
            },
            'risk': {
                next: 'contract',
                nextOnReject: 'broadcast', // Return to broadcast if risk rejected
                condition: () => card.risk_status === 'approved',
                checkRejection: () => card.risk_status === 'rejected',
                rejectionMessage: '⚠️ Análise de risco rejeitada. Retornando para Divulgação.'
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
            },
            'completed': {
                next: null, // Final state - no further transitions
                condition: () => true
            }
        }

            const transition = transitions[currentColumn]

            if (!transition) {
                logger.log('No transition defined for column:', currentColumn)
                return
            }

            // Check for rejection first
            if (transition.checkRejection && transition.checkRejection()) {
                if (!transition.nextOnReject) {
                    logger.warn('Rejection detected but no rejection path defined for:', currentColumn)
                    return
                }

                logger.log(`🚫 Rejection detected for card ${cardId} in ${currentColumn}, moving to ${transition.nextOnReject}`)

                try {
                    await get().moveCard(cardId, transition.nextOnReject)

                    // Log rejection event
                    useCardEventsStore.getState().logEvent(
                        cardId,
                        'rejected',
                        {
                            from: currentColumn,
                            to: transition.nextOnReject,
                            trigger,
                            reason: transition.rejectionMessage || 'Rejected'
                        }
                    )

                    if (transition.rejectionMessage) {
                        toast.warning(transition.rejectionMessage)
                    }
                } catch (error) {
                    logger.error('Error during rejection handling:', error)
                    const message = error instanceof Error ? error.message : 'Erro ao processar rejeição'
                    toast.error(message)
                }

                return
            }

            // Check if it's a final state
            if (transition.next === null) {
                logger.log('Card is in final state:', currentColumn)
                toast.info('Carga já está no estado final')
                return
            }

            // Check if condition is met for advancement
            if (!transition.condition()) {
                logger.log('Transition condition not met for:', currentColumn, '→', transition.next)
                return
            }

            // Perform the auto-advance
            logger.log(`🤖 Auto-advancing card ${cardId} from ${currentColumn} to ${transition.next} (trigger: ${trigger})`)

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

                // Get friendly column names
                const columnNames: Record<string, string> = {
                    'registration': 'Cadastro',
                    'broadcast': 'Divulgação',
                    'initial_service': 'Atendimento',
                    'documentation': 'Documentação',
                    'risk': 'Risco',
                    'contract': 'Contrato',
                    'loading': 'Carregamento',
                    'transit': 'Em Trânsito',
                    'unloading': 'Descarga',
                    'completed': 'Finalizado'
                }

                const nextColumnName = columnNames[transition.next] || transition.next
                toast.success(`✅ Carga avançada automaticamente para ${nextColumnName}`)
            } catch (error) {
                logger.error('Error during auto-advance:', error)
                const message = error instanceof Error ? error.message : 'Erro no avanço automático'
                toast.error(message)
            }
        } finally {
            // Release lock (create new Set to maintain immutability)
            const locks = get().autoAdvanceLocks
            const newLocks = new Set(locks)
            newLocks.delete(cardId)
            set({ autoAdvanceLocks: newLocks })
        }
    }
}))

// Expose store to window for testing
if (typeof window !== 'undefined') {
    (window as any).useKanbanStore = useKanbanStore
}
