import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { KanbanCard } from '@/store/useKanbanStore'
import { useKanbanStore } from '@/store/useKanbanStore'
import { supabase } from '@/lib/supabase'
import { Calendar, DollarSign, X, Paperclip, Send, Check, AlertTriangle, FileCheck, Truck, Upload, Shield, FileSignature, ArrowRight, Box, History, MapPin, Clock, FileText, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import CandidateList from "./CandidateList"
import { VehicleRequirements } from './VehicleRequirements'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCardEventsStore } from '@/store/useCardEventsStore'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Users, Plus } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'

interface CardModalProps {
    card: KanbanCard | null
    isOpen: boolean
    onClose: () => void
    defaultTab?: string
}

export function CardModal({ card, isOpen, onClose, defaultTab = 'info' }: CardModalProps) {
    const { deleteCard, updateCard, autoAdvanceCard, activeTab, setActiveTab } = useKanbanStore()
    const { events, fetchEvents } = useCardEventsStore()

    // ... (omitted lines)

    const handleSelectCandidate = async (driverId: string) => {
        if (!card) return

        try {
            // We can reuse isUploading or create a new state, but let's use isUploading for now to block UI
            setIsUploading(true)

            // Assign driver to load and move to Contratação
            await useKanbanStore.getState()
                .assignDriver(card.id, driverId)

            alert('Motorista contratado com sucesso!')

            // Close modal or switch tab? Let's keep it open but maybe switch to contract tab
            // onClose() 
        } catch (error) {
            console.error('Error selecting candidate:', error)
            alert('Erro ao contratar motorista')
        } finally {
            setIsUploading(false)
        }
    }

    useEffect(() => {
        if (isOpen && defaultTab) {
            setActiveTab(defaultTab)
        }
    }, [isOpen, defaultTab, setActiveTab])
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Partial<KanbanCard>>({})
    const [chatMessage, setChatMessage] = useState('')

    const [selectedChatCandidate, setSelectedChatCandidate] = useState<any>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isBroadcasting, setIsBroadcasting] = useState(false)

    // WhatsApp Groups State
    const [groups, setGroups] = useState<any[]>([])
    const [showNewGroupInput, setShowNewGroupInput] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupLink, setNewGroupLink] = useState('')

    // Contract Templates State
    const [contractTemplates, setContractTemplates] = useState<any[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            fetchGroups()
            fetchContractTemplates()
        }
    }, [isOpen])

    // Auto-select assigned driver for chat
    useEffect(() => {
        const fetchAssignedCandidate = async () => {
            if (activeTab === 'chat' && !selectedChatCandidate && card?.driver && typeof card.driver !== 'string') {
                const { data } = await supabase
                    .from('candidates')
                    .select('*, driver:drivers(*)')
                    .eq('load_id', card.id)
                    .eq('driver_id', card.driver.id)
                    .single()

                if (data) {
                    setSelectedChatCandidate(data)
                }
            }
        }
        fetchAssignedCandidate()
    }, [activeTab, card, selectedChatCandidate])

    const fetchGroups = async () => {
        const { data } = await supabase.from('groups').select('*').order('name')
        if (data) setGroups(data)
    }

    const fetchContractTemplates = async () => {
        const { data } = await supabase.from('contract_templates').select('*').order('name')
        if (data) setContractTemplates(data)
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return

        let whatsappId = null

        if (newGroupLink) {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                const response = await fetch(`${apiUrl}/api/v1/whatsapp/extract-group-jid`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ invite_link: newGroupLink })
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.jid) {
                        whatsappId = data.jid
                    }
                } else {
                    console.warn('Failed to extract WhatsApp ID from link')
                    // Optional: Alert user but allow creation? Or block?
                    // Let's alert but proceed, user can edit later or it might be a manual group.
                    // Actually, the error message says "Please recadastre...", so maybe we should warn.
                }
            } catch (error) {
                console.error('Error extracting WhatsApp ID:', error)
            }
        }

        const { data } = await supabase.from('groups').insert([{
            name: newGroupName,
            type: 'Carreta', // Default
            description: 'Criado via Card',
            region: 'Nacional',
            whatsapp_link: newGroupLink || null,
            whatsapp_id: whatsappId // Save the extracted ID
        }]).select().single()

        if (data) {
            setGroups([...groups, data])
            await updateCard(card!.id, { whatsapp_group_id: data.id })
            await autoAdvanceCard(card!.id, 'whatsapp_group_created')
            setShowNewGroupInput(false)
            setNewGroupName('')
            setNewGroupLink('')

            if (newGroupLink && !whatsappId) {
                alert('Grupo criado, mas não foi possível extrair o ID do WhatsApp automaticamente. Verifique o link e tente novamente se necessário.')
            }
        }
    }

    const handleSaveContractTemplate = async () => {
        if (!card?.contract_url) return
        const name = prompt('Nome do Modelo de Contrato:')
        if (!name) return

        const { error } = await supabase.from('contract_templates').insert([{
            name,
            url: card.contract_url
        }])

        if (!error) {
            alert('Modelo salvo com sucesso!')
            fetchContractTemplates()
        }
    }

    useEffect(() => {
        if (card) {
            setFormData({
                origin: card.origin,
                destination: card.destination,
                value: card.value,

                date: card.date,
                arrival_time: card.arrival_time,
                auto_advance: card.auto_advance !== false // Default to true if undefined
            })
            fetchEvents(card.id)
        }
    }, [card, fetchEvents])

    if (!card) return null

    const handleDelete = () => {
        deleteCard(card.id)
        onClose()
    }

    const handleSave = () => {
        updateCard(card.id, formData)
        setIsEditing(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pod' | 'contract' | 'attachment') => {
        const file = e.target.files?.[0]
        if (!file) return


        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${card.id}-${type}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath)

            if (type === 'pod') {
                await updateCard(card.id, { pod_url: data.publicUrl })
                await autoAdvanceCard(card.id, 'pod_uploaded')
            } else if (type === 'contract') {
                await updateCard(card.id, { contract_url: data.publicUrl })
                await autoAdvanceCard(card.id, 'contract_uploaded')
            } else {
                alert('Arquivo enviado com sucesso!')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Erro ao enviar arquivo.')
        } finally {
            setIsUploading(false)
        }
    }





    const isNegotiationStage = ['registration', 'broadcast'].includes(card.columnId)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-background border-2 border-foreground shadow-brutal max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Detalhes da Carga {card.id}</DialogTitle>
                    <DialogDescription>
                        Gerencie detalhes da carga, candidatos, documentos e chat.
                    </DialogDescription>
                </DialogHeader>
                {/* Header */}
                <div className="px-8 py-6 border-b-2 border-border bg-background sticky top-0 z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-2 border-primary/20 font-mono tracking-wider rounded-none font-bold">
                                    CARGA-{card.id.substring(0, 4)}
                                </Badge>
                                <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold border-2 border-border rounded-none uppercase text-[10px]">Carga Completa</Badge>
                            </div>
                            <h2 className="text-2xl font-heading font-black text-foreground flex items-center gap-2 tracking-tight uppercase">
                                {card.origin} <ArrowRight className="w-5 h-5 text-muted-foreground" /> {card.destination}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 border-2 border-border shadow-sm">
                                <Switch
                                    checked={formData.auto_advance !== false}
                                    onCheckedChange={(checked) => {
                                        setFormData({ ...formData, auto_advance: checked })
                                        updateCard(card.id, { auto_advance: checked })
                                    }}
                                    id="auto-advance"
                                    className="data-[state=checked]:bg-primary border-2 border-transparent data-[state=unchecked]:bg-input"
                                />
                                <Label htmlFor="auto-advance" className="text-xs font-bold text-muted-foreground cursor-pointer uppercase tracking-wide">
                                    Automação
                                </Label>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-accent border-2 border-transparent hover:border-border w-10 h-10 transition-all rounded-none">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>


                <div className="flex h-[calc(90vh-88px)]">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-8 pt-2 border-b-2 border-border bg-muted/10">
                            <TabsList className="bg-transparent w-full justify-start h-14 p-0 space-x-8">
                                <TabsTrigger value="info" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Informações
                                </TabsTrigger>
                                <TabsTrigger value="chat" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Chat
                                </TabsTrigger>
                                <TabsTrigger value="attachments" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Anexos
                                </TabsTrigger>
                                <TabsTrigger value="timeline" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Timeline
                                </TabsTrigger>
                                <TabsTrigger value="candidates" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Candidatos
                                </TabsTrigger>

                                {/* Dynamic Tabs - Enabled for all columns as requested */}
                                <TabsTrigger value="documentation" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Documentação
                                </TabsTrigger>
                                <TabsTrigger value="risk" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Risco
                                </TabsTrigger>
                                <TabsTrigger value="contracts" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Contratos
                                </TabsTrigger>
                                <TabsTrigger value="map" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-bold text-muted-foreground hover:text-foreground transition-colors text-sm uppercase tracking-wide">
                                    Rota
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-background p-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <TabsContent value="info" className="mt-0 space-y-8">
                                        {/* Grid with origin/destination info */}
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" /> Origem
                                                </p>
                                                <div className="p-4 bg-card border-2 border-border shadow-brutal-sm">
                                                    <p className="text-lg font-heading font-bold text-foreground">CD {card.origin}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Av. Principal, 1000</p>
                                                    <p className="text-sm text-muted-foreground">{card.origin}, SP</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" /> Destino
                                                </p>
                                                <div className="p-4 bg-card border-2 border-border shadow-brutal-sm">
                                                    <p className="text-lg font-heading font-bold text-foreground">CD {card.destination}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Av. Central, 500</p>
                                                    <p className="text-sm text-muted-foreground">{card.destination}, SP</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Data de Coleta</p>
                                                <div className="flex items-center gap-2 text-foreground font-bold bg-muted/30 px-3 py-2 border-2 border-border">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    {card.date}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Data de Entrega</p>
                                                <div className="flex items-center gap-2 text-foreground font-bold bg-muted/30 px-3 py-2 border-2 border-border">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    20/03/2024
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Previsão de Chegada</p>
                                                <div className="flex items-center gap-2 text-foreground font-bold bg-muted/30 px-3 py-2 border-2 border-border">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                    {isEditing ? (
                                                        <Input
                                                            type="datetime-local"
                                                            value={formData.arrival_time || ''}
                                                            onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                                                            className="h-8 text-sm bg-transparent border-none p-0 focus-visible:ring-0"
                                                        />
                                                    ) : (
                                                        <span>{card.arrival_time ? new Date(card.arrival_time).toLocaleString('pt-BR') : '-'}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Peso e Volume</p>
                                                <div className="flex items-center gap-2 text-foreground font-bold bg-muted/30 px-3 py-2 border-2 border-border">
                                                    <Box className="w-4 h-4 text-primary" />
                                                    12.645 kg • 38 m³
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Valor do Frete</p>
                                                <div className="flex items-center gap-2 text-emerald-600 font-heading font-black text-xl bg-emerald-50 px-3 py-2 border-2 border-emerald-200">
                                                    <DollarSign className="w-5 h-5" />
                                                    {card.value}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full my-8" />

                                        {/* Negotiation vs Trip Mode */}
                                        {isNegotiationStage ? (
                                            <div className="space-y-6">
                                                {/* Broadcast Action */}
                                                <div className="bg-primary/5 border-2 border-primary/20 p-6 space-y-4 shadow-brutal-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-base font-bold text-primary flex items-center gap-2 uppercase">
                                                                <Send className="w-4 h-4" /> Divulgação
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                                                                Selecione até 3 grupos para divulgar a carga.
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary hover:bg-primary/90 text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none font-bold uppercase"
                                                            onClick={async () => {
                                                                const selectedGroups = card.whatsapp_group_id ? card.whatsapp_group_id.split(',') : []

                                                                if (selectedGroups.length === 0) {
                                                                    alert('Por favor, selecione pelo menos um grupo de WhatsApp.')
                                                                    return
                                                                }

                                                                setIsBroadcasting(true)
                                                                try {
                                                                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                                                                    const sentGroups = [...(card.sent_groups || [])]
                                                                    let successCount = 0

                                                                    for (const groupId of selectedGroups) {
                                                                        // Skip if already sent recently? No, allow re-send.

                                                                        // Fetch group data
                                                                        const { data: groupData, error: groupError } = await supabase
                                                                            .from('groups')
                                                                            .select('whatsapp_id, name')
                                                                            .eq('id', groupId)
                                                                            .single()

                                                                        if (groupError || !groupData || !groupData.whatsapp_id) {
                                                                            console.warn(`Skipping group ${groupId}: Invalid data`)
                                                                            continue
                                                                        }

                                                                        // Send broadcast
                                                                        const response = await fetch(`${apiUrl}/api/v1/whatsapp/broadcast`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({
                                                                                whatsapp_id: groupData.whatsapp_id,
                                                                                load_id: card.id,
                                                                                origin: card.origin,
                                                                                destination: card.destination,
                                                                                value: card.value,
                                                                                vehicle_type: card.vehicle_type || 'TRUCK - RASTREADO',
                                                                                body_type: 'BAÚ',
                                                                                weight: 'A definir',
                                                                                material: 'A definir',
                                                                                pickup_date: 'A combinar',
                                                                                delivery_date: 'A combinar'
                                                                            })
                                                                        })

                                                                        if (response.ok) {
                                                                            successCount++
                                                                            if (!sentGroups.includes(groupId)) {
                                                                                sentGroups.push(groupId)
                                                                            }
                                                                        }
                                                                    }

                                                                    if (successCount > 0) {
                                                                        await updateCard(card.id, {
                                                                            broadcast_status: 'sent',
                                                                            sent_groups: sentGroups
                                                                        })
                                                                        await autoAdvanceCard(card.id, 'broadcast_sent')
                                                                        alert(`Carga divulgada com sucesso para ${successCount} grupo(s)!`)
                                                                    } else {
                                                                        throw new Error('Falha ao enviar para os grupos selecionados.')
                                                                    }

                                                                } catch (error) {
                                                                    console.error('Erro na divulgação:', error)
                                                                    alert(`Erro ao divulgar carga: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
                                                                } finally {
                                                                    setIsBroadcasting(false)
                                                                }
                                                            }}
                                                            disabled={isBroadcasting}
                                                        >
                                                            {isBroadcasting ? (
                                                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Enviando...</>
                                                            ) : (
                                                                <><Send className="w-4 h-4 mr-2" /> Divulgar</>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {/* WhatsApp Group Selection (Multi-select) */}
                                                    <div className="pt-4 border-t border-primary/10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <Label className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
                                                                <Users className="w-3 h-3" /> Grupos Selecionados (Máx 3)
                                                            </Label>
                                                            <Button size="sm" variant="outline" onClick={() => setShowNewGroupInput(true)} className="h-6 text-xs border-primary/20 text-primary bg-white/50 hover:bg-primary/10">
                                                                <Plus className="w-3 h-3 mr-1" /> Novo Grupo
                                                            </Button>
                                                        </div>

                                                        {showNewGroupInput ? (
                                                            <div className="flex flex-col gap-3 w-full animate-fade-in mb-4 bg-white p-3 border border-primary/20 shadow-sm">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        value={newGroupName}
                                                                        onChange={(e) => setNewGroupName(e.target.value)}
                                                                        placeholder="Nome do novo grupo..."
                                                                        className="h-8 text-sm bg-white flex-1"
                                                                    />
                                                                    <Button size="sm" onClick={handleCreateGroup} className="h-8 bg-primary text-white">Salvar</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setShowNewGroupInput(false)} className="h-8">Cancelar</Button>
                                                                </div>
                                                                <Input
                                                                    value={newGroupLink}
                                                                    onChange={(e) => setNewGroupLink(e.target.value)}
                                                                    placeholder="Link do WhatsApp (opcional)..."
                                                                    className="h-8 text-sm bg-white"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                                                {groups.map(g => {
                                                                    const selectedIds = card.whatsapp_group_id ? card.whatsapp_group_id.split(',') : []
                                                                    const isSelected = selectedIds.includes(g.id)
                                                                    const isSent = (card.sent_groups || []).includes(g.id)

                                                                    return (
                                                                        <div
                                                                            key={g.id}
                                                                            className={`
                                                                                flex items-center justify-between p-2 border-2 cursor-pointer transition-all
                                                                                ${isSelected
                                                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                                                    : 'border-transparent bg-white hover:border-gray-200'
                                                                                }
                                                                            `}
                                                                            onClick={async () => {
                                                                                let newSelected = [...selectedIds]
                                                                                if (isSelected) {
                                                                                    newSelected = newSelected.filter(id => id !== g.id)
                                                                                } else {
                                                                                    if (newSelected.length >= 3) {
                                                                                        alert('Máximo de 3 grupos por vez.')
                                                                                        return
                                                                                    }
                                                                                    newSelected.push(g.id)
                                                                                }
                                                                                // Filter out empty strings
                                                                                newSelected = newSelected.filter(id => id)
                                                                                await updateCard(card.id, { whatsapp_group_id: newSelected.join(',') })
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                                <div className={`w-4 h-4 border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                                </div>
                                                                                <span className="text-sm font-medium truncate">{g.name}</span>
                                                                            </div>
                                                                            {isSent && (
                                                                                <Badge variant="secondary" className="h-5 text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                                                                    Enviado
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <CandidateList
                                                    loadId={card.id}
                                                    onSelectCandidate={handleSelectCandidate}
                                                    onChatClick={(candidate) => {
                                                        setSelectedChatCandidate(candidate)
                                                        setActiveTab('chat')
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {!card.driver ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-amber-50 border-2 border-amber-200 p-6 text-center shadow-brutal-sm">
                                                            <div className="w-12 h-12 bg-amber-100 border-2 border-amber-200 flex items-center justify-center mx-auto mb-3">
                                                                <Users className="w-6 h-6 text-amber-700" />
                                                            </div>
                                                            <p className="text-sm text-amber-900 font-bold mb-1 uppercase">Nenhum motorista atribuído</p>
                                                            <p className="text-xs text-amber-700 mb-4 font-medium">Selecione um candidato abaixo para prosseguir.</p>
                                                        </div>
                                                        <CandidateList
                                                            loadId={card.id}
                                                            onSelectCandidate={handleSelectCandidate}
                                                            onChatClick={(candidate) => {
                                                                setSelectedChatCandidate(candidate)
                                                                setActiveTab('chat')
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="bg-card border-2 border-border shadow-brutal p-4 flex items-center gap-4">
                                                        <Avatar className="h-14 w-14 border-2 border-foreground rounded-none">
                                                            <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                                                            <AvatarFallback className="rounded-none font-bold">RS</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h4 className="text-base font-bold text-foreground uppercase">Roberto Santos <span className="text-amber-600 text-xs ml-1 bg-amber-50 px-1.5 py-0.5 border border-amber-200 font-mono">★ 4.7</span></h4>
                                                            <p className="text-sm text-muted-foreground mt-0.5 font-medium">345 viagens • Ouro</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" className="bg-background border-2 border-foreground hover:bg-accent rounded-none font-bold" onClick={() => {
                                                                if (card.driver) {
                                                                    const driverId = typeof card.driver === 'object' ? card.driver.id : card.driver
                                                                    window.location.href = `/motoristas/${driverId}`
                                                                }
                                                            }}>Ver Perfil</Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="rounded-none font-bold"
                                                                onClick={async () => {
                                                                    if (confirm('Tem certeza que deseja desvincular este motorista? A carga voltará para a etapa de Atendimento.')) {
                                                                        try {
                                                                            await useKanbanStore.getState().unassignDriver(card.id)
                                                                            alert('Motorista desvinculado com sucesso!')
                                                                        } catch (error) {
                                                                            alert('Erro ao desvincular motorista')
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                Desvincular
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Check-in Action */}
                                                {card.columnId === 'loading' && (
                                                    <div className="bg-amber-50 border-2 border-amber-200 p-6 flex items-center justify-between shadow-brutal-sm">
                                                        <div>
                                                            <h3 className="text-base font-bold text-amber-900 flex items-center gap-2 uppercase">
                                                                <Truck className="w-5 h-5" /> Check-in
                                                            </h3>
                                                            <p className="text-sm text-amber-700 mt-1 font-medium">Confirmar chegada para carregamento.</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none font-bold uppercase"
                                                            onClick={async () => {
                                                                await updateCard(card.id, { checkin_time: new Date().toISOString() })
                                                                await autoAdvanceCard(card.id, 'checkin_registered')
                                                                alert('Check-in confirmado!')
                                                            }}
                                                            disabled={!!card.checkin_time}
                                                        >
                                                            {card.checkin_time ? 'Realizado' : 'Confirmar'}
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Arrival Confirmation */}
                                                {card.columnId === 'transit' && (
                                                    <div className="bg-blue-50 border-2 border-blue-200 p-6 flex items-center justify-between shadow-brutal-sm">
                                                        <div>
                                                            <h3 className="text-base font-bold text-blue-900 flex items-center gap-2 uppercase">
                                                                <Truck className="w-5 h-5" /> Chegada no Destino
                                                            </h3>
                                                            <p className="text-sm text-blue-700 mt-1 font-medium">Confirmar chegada para descarga.</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none font-bold uppercase"
                                                            onClick={async () => {
                                                                await updateCard(card.id, { arrival_time: new Date().toISOString() })
                                                                await autoAdvanceCard(card.id, 'arrival_registered')
                                                                alert('Chegada confirmada!')
                                                            }}
                                                            disabled={!!card.arrival_time}
                                                        >
                                                            {card.arrival_time ? 'Realizado' : 'Confirmar'}
                                                        </Button>
                                                    </div>
                                                )}

                                                {/*POD Upload */}
                                                {['unloading', 'completed'].includes(card.columnId) && (
                                                    <div className="bg-emerald-50 border-2 border-emerald-200 p-6 flex items-center justify-between shadow-brutal-sm">
                                                        <div>
                                                            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2 uppercase">
                                                                <Upload className="w-5 h-5" /> Comprovante (POD)
                                                            </h3>
                                                            <p className="text-sm text-emerald-700 mt-1 font-medium">Upload do canhoto assinado.</p>
                                                        </div>
                                                        <div className="relative">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-100 bg-white font-bold rounded-none uppercase"
                                                                disabled={isUploading || !!card.pod_url}
                                                            >
                                                                {isUploading ? 'Enviando...' : card.pod_url ? 'Ver POD' : 'Enviar'}
                                                                {!card.pod_url && (
                                                                    <input
                                                                        type="file"
                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                        accept="image/*,application/pdf"
                                                                        onChange={(e) => handleFileUpload(e, 'pod')}
                                                                    />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full my-8" />

                                        <VehicleRequirements />

                                        {/* Actions Footer */}
                                        <div className="flex justify-end gap-3 pt-6">
                                            {showDeleteConfirm ? (
                                                <div className="flex items-center gap-3 animate-fade-in bg-red-50 p-2 rounded-none border-2 border-red-100">
                                                    <span className="text-xs text-red-600 font-bold uppercase tracking-wide">Confirmar exclusão?</span>
                                                    <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="h-8 bg-white border-red-200 text-red-600 hover:bg-red-50">Não</Button>
                                                    <Button size="sm" className="h-8 bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-900/20" onClick={handleDelete}>Sim</Button>
                                                </div>
                                            ) : (
                                                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200 transition-colors">
                                                    Excluir Carga
                                                </Button>
                                            )}
                                            <Button className="bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 transition-all hover:scale-105" onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                                                {isEditing ? 'Salvar Alterações' : 'Editar Informações'}
                                            </Button>
                                        </div>
                                    </TabsContent>

                                    {/* Chat Tab */}
                                    <TabsContent value="chat" className="mt-0 h-[500px] flex flex-col">
                                        {selectedChatCandidate ? (
                                            <>
                                                {/* Chat Header */}
                                                <div className="flex items-center gap-4 p-4 border-b-2 border-border bg-muted/10">
                                                    <Avatar className="h-10 w-10 border-2 border-foreground rounded-none">
                                                        <AvatarImage src={selectedChatCandidate.driver.photo || "https://i.pravatar.cc/150?u=1"} />
                                                        <AvatarFallback className="rounded-none font-bold">
                                                            {selectedChatCandidate.driver.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-bold text-foreground uppercase">{selectedChatCandidate.driver.name}</h4>
                                                        <p className="text-xs text-muted-foreground font-mono">{selectedChatCandidate.driver.phone}</p>
                                                    </div>
                                                </div>

                                                <div className="flex-1 bg-muted/10 border-2 border-border p-6 mb-4 overflow-y-auto space-y-6 shadow-inner">
                                                    {selectedChatCandidate.chat_messages && selectedChatCandidate.chat_messages.length > 0 ? (
                                                        selectedChatCandidate.chat_messages.map((msg: any, i: number) => (
                                                            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[80%] p-4 shadow-brutal-sm border-2 border-border ${msg.sender === 'user'
                                                                    ? 'bg-primary text-white rounded-none'
                                                                    : msg.sender === 'system'
                                                                        ? 'bg-muted text-muted-foreground text-xs text-center w-full shadow-none border-none'
                                                                        : 'bg-card text-foreground rounded-none'
                                                                    }`}>
                                                                    <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                                                                    <p className={`text-[10px] mt-2 font-bold uppercase ${msg.sender === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                                                        {msg.time || new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center text-muted-foreground py-10">
                                                            <p>Nenhuma mensagem ainda.</p>
                                                            <p className="text-xs">Envie uma mensagem para iniciar a conversa.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault()
                                                    if (!chatMessage.trim()) return

                                                    const tempMessage = { sender: 'user', text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp: new Date().toISOString() }

                                                    // Optimistic update
                                                    const updatedMessages = [...(selectedChatCandidate.chat_messages || []), tempMessage]
                                                    setSelectedChatCandidate({ ...selectedChatCandidate, chat_messages: updatedMessages })
                                                    setChatMessage('')

                                                    try {
                                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                                                        const response = await fetch(`${apiUrl}/api/v1/whatsapp/send-message`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                candidate_id: selectedChatCandidate.id,
                                                                message: tempMessage.text
                                                            })
                                                        })

                                                        if (!response.ok) {
                                                            throw new Error('Failed to send message')
                                                        }
                                                    } catch (error) {
                                                        console.error('Error sending message:', error)
                                                        alert('Erro ao enviar mensagem. Tente novamente.')
                                                        // Revert optimistic update? Or just alert.
                                                    }
                                                }} className="flex gap-3">
                                                    <Input
                                                        value={chatMessage}
                                                        onChange={(e) => setChatMessage(e.target.value)}
                                                        placeholder="Digite sua mensagem..."
                                                        className="flex-1 bg-background border-2 border-border focus:shadow-brutal transition-all h-12 rounded-none"
                                                    />
                                                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-white h-12 w-12 rounded-none shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-0 border-2 border-primary">
                                                        <Send className="w-5 h-5" />
                                                    </Button>
                                                </form>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="font-bold uppercase">Nenhuma conversa selecionada</p>
                                                <p className="text-sm">Selecione um motorista na aba "Candidatos" para abrir o chat.</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Attachments Tab */}
                                    <TabsContent value="attachments" className="mt-0">
                                        <div className="bg-muted/10 border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:bg-primary/5 transition-all duration-300 p-8 flex flex-col items-center justify-center h-[300px] mb-6 cursor-pointer relative group">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleFileUpload(e, 'attachment')}
                                            />
                                            <div className="w-16 h-16 bg-background border-2 border-border shadow-brutal-sm flex items-center justify-center mb-4 group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all duration-300">
                                                <Paperclip className="w-8 h-8 text-primary" />
                                            </div>
                                            <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors uppercase">
                                                {isUploading ? 'Enviando...' : 'Clique para fazer upload'}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2 font-medium">PDF, JPG ou PNG (max 5MB)</p>
                                        </div>
                                    </TabsContent>

                                    {/* Timeline Tab */}
                                    <TabsContent value="timeline" className="mt-0">
                                        <div className="bg-card border-2 border-border shadow-brutal p-8">
                                            <h3 className="text-lg font-black text-foreground mb-8 flex items-center gap-3 uppercase">
                                                <div className="p-2 bg-primary/10 border-2 border-primary/20 text-primary">
                                                    <History className="w-5 h-5" />
                                                </div>
                                                Histórico de Atividades
                                            </h3>
                                            <div className="relative border-l-2 border-border ml-3 space-y-8">
                                                {events.map((event) => (
                                                    <div key={event.id} className="relative pl-8 group">
                                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-background border-4 border-muted-foreground group-hover:border-primary transition-colors"></div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted-foreground font-mono mb-1 bg-muted w-fit px-2 py-0.5 border-2 border-border font-bold">
                                                                {new Date(event.createdAt).toLocaleString('pt-BR')}
                                                            </span>
                                                            <span className="text-sm font-bold text-foreground capitalize mt-1">
                                                                {event.action.replace(/_/g, ' ')}
                                                            </span>
                                                            {event.details && (
                                                                <div className="text-xs text-muted-foreground mt-2 bg-muted/30 p-3 border-2 border-border font-mono">
                                                                    {JSON.stringify(event.details, null, 2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {events.length === 0 && (
                                                    <p className="text-sm text-muted-foreground pl-8 italic font-medium">Nenhuma atividade registrada.</p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Candidates Tab */}
                                    <TabsContent value="candidates" className="mt-0">
                                        <div className="bg-card border-2 border-border shadow-brutal p-8">
                                            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3 uppercase">
                                                <div className="p-2 bg-primary/10 border-2 border-primary/20 text-primary">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                Candidatos Interessados
                                            </h3>
                                            <CandidateList loadId={card.id} />
                                        </div>
                                    </TabsContent>

                                    {/* Documentation Tab */}
                                    <TabsContent value="documentation" className="mt-0 space-y-6">
                                        <div className="bg-card border-2 border-border shadow-brutal p-8">
                                            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3 uppercase">
                                                <div className="p-2 bg-primary/10 border-2 border-primary/20 text-primary">
                                                    <FileCheck className="w-5 h-5" />
                                                </div>
                                                Validação de Documentos
                                            </h3>
                                            <div className="space-y-4">
                                                {['CNH do Motorista', 'CRLV do Veículo', 'Seguro de Carga', 'RNTRC'].map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-muted/10 border-2 border-border hover:shadow-brutal-sm transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-green-50 flex items-center justify-center border-2 border-green-200">
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground uppercase">{doc}</span>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button size="sm" variant="outline" className="h-9 text-xs bg-background hover:bg-accent border-2 border-border rounded-none font-bold uppercase">Visualizar</Button>
                                                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-green-600 hover:bg-green-50 rounded-none">
                                                                <Check className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 flex justify-end">
                                                <Button
                                                    className="bg-primary hover:bg-primary/90 text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold px-6 h-10 rounded-none uppercase"
                                                    onClick={async () => {
                                                        await updateCard(card.id, { documents_status: 'verified' })
                                                        await autoAdvanceCard(card.id, 'documents_verified')
                                                        alert('Documentação validada com sucesso!')
                                                    }}
                                                    disabled={card.documents_status === 'verified'}
                                                >
                                                    {card.documents_status === 'verified' ? (
                                                        <><Check className="w-4 h-4 mr-2" /> Documentação Aprovada</>
                                                    ) : (
                                                        'Aprovar Documentação'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Risk Tab */}
                                    <TabsContent value="risk" className="mt-0 space-y-6">
                                        <div className="bg-card border-2 border-border shadow-brutal p-8">
                                            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3 uppercase">
                                                <div className="p-2 bg-purple-100 border-2 border-purple-200 text-purple-600">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                Análise de Risco
                                            </h3>
                                            <div className="grid grid-cols-3 gap-6 mb-8">
                                                <div className="p-6 bg-green-50 border-2 border-green-200 text-center shadow-brutal-sm">
                                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Motorista</p>
                                                    <p className="text-xl font-heading font-black text-green-700 uppercase">Baixo Risco</p>
                                                </div>
                                                <div className="p-6 bg-green-50 border-2 border-green-200 text-center shadow-brutal-sm">
                                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Veículo</p>
                                                    <p className="text-xl font-heading font-black text-green-700 uppercase">Baixo Risco</p>
                                                </div>
                                                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 text-center shadow-brutal-sm">
                                                    <p className="text-xs text-yellow-600 font-bold uppercase flex items-center justify-center gap-1 tracking-wider mb-2">
                                                        <AlertTriangle className="w-3 h-3" /> Rota
                                                    </p>
                                                    <p className="text-xl font-heading font-black text-yellow-700 uppercase">Médio Risco</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4">
                                                <Button variant="outline" className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-none font-bold uppercase">Reprovar</Button>
                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold px-6 rounded-none uppercase"
                                                    onClick={async () => {
                                                        await updateCard(card.id, { risk_status: 'approved' })
                                                        await autoAdvanceCard(card.id, 'risk_approved')
                                                        alert('Risco aprovado! GR liberada.')
                                                    }}
                                                    disabled={card.risk_status === 'approved'}
                                                >
                                                    {card.risk_status === 'approved' ? (
                                                        <><Check className="w-4 h-4 mr-2" /> GR Liberada</>
                                                    ) : (
                                                        'Aprovar Risco'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Contracts Tab */}
                                    <TabsContent value="contracts" className="mt-0 space-y-6">
                                        <div className="bg-card border-2 border-border shadow-brutal p-10 text-center">
                                            <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
                                                <FileSignature className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-black text-foreground mb-2 uppercase">Contrato de Transporte</h3>
                                            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto font-medium">Gere o contrato digital automaticamente ou selecione um modelo pré-aprovado para esta operação.</p>

                                            {/* Contract Templates */}
                                            {!card.contract_url && (
                                                <div className="mb-8 max-w-sm mx-auto text-left bg-muted/10 p-6 border-2 border-border shadow-brutal-sm">
                                                    <Label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-wider">Usar Modelo</Label>
                                                    <div className="flex gap-3">
                                                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                                            <SelectTrigger className="h-10 bg-background border-2 border-border rounded-none focus:ring-0 focus:border-primary font-medium">
                                                                <SelectValue placeholder="Selecione um modelo..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-none border-2 border-border shadow-brutal">
                                                                {contractTemplates.map(t => (
                                                                    <SelectItem key={t.id} value={t.id} className="focus:bg-primary/10 focus:text-primary font-medium">{t.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary text-white h-10 px-4 rounded-none border-2 border-primary shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold uppercase"
                                                            disabled={!selectedTemplateId}
                                                            onClick={() => {
                                                                const template = contractTemplates.find(t => t.id === selectedTemplateId)
                                                                if (template) {
                                                                    updateCard(card.id, { contract_url: template.url })
                                                                }
                                                            }}
                                                        >
                                                            Usar
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {card.contract_url ? (
                                                <div className="flex flex-col items-center gap-4 animate-fade-in">
                                                    <div className="flex items-center gap-2 text-green-700 bg-green-100 px-6 py-3 border-2 border-green-200 shadow-brutal-sm">
                                                        <Check className="w-5 h-5" />
                                                        <span className="text-sm font-bold uppercase">Contrato Gerado</span>
                                                    </div>
                                                    <div className="flex gap-3 mt-2">
                                                        <Button variant="outline" onClick={() => window.open(card.contract_url, '_blank')} className="bg-background hover:bg-accent border-2 border-foreground rounded-none font-bold uppercase">
                                                            <FileText className="w-4 h-4 mr-2" /> Baixar PDF
                                                        </Button>
                                                        <Button variant="outline" onClick={handleSaveContractTemplate} className="bg-background hover:bg-accent border-2 border-foreground rounded-none font-bold uppercase">
                                                            Salvar como Modelo
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    className="bg-primary hover:bg-primary/90 text-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-12 px-8 text-base font-bold rounded-none uppercase"
                                                    onClick={async () => {
                                                        await updateCard(card.id, { contract_url: 'https://example.com/contract.pdf' })
                                                        await autoAdvanceCard(card.id, 'contract_generated')
                                                        alert('Contrato gerado com sucesso!')
                                                    }}
                                                >
                                                    Gerar Contrato Automático
                                                </Button>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Map Tab */}
                                    <TabsContent value="map" className="mt-0">
                                        <div className="bg-card border-2 border-border shadow-brutal p-4 h-[500px] relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                                <div className="text-center space-y-4 z-10">
                                                    <div className="w-16 h-16 bg-background border-2 border-border flex items-center justify-center mx-auto shadow-brutal animate-pulse">
                                                        <MapPin className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <p className="text-muted-foreground font-bold uppercase">Mapa em tempo real</p>
                                                </div>
                                                {/* Decorative map pattern */}
                                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                            </div>

                                            {/* Floating Info Card */}
                                            <div className="absolute bottom-6 left-6 right-6 bg-background border-2 border-border shadow-brutal p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4 p-4 border-b-2 border-border bg-muted/10">
                                                    <div className="w-12 h-12 rounded-none bg-muted border-2 border-border overflow-hidden">
                                                        {card.driver && typeof card.driver !== 'string' && (
                                                            <img src={card.driver.photo} alt={card.driver.name} className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground uppercase">{card.driver && typeof card.driver !== 'string' ? card.driver.name : 'Motorista'}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{card.driver && typeof card.driver !== 'string' ? card.driver.phone : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground font-bold uppercase">Previsão</p>
                                                    <p className="text-sm font-bold text-foreground uppercase">14:30 - Hoje</p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
