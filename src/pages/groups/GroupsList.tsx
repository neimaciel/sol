import { useEffect, useState } from 'react'
import { useGroupsStore, type Group } from '@/store/useGroupsStore'
import { GroupFormModal } from './GroupFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users, Filter, ArrowLeft, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function GroupsList() {
    const navigate = useNavigate()
    const { groups, fetchGroups, deleteGroup, isLoading } = useGroupsStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

    const handleEdit = (group: Group) => {
        setSelectedGroup(group)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setSelectedGroup(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este grupo?')) {
            await deleteGroup(id)
        }
    }

    useEffect(() => {
        fetchGroups()
    }, [fetchGroups])

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                            className="glass-card hover:bg-white/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Users className="w-6 h-6" />
                                </div>
                                Grupos de Motoristas
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium mt-1 ml-1">
                                Gerencie seus grupos de distribuição
                            </p>
                        </div>
                    </div>

                    <Button
                        className="bg-primary hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 font-medium px-6 gap-2"
                        onClick={handleCreate}
                    >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Novo Grupo
                    </Button>
                </div>

                <div className="glass-card p-6 rounded-2xl border-white/40 shadow-xl shadow-blue-900/5 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            className="input-soft pl-11 h-12 border-gray-200/50 bg-white/50 focus:bg-white/80 transition-all"
                            placeholder="Buscar grupos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="glass-card hover:bg-white/60 h-12 w-12">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                    </Button>
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
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredGroups.map((group, index) => (
                                <motion.div
                                    key={group.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-2xl border-white/40"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-heading font-bold text-foreground mb-1">{group.name}</h3>
                                            <span className="px-2.5 py-1 rounded-md bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/50">
                                                {group.type}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={() => handleEdit(group)}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(group.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                                        {group.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="w-4 h-4 text-primary/70" />
                                            <span className="text-sm font-medium">{group.membersCount} membros</span>
                                        </div>
                                        <Button
                                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 gap-2 h-8 text-xs font-bold border border-emerald-200/50 shadow-sm"
                                            onClick={() => handleEdit(group)}
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Abrir
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <GroupFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupToEdit={selectedGroup}
            />
        </motion.div>
    )
}
