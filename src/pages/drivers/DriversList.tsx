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
            className="min-h-screen p-8 bg-background"
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="rounded-none border-2 border-transparent hover:border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-heading font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
                                <div className="p-2 rounded-none bg-primary/10 text-primary border-2 border-primary shadow-brutal-sm">
                                    <Truck className="w-6 h-6" />
                                </div>
                                Motoristas
                            </h1>
                            <p className="text-sm text-muted-foreground font-bold mt-1 ml-1 uppercase">
                                Gerencie sua frota de {drivers.length} motoristas
                            </p>
                        </div>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none border-2 border-primary shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold px-6 gap-2 uppercase"
                        onClick={handleCreate}
                    >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Novo Motorista
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="bg-card p-6 rounded-none border-2 border-border shadow-brutal">
                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                className="pl-11 h-12 rounded-none border-2 border-border bg-background focus:shadow-brutal transition-all font-mono text-sm uppercase placeholder:normal-case"
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
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 rounded-none border-2 border-border shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
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
                                        className="h-8 w-8 rounded-none border-2 border-destructive shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
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
