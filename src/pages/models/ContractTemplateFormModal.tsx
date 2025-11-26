import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContractTemplatesStore, type ContractTemplate } from '@/store/useContractTemplatesStore'

interface ContractTemplateFormModalProps {
    isOpen: boolean
    onClose: () => void
    templateToEdit?: ContractTemplate | null
}

export function ContractTemplateFormModal({ isOpen, onClose, templateToEdit }: ContractTemplateFormModalProps) {
    const { addTemplate, updateTemplate } = useContractTemplatesStore()
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState<Omit<ContractTemplate, 'id' | 'created_at'>>({
        name: '',
        description: '',
        category: 'Carreta',
        content: '',
        is_active: true
    })

    useEffect(() => {
        if (templateToEdit) {
            setFormData({
                name: templateToEdit.name,
                description: templateToEdit.description || '',
                category: templateToEdit.category || 'Carreta',
                content: templateToEdit.content,
                is_active: templateToEdit.is_active
            })
        } else {
            setFormData({
                name: '',
                description: '',
                category: 'Carreta',
                content: '',
                is_active: true
            })
        }
    }, [templateToEdit, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (templateToEdit) {
                await updateTemplate(templateToEdit.id, formData)
            } else {
                await addTemplate(formData)
            }
            onClose()
        } catch (error) {
            console.error('Error saving template:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card sm:max-w-[600px] border-white/40 shadow-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                        {templateToEdit ? 'Editar Modelo de Contrato' : 'Novo Modelo de Contrato'}
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
                            placeholder="Ex: Contrato Padrão Carreta"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                                Categoria
                            </Label>
                            <Select
                                value={formData.category || 'Carreta'}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="Carreta">Carreta</SelectItem>
                                    <SelectItem value="Truck">Truck</SelectItem>
                                    <SelectItem value="Vuc">Vuc</SelectItem>
                                    <SelectItem value="Van">Van</SelectItem>
                                    <SelectItem value="Bitrem">Bitrem</SelectItem>
                                    <SelectItem value="Outros">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                            Descrição
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Breve descrição do modelo..."
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80 min-h-[60px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-sm font-medium text-muted-foreground">
                            Conteúdo do Contrato
                        </Label>
                        <div className="text-xs text-muted-foreground/70 mb-2">
                            Variáveis disponíveis: {'{{driver_name}}'}, {'{{driver_cpf}}'}, {'{{origin}}'}, {'{{destination}}'}, {'{{value}}'}
                        </div>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Digite o texto do contrato aqui..."
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80 min-h-[200px] font-mono text-sm"
                            required
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
                                templateToEdit ? 'Salvar Alterações' : 'Criar Modelo'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
