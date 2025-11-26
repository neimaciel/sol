import { useDroppable } from '@dnd-kit/core'
import { KanbanCard as CardComponent } from './Card'
import type { KanbanCard, KanbanColumn } from '@/store/useKanbanStore'
import { useKanbanStore } from '@/store/useKanbanStore'
import { motion } from 'framer-motion'

interface ColumnProps {
    column: KanbanColumn
    cards: KanbanCard[]
}

export function Column({ column, cards }: ColumnProps) {
    const { setNodeRef } = useDroppable({ id: column.id })
    const isCompactMode = useKanbanStore((state) => state.isCompactMode)

    return (
        <div className={`${isCompactMode ? 'min-w-[280px]' : 'min-w-[350px]'} flex-shrink-0 h-full transition-all duration-300`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-card border-2 border-border h-full flex flex-col shadow-brutal overflow-hidden"
            >
                {/* Column Header */}
                <div className="p-4 border-b-2 border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 border-2 border-foreground ${cards.length > 0 ? 'bg-primary' : 'bg-transparent'}`} />
                            <h3 className="text-sm font-heading font-black text-foreground tracking-tight uppercase">{column.title}</h3>
                        </div>
                        <div className="px-2 py-0.5 bg-background border-2 border-border flex items-center justify-center shadow-brutal-sm">
                            <span className="text-[10px] font-bold text-foreground">{cards.length}</span>
                        </div>
                    </div>
                </div>

                {/* Cards Container */}
                <div
                    ref={setNodeRef}
                    className="p-3 space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-foreground scrollbar-track-muted"
                >
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <CardComponent card={card} />
                        </motion.div>
                    ))}
                    {cards.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border bg-muted/10">
                            <p className="text-sm font-bold text-muted-foreground uppercase">Vazio</p>
                            <p className="text-xs text-muted-foreground/60 mt-1 font-mono">Arraste itens para cá</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
