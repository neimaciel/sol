import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOperatorsStore, type Operator } from '@/store/useOperatorsStore'
import { OperatorFormModal } from '@/components/operators/OperatorFormModal'
import { useState, useEffect } from 'react'

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
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="glass-card hover:bg-gray-100/60"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Operadores</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                {operators.length} operadores cadastrados
                            </p>
                        </div>
                    </div>
                    <Button className="btn-soft-blue gap-2" onClick={handleCreate}>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Novo Operador
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="glass-card p-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            className="input-soft pl-11 h-12 border-gray-200/50"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card overflow-hidden animate-fade-in">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-200/50 hover:bg-transparent">
                                <TableHead className="text-gray-600 font-bold">Nome</TableHead>
                                <TableHead className="text-gray-600 font-bold">Email</TableHead>
                                <TableHead className="text-gray-600 font-bold">Nível</TableHead>
                                <TableHead className="text-gray-600 font-bold">Status</TableHead>
                                <TableHead className="text-gray-600 font-bold">Último Acesso</TableHead>
                                <TableHead className="text-gray-600 font-bold">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOperators.map((operator) => (
                                <TableRow key={operator.id} className="border-gray-200/50 hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-800">{operator.name}</TableCell>
                                    <TableCell className="text-gray-600">{operator.email}</TableCell>
                                    <TableCell>
                                        <Badge className={`
                      ${operator.role === 'Senior' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                operator.role === 'Pleno' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    'bg-gray-100 text-gray-700 border-gray-200'}
                      border font-semibold
                    `}>
                                            {operator.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`
                      ${operator.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}
                      border font-semibold
                    `}>
                                            {operator.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600 text-sm">
                                        {new Date(operator.lastAccess).toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 glass-card border-gray-200/50 hover:bg-gray-100/60"
                                                onClick={() => handleEdit(operator)}
                                            >
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 glass-card border-gray-200/50 hover:bg-red-50 hover:border-red-200"
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
        </div>
    )
}
