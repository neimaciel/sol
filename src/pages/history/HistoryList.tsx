import { useEffect, useState } from 'react'
import { useHistoryStore } from '@/store/useHistoryStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, ArrowLeft, Download, Calendar, History, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

export default function HistoryList() {
    const navigate = useNavigate()
    const { history, fetchHistory, isLoading } = useHistoryStore()
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const filteredHistory = history.filter(item =>
        item.loadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destination.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Nova oferta': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'Atendimento': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'Documentação': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'Finalizada': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    const handleExport = () => {
        const headers = ['ID', 'Tipo', 'Status', 'Origem', 'Destino', 'Valor', 'Data']
        const csvContent = [
            headers.join(','),
            ...filteredHistory.map(item => [
                item.loadId,
                item.type,
                item.status,
                `"${item.origin}"`,
                `"${item.destination}"`,
                `"${item.value}"`,
                new Date(item.date).toLocaleDateString('pt-BR')
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `historico_cargas_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex flex-col bg-background"
        >
            {/* Header */}
            <header className="m-8 mb-0 shrink-0">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="bg-background border-2 border-muted-foreground/40 hover:border-foreground hover:bg-accent text-muted-foreground hover:text-foreground transition-all rounded-none h-10 w-10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <History className="w-6 h-6" />
                                </div>
                                Histórico de Cargas
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium mt-1 ml-1">
                                Registro completo de todas as operações
                            </p>
                        </div>
                    </div>

                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-foreground shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none font-bold px-6 gap-2"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </Button>
                </div>

                <div className="bg-background border-2 border-foreground shadow-brutal p-4 flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px] group">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            className="input-soft pl-11 h-10 border-2 border-muted-foreground/40 bg-muted/10 focus:bg-background focus:border-primary transition-all rounded-none"
                            placeholder="Buscar cargas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted/10 border-2 border-muted-foreground/40 p-1">
                        <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 rounded-none">Mais recentes</Button>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/10 border-2 border-muted-foreground/40 px-3 py-2 min-w-[200px] h-10">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Selecione o período</span>
                    </div>

                    <Button variant="outline" size="icon" className="bg-background border-2 border-muted-foreground/40 hover:border-primary hover:text-primary h-10 w-10 rounded-none shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        <Filter className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2 px-3">
                        <input type="checkbox" className="rounded-none border-2 border-muted-foreground text-primary focus:ring-primary h-4 w-4" />
                        <span className="text-xs text-muted-foreground font-bold uppercase">Mostrar Arquivados</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="space-y-3"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredHistory.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-card border-2 border-border shadow-brutal p-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-200 group rounded-none"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono font-bold text-foreground bg-secondary px-2 py-1 border-2 border-border">
                                                {item.loadId}
                                            </span>
                                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-2 border-border font-bold text-[10px] uppercase tracking-wider rounded-none">
                                                {item.type}
                                            </Badge>
                                            <Badge className={`${getStatusColor(item.status)} border-2 font-bold shadow-sm rounded-none`}>
                                                {item.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4 items-center">
                                        <div className="col-span-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm uppercase">{item.origin}</span>
                                                <span className="text-xs text-muted-foreground uppercase">➔ {item.destination}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-muted border-2 border-border flex items-center justify-center rounded-none">
                                                    <User className="w-3 h-3" />
                                                </div>
                                                <span className="font-medium text-sm uppercase">Motorista</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {item.value}
                                            </span>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground font-mono">
                                            {new Date(item.date).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
