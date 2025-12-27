import { useDraggable } from '@dnd-kit/core'
import type { KanbanCard } from '@/store/useKanbanStore'
import { useKanbanStore } from '@/store/useKanbanStore'
import { Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
    card: KanbanCard
    isOverlay?: boolean
}

export function CardContent({ card, isOverlay, onClick, onExpand, isExpanded }: {
    card: KanbanCard,
    isOverlay?: boolean,
    onClick?: () => void,
    onExpand?: (e: React.MouseEvent) => void,
    isExpanded?: boolean
}) {
    const isCompactMode = useKanbanStore((state) => state.isCompactMode)

    return (
        <motion.div
            layoutId={isOverlay ? undefined : card.id}
            onClick={onClick}
            whileHover={!isOverlay ? { y: -4, x: 4, boxShadow: 'none' } : undefined}
            whileTap={!isOverlay ? { scale: 0.98 } : undefined}
            initial={false}
            animate={isOverlay ? { scale: 1.05, rotate: 2, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" } : { scale: 1, rotate: 0 }}
            className={cn(
                "group relative transition-all duration-200 border-2 bg-card",
                isOverlay
                    ? "border-foreground cursor-grabbing z-50 shadow-brutal"
                    : "border-border hover:border-foreground cursor-grab active:cursor-grabbing shadow-brutal hover:shadow-none"
            )}
        >
            {/* Accent Line */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 border-r-2 border-border",
                card.priority === 'high' ? "bg-red-500" : "bg-blue-500"
            )} />

            <div className={cn("pl-3 sm:pl-5 space-y-1 sm:space-y-2", isCompactMode ? "p-1 sm:p-2" : "p-2 sm:p-3")}>
                {/* Compact Header */}
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                        <span className="text-[8px] sm:text-[10px] font-mono font-bold text-foreground bg-muted px-0.5 sm:px-1 py-0.5 border border-border">
                            #{card.id.substring(0, 4)}
                        </span>
                        <h4 className={cn("font-heading font-bold text-foreground truncate uppercase", isCompactMode ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs")}>
                            {card.origin} → {card.destination}
                        </h4>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground hover:bg-accent -mr-1 transition-colors rounded-none"
                        onClick={onExpand}
                    >
                        {isExpanded ? <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                    </Button>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {(isExpanded || !isCompactMode) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                            <div className="space-y-2 sm:space-y-3 pt-2 border-t-2 border-border border-dashed mt-2">
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" strokeWidth={2} />
                                            <span className="font-bold font-mono text-foreground">{card.date}</span>
                                        </div>
                                        <div className={cn(
                                            "px-1 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wide border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                                            card.priority === 'high'
                                                ? "bg-red-100 text-red-700 border-red-700"
                                                : "bg-blue-100 text-blue-700 border-blue-700"
                                        )}>
                                            {card.priority === 'high' ? 'Urgente' : 'Normal'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" strokeWidth={2.5} />
                                            <span className="font-black text-emerald-700 font-mono">{card.value}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center text-[7px] sm:text-[8px] font-bold">
                                            RS
                                        </div>
                                    </div>
                                    <span className="text-[8px] sm:text-[10px] text-foreground font-bold uppercase hover:underline decoration-2 underline-offset-2">Ver detalhes</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export function KanbanCard({ card }: CardProps) {
    const { setSelectedCard } = useKanbanStore()
    const [isExpanded, setIsExpanded] = useState(false)
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: card.id,
    })

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            opacity: isDragging ? 0 : 1, // Hide original when dragging, overlay will show
        }
        : undefined

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="touch-none" // Prevent touch scrolling while dragging
        >
            <CardContent
                card={card}
                onClick={() => setSelectedCard(card)}
                onExpand={handleExpand}
                isExpanded={isExpanded}
            />
        </div>
    )
}
