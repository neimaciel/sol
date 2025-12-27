import { DndContext, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay, defaultDropAnimationSideEffects, type DropAnimation } from '@dnd-kit/core'
import { Column } from './Column'
import { useKanbanStore } from '@/store/useKanbanStore'
import { useState } from 'react'
import { CardContent } from './Card'
import { motion } from 'framer-motion'

interface KanbanBoardProps {
    searchTerm?: string
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

export function KanbanBoard({ searchTerm = '' }: KanbanBoardProps) {
    const { columns, cards, moveCard, setSelectedCard, setActiveTab } = useKanbanStore()
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const cardId = active.id as string
        const newColumnId = over.id as string
        const card = cards.find(c => c.id === cardId)

        moveCard(cardId, newColumnId)

        // Smart Workflow Automations
        if (card) {
            if (newColumnId === 'contract') {
                setSelectedCard({ ...card, columnId: newColumnId })
                setActiveTab('contracts')
            } else if (newColumnId === 'loading') {
                setSelectedCard({ ...card, columnId: newColumnId })
                setActiveTab('map')
            } else if (newColumnId === 'completed') {
                setSelectedCard({ ...card, columnId: newColumnId })
                setActiveTab('attachments')
            }
        }
    }

    const filteredCards = cards.filter(card =>
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.destination.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const activeCard = activeId ? cards.find(c => c.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 sm:gap-6 h-full items-start perspective-1000 overflow-x-auto pb-4 snap-x snap-mandatory min-h-[50vh]"
            >
                {columns.map((column) => (
                    <Column
                        key={column.id}
                        column={column}
                        cards={filteredCards.filter(card => card.columnId === column.id)}
                    />
                ))}
            </motion.div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeCard ? (
                    <div className="transform-gpu rotate-3 scale-105 cursor-grabbing">
                        <CardContent card={activeCard} isOverlay />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
