import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProductTemplatesStore, type ProductTemplate } from '@/store/useProductTemplatesStore'

interface ProductTemplateFormModalProps {
    isOpen: boolean
    onClose: () => void
    templateToEdit?: ProductTemplate | null
}

export function ProductTemplateFormModal({ isOpen, onClose, templateToEdit }: ProductTemplateFormModalProps) {
    const { addTemplate, updateTemplate } = useProductTemplatesStore()
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState<Omit<ProductTemplate, 'id' | 'created_at'>>({
        name: '',
        description: '',
        product_type: 'Soja',
        requirements: '',
        is_active: true
    })

    useEffect(() => {
        if (templateToEdit) {
            setFormData({
                name: templateToEdit.name,
                description: templateToEdit.description || '',
                product_type: templateToEdit.product_type || 'Soja',
                requirements: templateToEdit.requirements || '',
                is_active: templateToEdit.is_active
            })
        } else {
            setFormData({
                name: '',
                description: '',
                product_type: 'Soja',
                requirements: '',
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
                        {templateToEdit ? 'Editar Modelo de Produto' : 'Novo Modelo de Produto'}
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
                            placeholder="Ex: Soja Padrão Exportação"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="product_type" className="text-sm font-medium text-muted-foreground">
                                Tipo de Produto
                            </Label>
                            <Select
                                value={formData.product_type}
                                onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                            >
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="Soja">Soja</SelectItem>
                                    <SelectItem value="Milho">Milho</SelectItem>
                                    <SelectItem value="Fertilizante">Fertilizante</SelectItem>
                                    <SelectItem value="Trigo">Trigo</SelectItem>
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
                        <Label htmlFor="requirements" className="text-sm font-medium text-muted-foreground">
                            Requisitos Específicos
                        </Label>
                        <div className="text-xs text-muted-foreground/70 mb-2">
                            Descreva os requisitos de qualidade, umidade, impurezas, etc.
                        </div>
                        <Textarea
                            id="requirements"
                            value={formData.requirements || ''}
                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                            placeholder="Ex: Umidade máx 14%, Impurezas máx 1%..."
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80 min-h-[150px] font-mono text-sm"
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
