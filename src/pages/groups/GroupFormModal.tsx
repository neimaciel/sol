import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGroupsStore, type Group } from '@/store/useGroupsStore'

interface GroupFormModalProps {
    isOpen: boolean
    onClose: () => void
    groupToEdit?: Group | null
}

export function GroupFormModal({ isOpen, onClose, groupToEdit }: GroupFormModalProps) {
    const { addGroup, updateGroup } = useGroupsStore()
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState<Omit<Group, 'id' | 'membersCount'>>({
        name: '',
        type: 'Frota Própria',
        region: '',
        description: '',
        whatsappLink: ''
    })

    useEffect(() => {
        if (groupToEdit) {
            setFormData({
                name: groupToEdit.name,
                type: groupToEdit.type,
                region: groupToEdit.region || '',
                description: groupToEdit.description,
                whatsappLink: groupToEdit.whatsappLink || ''
            })
        } else {
            setFormData({
                name: '',
                type: 'Frota Própria',
                region: '',
                description: '',
                whatsappLink: ''
            })
        }
    }, [groupToEdit, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let whatsappId = null

            // Extract JID if link is provided and different from existing (or new group)
            if (formData.whatsappLink && (!groupToEdit || formData.whatsappLink !== groupToEdit.whatsappLink)) {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                    const response = await fetch(`${apiUrl}/api/v1/whatsapp/extract-group-jid`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ invite_link: formData.whatsappLink })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        if (data.success && data.jid) {
                            whatsappId = data.jid
                        }
                    } else {
                        console.warn('Failed to extract WhatsApp ID from link')
                        alert('Aviso: Não foi possível extrair o ID do grupo do WhatsApp automaticamente. Verifique se o link está correto.')
                    }
                } catch (error) {
                    console.error('Error extracting WhatsApp ID:', error)
                }
            } else if (groupToEdit && formData.whatsappLink === groupToEdit.whatsappLink) {
                // Keep existing ID if link hasn't changed
                whatsappId = groupToEdit.whatsappId
            }

            const groupData = {
                ...formData,
                whatsappId: whatsappId // Add the extracted ID to the data being saved
            }

            if (groupToEdit) {
                await updateGroup(groupToEdit.id, groupData)
            } else {
                await addGroup(groupData)
            }
            onClose()
        } catch (error) {
            console.error('Error saving group:', error)
            alert('Erro ao salvar grupo')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card sm:max-w-[500px] border-white/40 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                        {groupToEdit ? 'Editar Grupo' : 'Novo Grupo de Motoristas'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                            Nome do Grupo
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Frota SP - Zona Sul"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium text-muted-foreground">
                                Tipo
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: "Frota Própria" | "Agregados" | "Terceiros") => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    <SelectItem value="Frota Própria">Frota Própria</SelectItem>
                                    <SelectItem value="Agregados">Agregados</SelectItem>
                                    <SelectItem value="Terceiros">Terceiros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="region" className="text-sm font-medium text-muted-foreground">
                                Região
                            </Label>
                            <Input
                                id="region"
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                placeholder="Ex: São Paulo, SP"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                            Descrição
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o propósito deste grupo..."
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80 min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsappLink" className="text-sm font-medium text-muted-foreground">
                            Link do WhatsApp
                        </Label>
                        <Input
                            id="whatsappLink"
                            value={formData.whatsappLink || ''}
                            onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
                            placeholder="https://chat.whatsapp.com/..."
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            type="url"
                        />
                        <p className="text-xs text-muted-foreground/70">Link do grupo de WhatsApp para divulgação de cargas</p>
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
                                groupToEdit ? 'Salvar Alterações' : 'Criar Grupo'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
