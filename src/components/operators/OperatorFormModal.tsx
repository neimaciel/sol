import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOperatorsStore, type Operator } from '@/store/useOperatorsStore'
import { useState, useEffect } from 'react'

interface OperatorFormModalProps {
    isOpen: boolean
    onClose: () => void
    operator?: Operator | null
}

export function OperatorFormModal({ isOpen, onClose, operator }: OperatorFormModalProps) {
    const { addOperator, updateOperator } = useOperatorsStore()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Junior' as 'Senior' | 'Pleno' | 'Junior',
        status: 'active' as 'active' | 'inactive',
        lastAccess: ''
    })

    useEffect(() => {
        if (operator) {
            setFormData({
                name: operator.name,
                email: operator.email,
                role: operator.role,
                status: operator.status,
                lastAccess: operator.lastAccess
            })
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'Junior',
                status: 'active',
                lastAccess: new Date().toISOString()
            })
        }
    }, [operator, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (operator) {
            updateOperator(operator.id, formData)
        } else {
            addOperator(formData)
        }

        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card max-w-lg border-white/40 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                        {operator ? 'Editar Operador' : 'Novo Operador'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Carlos Mendes"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="carlos@sol.com"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-sm font-medium text-muted-foreground">Nível</Label>
                            <Select value={formData.role} onValueChange={(value: 'Senior' | 'Pleno' | 'Junior') => setFormData({ ...formData, role: value })}>
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="Junior">Junior</SelectItem>
                                    <SelectItem value="Pleno">Pleno</SelectItem>
                                    <SelectItem value="Senior">Senior</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status</Label>
                            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="inactive">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 hover:bg-white/40 text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20">
                            {operator ? 'Salvar Alterações' : 'Cadastrar Operador'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
