import { DriverCard } from '@/components/drivers/DriverCard'
import { DriverFormModal } from '@/components/drivers/DriverFormModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, ArrowLeft, Trash2, Edit, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDriversStore, type Driver } from '@/store/useDriversStore'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DriversList() {
    const navigate = useNavigate()
    const { drivers, fetchDrivers, deleteDriver, subscribeToDrivers } = useDriversStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDriver, setEditingDriver] = useState<Driver | undefined>(undefined)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchDrivers()
        const unsubscribe = subscribeToDrivers()
        return () => unsubscribe()
    }, [fetchDrivers, subscribeToDrivers])

    const handleCreate = () => {
        setEditingDriver(undefined)
        setIsModalOpen(true)
    }

    const handleEdit = (driver: Driver) => {
        setEditingDriver(driver)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este motorista?')) {
            deleteDriver(id)
        }
    }

    const filteredDrivers = drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen p-8"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
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
                                    <Truck className="w-6 h-6" />
                                </div>
                                Motoristas
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium mt-1 ml-1">
                                Gerencie sua frota de {drivers.length} motoristas
                            </p>
                        </div>
                    </div>
                    <Button className="bg-primary hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 font-medium px-6 gap-2" onClick={handleCreate}>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Novo Motorista
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="glass-card p-6 rounded-2xl border-white/40 shadow-xl shadow-blue-900/5">
                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                className="input-soft pl-11 h-12 border-gray-200/50 bg-white/50 focus:bg-white/80 transition-all"
                                placeholder="Buscar por nome, veículo ou local..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredDrivers.map((driver, index) => (
                            <motion.div
                                key={driver.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative group"
                            >
                                <DriverCard driver={driver} />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm backdrop-blur-sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleEdit(driver)
                                        }}
                                    >
                                        <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8 shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(driver.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                <DriverFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    driver={editingDriver}
                />
            </div>
        </motion.div>
    )
}
