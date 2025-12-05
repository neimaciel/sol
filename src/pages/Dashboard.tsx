import { useState, useEffect } from 'react'
import { KanbanBoard } from '@/components/kanban/Board'
import { CardModal } from '@/components/card/CardModal'
import { CardFormModal } from '@/components/kanban/CardFormModal'
import { useKanbanStore } from '@/store/useKanbanStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Settings, User, Plus, LayoutGrid, Truck, Users as UsersIcon, TrendingUp, Search, ChevronLeft, ChevronRight, Bot, Smartphone } from 'lucide-react'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RevenueChart, TripsChart, FunnelChart } from '@/components/dashboard/Charts'
import { motion, AnimatePresence } from 'framer-motion'
import { ModeToggle } from '@/components/mode-toggle'

export default function Dashboard() {
    const { selectedCard, setSelectedCard, activeTab, fetchCards } = useKanbanStore()
    const [showCardForm, setShowCardForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCollapsed, setIsCollapsed] = useState(true)
    const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(true)

    useEffect(() => {
        fetchCards()
        const unsubscribe = useKanbanStore.getState().subscribeToCards()
        return () => unsubscribe()
    }, [fetchCards])

    const NavItem = ({ href, icon: Icon, label, isActive = false }: { href?: string, icon: any, label: string, isActive?: boolean }) => (
        <a
            href={href}
            className={`
                relative flex items-center transition-all duration-200 group
                ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full h-12 px-4 gap-3'}
                ${isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                    : 'hover:bg-gray-200 dark:hover:bg-zinc-800 text-black dark:text-white border-2 border-transparent hover:border-black dark:hover:border-white'}
            `}
            title={isCollapsed ? label : undefined}
        >
            <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-medium whitespace-nowrap overflow-hidden text-sm"
                >
                    {label}
                </motion.span>
            )}
            {isActive && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 border-2 border-black dark:border-white pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}
        </a>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex overflow-hidden bg-background"
        >
            {/* Sidebar Navigation */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                className="bg-card m-4 flex flex-col py-6 border-2 border-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] shrink-0 z-20 relative"
            >
                {/* Logo */}
                <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
                    <div className="icon-3d w-10 h-10 shrink-0">
                        <Truck className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex flex-col overflow-hidden"
                            >
                                <span className="font-heading font-black text-foreground text-xl leading-none tracking-tight uppercase">S.O.L.</span>
                                <span className="text-[10px] text-foreground font-bold uppercase tracking-wider mt-1 border-t-2 border-border pt-1">Logística Inteligente</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Icons */}
                <nav className="flex-1 flex flex-col space-y-2 px-3">
                    <NavItem href="/" icon={LayoutGrid} label="Dashboard" isActive={true} />
                    <NavItem href="/drivers" icon={Truck} label="Motoristas" />
                    <NavItem href="/operators" icon={UsersIcon} label="Operadores" />
                    <NavItem href="/groups" icon={UsersIcon} label="Grupos" />
                    <NavItem href="/models" icon={Settings} label="Modelos" />
                    <NavItem href="/history" icon={TrendingUp} label="Histórico" />
                    <div className="h-px bg-border my-2" />
                    <NavItem href="/agent-admin" icon={Bot} label="Inteligência Artificial" />
                    <NavItem href="/admin/whatsapp" icon={Smartphone} label="WhatsApp" />
                </nav>

                {/* Bottom Icons */}
                <div className="space-y-4 mt-auto pt-6 px-3 border-t border-white/10">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`
                            flex items-center transition-all duration-200 group
                            ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full h-12 px-4 gap-3'}
                            hover:bg-accent text-foreground border-2 border-transparent hover:border-border
                        `}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <ChevronLeft className="w-5 h-5" />
                        )}
                        {!isCollapsed && <span className="font-medium text-sm">Recolher Menu</span>}
                    </button>

                    <div className={`
                        flex items-center gap-3 p-2 border-2 border-border bg-muted
                        ${isCollapsed ? 'justify-center' : ''}
                    `}>
                        <div className="w-9 h-9 border-2 border-border bg-card flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-foreground" strokeWidth={2} />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-foreground truncate uppercase">Admin User</span>
                                <span className="text-[10px] text-muted-foreground font-mono truncate">admin@sol.com</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between bg-card border-b-2 border-border sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-heading font-black text-foreground tracking-tight uppercase">Dashboard</h1>
                        <div className="h-8 w-0.5 bg-border" />
                        <p className="text-sm text-muted-foreground font-bold uppercase">Visão Geral da Operação</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground group-focus-within:text-foreground transition-colors" />
                            <Input
                                placeholder="BUSCAR CARGAS..."
                                className="pl-10 w-72 bg-card border-2 border-border focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all placeholder:text-muted-foreground font-mono text-sm uppercase"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ModeToggle />
                        <Button size="icon" variant="ghost" className="hover:bg-accent text-foreground border-2 border-transparent hover:border-border transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 border border-border" />
                        </Button>
                        <Button
                            className="bg-foreground hover:bg-foreground/90 text-background border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 transition-all font-bold px-6 uppercase"
                            onClick={() => setShowCardForm(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Carga
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 space-y-8 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {/* Analytics Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Analytics Header & Toggle */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-black text-foreground uppercase flex items-center gap-2">
                                <div className="p-1.5 bg-foreground text-background border-2 border-border">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                Analytics em Tempo Real
                            </h2>
                            <button
                                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                                className="w-8 h-8 bg-card border-2 border-border hover:bg-accent flex items-center justify-center transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-0.5"
                                title={isAnalyticsExpanded ? "Recolher Analytics" : "Expandir Analytics"}
                            >
                                <ChevronRight className={`w-4 h-4 text-foreground transition-transform duration-300 ${isAnalyticsExpanded ? 'rotate-90' : ''}`} />
                            </button>
                        </div>

                        <AnimatePresence>
                            {isAnalyticsExpanded ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-6 overflow-hidden"
                                >
                                    {/* Full Stats */}
                                    <StatsCards />

                                    {/* Charts Grid */}
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="bg-card border-2 border-border shadow-brutal p-6"
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-sm font-bold text-foreground">Faturamento Semanal</h3>
                                                <p className="text-xs text-muted-foreground font-medium mt-1">Últimos 7 dias</p>
                                            </div>
                                            <RevenueChart />
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="bg-card border-2 border-border shadow-brutal p-6"
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-sm font-bold text-foreground">Viagens por Período</h3>
                                                <p className="text-xs text-muted-foreground font-medium mt-1">Últimas 4 semanas</p>
                                            </div>
                                            <TripsChart />
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="bg-card border-2 border-border shadow-brutal p-6"
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-sm font-bold text-foreground">Funil de Conversão</h3>
                                                <p className="text-xs text-muted-foreground font-medium mt-1">Ofertas vs Conclusão</p>
                                            </div>
                                            <FunnelChart />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Collapsed Summary View */
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-card border-2 border-border shadow-brutal p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-12 px-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Faturamento</p>
                                            <p className="text-xl font-heading font-bold text-foreground">R$ 45.2k <span className="text-xs text-emerald-500 font-medium ml-1 bg-emerald-50 px-1.5 py-0.5 border-2 border-emerald-200">+20.1%</span></p>
                                        </div>
                                        <div className="h-10 w-0.5 bg-border" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Viagens</p>
                                            <p className="text-xl font-heading font-bold text-foreground">12 <span className="text-xs text-emerald-500 font-medium ml-1 bg-emerald-50 px-1.5 py-0.5 border-2 border-emerald-200">+4</span></p>
                                        </div>
                                        <div className="h-10 w-0.5 bg-border" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Motoristas</p>
                                            <p className="text-xl font-heading font-bold text-foreground">24 <span className="text-xs text-red-500 font-medium ml-1 bg-red-50 px-1.5 py-0.5 border-2 border-red-200">-2</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-foreground font-bold uppercase bg-muted px-3 py-1.5 border-2 border-border">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Visão Resumida</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Kanban Section - Infinite Scroll */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-heading font-black text-foreground uppercase">Pipeline de Cargas</h3>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={useKanbanStore.getState().toggleCompactMode}
                                    className="h-8 text-xs font-bold uppercase"
                                >
                                    {useKanbanStore((state) => state.isCompactMode) ? (
                                        <>
                                            <LayoutGrid className="w-3 h-3 mr-2" />
                                            Expandir
                                        </>
                                    ) : (
                                        <>
                                            <LayoutGrid className="w-3 h-3 mr-2" />
                                            Compactar
                                        </>
                                    )}
                                </Button>
                                <div className="bg-card px-4 py-2 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                                    <span className="text-xs text-foreground font-bold uppercase">
                                        <span className="text-foreground font-black text-sm">12</span> cargas ativas
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Infinite Width Container */}
                        <div className="bg-muted/10 border-2 border-border p-1 overflow-x-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                            <div className="min-w-fit p-4">
                                <KanbanBoard />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modals */}
            <CardModal
                card={selectedCard}
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                defaultTab={activeTab}
            />
            <CardFormModal
                isOpen={showCardForm}
                onClose={() => setShowCardForm(false)}
            />
        </motion.div>
    )
}
