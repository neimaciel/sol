import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, ArrowLeft, Edit, Trash2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOperatorsStore, type Operator } from '@/store/useOperatorsStore'
import { OperatorFormModal } from '@/components/operators/OperatorFormModal'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function OperatorsList() {
    const navigate = useNavigate()
    const { operators, fetchOperators, deleteOperator, subscribeToOperators } = useOperatorsStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchOperators()
        const unsubscribe = subscribeToOperators()
        return () => unsubscribe()
    }, [fetchOperators, subscribeToOperators])

    const handleCreate = () => {
        setEditingOperator(null)
        setIsModalOpen(true)
    }

    const handleEdit = (operator: Operator) => {
        setEditingOperator(operator)
        setIsModalOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este operador?')) {
            deleteOperator(id)
        }
    }

    const filteredOperators = operators.filter(operator =>
        operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen p-8 bg-background"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="rounded-none border-2 border-transparent hover:border-border hover:bg-accent transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3 uppercase">
                                <div className="p-2 rounded-none bg-primary/10 text-primary border-2 border-primary shadow-brutal-sm">
                                    <Users className="w-6 h-6" />
                                </div>
                                Operadores
                            </h1>
                            <p className="text-sm text-muted-foreground font-bold mt-1 ml-1 uppercase">
                                {operators.length} operadores cadastrados
                            </p>
                        </div>
                    </div>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none border-2 border-primary shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold gap-2 uppercase"
                        onClick={handleCreate}
                    >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Novo Operador
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="bg-card p-6 rounded-none border-2 border-border shadow-brutal">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="pl-11 h-12 rounded-none border-2 border-border bg-background focus:shadow-brutal transition-all font-mono text-sm uppercase placeholder:normal-case"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-none border-2 border-border shadow-brutal overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-2 border-border hover:bg-transparent bg-muted/30">
                                <TableHead className="text-foreground font-black uppercase">Nome</TableHead>
                                <TableHead className="text-foreground font-black uppercase">Email</TableHead>
                                <TableHead className="text-foreground font-black uppercase">Nível</TableHead>
                                <TableHead className="text-foreground font-black uppercase">Status</TableHead>
                                <TableHead className="text-foreground font-black uppercase">Último Acesso</TableHead>
                                <TableHead className="text-foreground font-black uppercase">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOperators.map((operator) => (
                                <TableRow key={operator.id} className="border-b border-border hover:bg-muted/10">
                                    <TableCell className="font-bold text-foreground uppercase">{operator.name}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-sm">{operator.email}</TableCell>
                                    <TableCell>
                                        <Badge className={`
                      ${operator.role === 'Senior' ? 'bg-purple-100 text-purple-900 border-purple-900' :
                                                operator.role === 'Pleno' ? 'bg-blue-100 text-blue-900 border-blue-900' :
                                                    'bg-gray-100 text-gray-900 border-gray-900'}
                      border-2 font-bold rounded-none uppercase
                    `}>
                                            {operator.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`
                      ${operator.status === 'active' ? 'bg-emerald-100 text-emerald-900 border-emerald-900' : 'bg-red-100 text-red-900 border-red-900'}
                      border-2 font-bold rounded-none uppercase
                    `}>
                                            {operator.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm font-mono">
                                        {new Date(operator.lastAccess).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border-2 border-border shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                                onClick={() => handleEdit(operator)}
                                            >
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-none border-2 border-destructive shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                                onClick={() => handleDelete(operator.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <OperatorFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    operator={editingOperator}
                />
            </div>
        </motion.div>
    )
}
