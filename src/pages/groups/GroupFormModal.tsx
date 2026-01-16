import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGroupsStore, type Group } from '@/store/useGroupsStore'
import { validateForm } from '@/lib/validation'

interface GroupFormModalProps {
    isOpen: boolean
    onClose: () => void
    groupToEdit?: Group | null
}

export function GroupFormModal({ isOpen, onClose, groupToEdit }: GroupFormModalProps) {
    const { addGroup, updateGroup } = useGroupsStore()
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

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

        // Validate form
        const { isValid, errors: validationErrors } = validateForm(formData, [
            { field: 'name', required: true, minLength: 3, message: 'Nome do grupo é obrigatório (mínimo 3 caracteres)' },
            { field: 'region', required: true, message: 'Região é obrigatória' },
            { field: 'description', required: true, minLength: 10, message: 'Descrição é obrigatória (mínimo 10 caracteres)' },
            {
                field: 'whatsappLink',
                pattern: /^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{22}$/,
                message: 'Link do WhatsApp inválido (formato: https://chat.whatsapp.com/XXX)'
            }
        ])

        if (!isValid) {
            setErrors(validationErrors)
            return
        }

        // Clear errors if validation passed
        setErrors({})
        setIsLoading(true)

        try {
            let whatsappId = null

            // Extract JID from WhatsApp invite link if provided and changed
            if (formData.whatsappLink && (!groupToEdit || formData.whatsappLink !== groupToEdit.whatsappLink)) {
                try {
                    // Extract invite code from link (last 22 characters after last /)
                    const linkParts = formData.whatsappLink.split('/')
                    const inviteCode = linkParts[linkParts.length - 1]?.trim()

                    if (inviteCode && inviteCode.length === 22 && /^[a-zA-Z0-9]{22}$/.test(inviteCode)) {
                        const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL
                        const evolutionApiKey = import.meta.env.VITE_EVOLUTION_API_KEY
                        const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME

                        if (!evolutionApiUrl || !evolutionApiKey || !instanceName) {
                            console.error('❌ Missing Evolution API environment variables')
                            throw new Error('Missing Evolution API configuration')
                        }

                        const response = await fetch(`${evolutionApiUrl}/group/inviteInfo/${instanceName}?inviteCode=${inviteCode}`, {
                            method: 'GET',
                            headers: {
                                'apikey': evolutionApiKey,
                                'Content-Type': 'application/json'
                            }
                        })

                        if (response.ok) {
                            const data = await response.json()
                            whatsappId = data.id || data.jid
                            console.log('✅ Extracted WhatsApp Group JID:', whatsappId)
                        } else {
                            const error = await response.json()
                            console.warn('⚠️ Could not extract WhatsApp ID:', error)
                        }
                    } else {
                        console.warn('⚠️ Invalid invite code format. Expected 22 alphanumeric characters.')
                    }
                } catch (extractError) {
                    console.error('⚠️ Error extracting WhatsApp ID:', extractError)
                }
            } else if (groupToEdit && formData.whatsappLink === groupToEdit.whatsappLink) {
                // Keep existing ID if link hasn't changed
                whatsappId = groupToEdit.whatsappId
            }

            const groupData = {
                ...formData,
                whatsappId: whatsappId || undefined // Convert null to undefined for type safety
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
                    <DialogDescription className="text-muted-foreground">
                        Preencha os dados abaixo para {groupToEdit ? 'editar o' : 'criar um novo'} grupo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                            Nome do Grupo
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Frota SP - Zona Sul"
                            className={`input-soft bg-white/50 border-white/40 focus:bg-white/80 ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                        )}
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
                                name="region"
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                placeholder="Ex: São Paulo, SP"
                                className={`input-soft bg-white/50 border-white/40 focus:bg-white/80 ${errors.region ? 'border-red-500' : ''}`}
                            />
                            {errors.region && (
                                <p className="text-xs text-red-500 mt-1">{errors.region}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                            Descrição
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o propósito deste grupo..."
                            className={`input-soft bg-white/50 border-white/40 focus:bg-white/80 min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
                        />
                        {errors.description && (
                            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsappLink" className="text-sm font-medium text-muted-foreground">
                            Link do WhatsApp
                        </Label>
                        <Input
                            id="whatsappLink"
                            name="whatsappLink"
                            value={formData.whatsappLink || ''}
                            onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
                            placeholder="https://chat.whatsapp.com/..."
                            className={`input-soft bg-white/50 border-white/40 focus:bg-white/80 ${errors.whatsappLink ? 'border-red-500' : ''}`}
                            type="url"
                        />
                        {errors.whatsappLink ? (
                            <p className="text-xs text-red-500 mt-1">{errors.whatsappLink}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground/70">Link do grupo de WhatsApp para divulgação de cargas</p>
                        )}
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
