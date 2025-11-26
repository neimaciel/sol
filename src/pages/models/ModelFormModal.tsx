import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useModelsStore, type LoadModel } from '@/store/useModelsStore'

interface ModelFormModalProps {
    isOpen: boolean
    onClose: () => void
    modelToEdit?: LoadModel | null
}

export function ModelFormModal({ isOpen, onClose, modelToEdit }: ModelFormModalProps) {
    const { addModel, updateModel } = useModelsStore()
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState<Omit<LoadModel, 'id' | 'createdAt' | 'usageCount'>>({
        name: '',
        type: 'Carga Geral',
        vehicleType: 'Carreta',
        origin: '',
        destination: '',
        description: ''
    })

    useEffect(() => {
        if (modelToEdit) {
            setFormData({
                name: modelToEdit.name,
                type: modelToEdit.type,
                vehicleType: modelToEdit.vehicleType,
                origin: modelToEdit.origin,
                destination: modelToEdit.destination,
                description: modelToEdit.description
            })
        } else {
            setFormData({
                name: '',
                type: 'Carga Geral',
                vehicleType: 'Carreta',
                origin: '',
                destination: '',
                description: ''
            })
        }
    }, [modelToEdit, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (modelToEdit) {
                await updateModel(modelToEdit.id, formData)
            } else {
                await addModel(formData)
            }
            onClose()
        } catch (error) {
            console.error('Error saving model:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card sm:max-w-[600px] border-white/40 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                        {modelToEdit ? 'Editar Modelo' : 'Novo Modelo de Carga'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                            Nome do Modelo
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Rota Sul - Refrigerada"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium text-muted-foreground">
                                Tipo de Carga
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: "Carga Geral" | "Refrigerada" | "Fracionada" | "Granel") => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="Carga Geral">Carga Geral</SelectItem>
                                    <SelectItem value="Refrigerada">Refrigerada</SelectItem>
                                    <SelectItem value="Fracionada">Fracionada</SelectItem>
                                    <SelectItem value="Granel">Granel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicleType" className="text-sm font-medium text-muted-foreground">
                                Veículo
                            </Label>
                            <Select
                                value={formData.vehicleType}
                                onValueChange={(value: "Carreta" | "Truck" | "Toco" | "VUC") => setFormData({ ...formData, vehicleType: value })}
                            >
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione o veículo" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="Carreta">Carreta</SelectItem>
                                    <SelectItem value="Truck">Truck</SelectItem>
                                    <SelectItem value="Toco">Toco</SelectItem>
                                    <SelectItem value="VUC">VUC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="origin" className="text-sm font-medium text-muted-foreground">
                                Origem Padrão
                            </Label>
                            <Input
                                id="origin"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                placeholder="Ex: São Paulo, SP"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destination" className="text-sm font-medium text-muted-foreground">
                                Destino Padrão
                            </Label>
                            <Input
                                id="destination"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                placeholder="Ex: Curitiba, PR"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                            Descrição / Observações
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes adicionais sobre este modelo de carga..."
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="hover:bg-white/40 text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary-600 text-white min-w-[120px] shadow-lg shadow-primary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                modelToEdit ? 'Salvar Alterações' : 'Criar Modelo'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
