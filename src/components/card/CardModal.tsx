import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { KanbanCard } from '@/store/useKanbanStore'
import { useKanbanStore } from '@/store/useKanbanStore'
import { supabase } from '@/lib/supabase'
import { Calendar, DollarSign, X, Paperclip, Send, Check, AlertTriangle, FileCheck, Truck, Upload, Shield, FileSignature, ArrowRight, Box, History, MapPin, Clock, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { CandidateList } from './CandidateList'
import { VehicleRequirements } from './VehicleRequirements'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCardEventsStore } from '@/store/useCardEventsStore'
import { useCandidatesStore } from '@/store/useCandidatesStore'
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

    useEffect(() => {
        if (isOpen && defaultTab) {
            setActiveTab(defaultTab)
        }
    }, [isOpen, defaultTab, setActiveTab])
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Partial<KanbanCard>>({})
    const [chatMessage, setChatMessage] = useState('')
    const [chatHistory, setChatHistory] = useState([
        { sender: 'system', text: 'Carga criada com sucesso.', time: '10:00' },
        { sender: 'driver', text: 'Estou a caminho da coleta.', time: '10:15' }
    ])
    const [isUploading, setIsUploading] = useState(false)

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
        const { data } = await supabase.from('groups').insert([{
            name: newGroupName,
            type: 'Carreta', // Default
            description: 'Criado via Card',
            region: 'Nacional',
            whatsapp_link: newGroupLink || null
        }]).select().single()

        if (data) {
            setGroups([...groups, data])
            await updateCard(card!.id, { whatsapp_group_id: data.id })
            await autoAdvanceCard(card!.id, 'whatsapp_group_created')
            setShowNewGroupInput(false)
            setNewGroupName('')
            setNewGroupLink('')
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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatMessage.trim()) return

        setChatHistory([...chatHistory, { sender: 'user', text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
        setChatMessage('')

        // Mock response
        setTimeout(() => {
            setChatHistory(prev => [...prev, { sender: 'driver', text: 'Ok, recebido!', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
        }, 1000)
    }

    const handleSelectCandidate = async (candidateId: string) => {
        if (!card) return

        try {
            // We can reuse isUploading or create a new state, but let's use isUploading for now to block UI
            setIsUploading(true)

            // Accept candidate and get driver ID
            const driverId = await useCandidatesStore.getState()
                .acceptCandidate(candidateId, card.id)

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

    const isNegotiationStage = ['registration', 'broadcast'].includes(card.columnId)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card max-w-5xl border-white/20 max-h-[90vh] overflow-hidden p-0 gap-0 shadow-2xl shadow-blue-900/20 rounded-3xl">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-white/60 to-white/30 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono tracking-wider">
                                    CARGA-{card.id.substring(0, 4)}
                                </Badge>
                                <Badge variant="secondary" className="bg-white/50 text-muted-foreground font-medium backdrop-blur-sm">Carga Completa</Badge>
                            </div>
                            <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2 tracking-tight">
                                {card.origin} <ArrowRight className="w-5 h-5 text-muted-foreground" /> {card.destination}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-white/20 shadow-sm backdrop-blur-md">
                                <Switch
                                    checked={formData.auto_advance !== false}
                                    onCheckedChange={(checked) => {
                                        setFormData({ ...formData, auto_advance: checked })
                                        updateCard(card.id, { auto_advance: checked })
                                    }}
                                    id="auto-advance"
                                    className="data-[state=checked]:bg-primary"
                                />
                                <Label htmlFor="auto-advance" className="text-xs font-semibold text-muted-foreground cursor-pointer uppercase tracking-wide">
                                    Automação
                                </Label>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-white/20 rounded-full w-10 h-10 transition-colors">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>


                <div className="flex h-[calc(90vh-88px)]">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-8 pt-2 border-b border-white/10 bg-white/20 backdrop-blur-sm">
                            <TabsList className="bg-transparent w-full justify-start h-14 p-0 space-x-8">
                                <TabsTrigger value="info" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                    Informações
                                </TabsTrigger>
                                <TabsTrigger value="chat" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                    Chat
                                </TabsTrigger>
                                <TabsTrigger value="attachments" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                    Anexos
                                </TabsTrigger>
                                <TabsTrigger value="timeline" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                    Timeline
                                </TabsTrigger>

                                {/* Dynamic Tabs */}
                                {['documentation', 'risk', 'contract', 'loading', 'transit', 'unloading', 'completed'].includes(card.columnId) && (
                                    <TabsTrigger value="documentation" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                        Documentação
                                    </TabsTrigger>
                                )}
                                {['risk', 'contract', 'loading', 'transit', 'unloading', 'completed'].includes(card.columnId) && (
                                    <TabsTrigger value="risk" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                        Risco
                                    </TabsTrigger>
                                )}
                                {['contract', 'loading', 'transit', 'unloading', 'completed'].includes(card.columnId) && (
                                    <TabsTrigger value="contracts" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                        Contratos
                                    </TabsTrigger>
                                )}
                                {['loading', 'transit', 'unloading', 'completed'].includes(card.columnId) && (
                                    <TabsTrigger value="map" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent px-0 font-medium text-muted-foreground hover:text-foreground transition-colors text-sm">
                                        Rota
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white/30 backdrop-blur-sm p-8 scrollbar-thin scrollbar-thumb-gray-300/50 scrollbar-track-transparent">
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
                                                <div className="p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm">
                                                    <p className="text-lg font-heading font-bold text-foreground">CD {card.origin}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Av. Principal, 1000</p>
                                                    <p className="text-sm text-muted-foreground">{card.origin}, SP</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" /> Destino
                                                </p>
                                                <div className="p-4 rounded-xl bg-white/50 border border-white/40 shadow-sm">
                                                    <p className="text-lg font-heading font-bold text-foreground">CD {card.destination}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Av. Central, 500</p>
                                                    <p className="text-sm text-muted-foreground">{card.destination}, SP</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Data de Coleta</p>
                                                <div className="flex items-center gap-2 text-foreground font-medium bg-white/30 px-3 py-2 rounded-lg border border-white/20">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    {card.date}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Data de Entrega</p>
                                                <div className="flex items-center gap-2 text-foreground font-medium bg-white/30 px-3 py-2 rounded-lg border border-white/20">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    20/03/2024
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Previsão de Chegada</p>
                                                <div className="flex items-center gap-2 text-foreground font-medium bg-white/30 px-3 py-2 rounded-lg border border-white/20">
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
                                                <div className="flex items-center gap-2 text-foreground font-medium bg-white/30 px-3 py-2 rounded-lg border border-white/20">
                                                    <Box className="w-4 h-4 text-primary" />
                                                    12.645 kg • 38 m³
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase">Valor do Frete</p>
                                                <div className="flex items-center gap-2 text-emerald-600 font-heading font-bold text-xl bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">
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
                                                <div className="glass-card p-6 border-primary/20 bg-primary/5 space-y-4 rounded-2xl">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-base font-bold text-primary flex items-center gap-2">
                                                                <Send className="w-4 h-4" /> Divulgação
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {card.broadcast_status === 'sent'
                                                                    ? 'Carga divulgada para motoristas da região.'
                                                                    : 'Divulgue para encontrar motoristas.'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105"
                                                            onClick={async () => {
                                                                await updateCard(card.id, { broadcast_status: 'sent' })
                                                                await autoAdvanceCard(card.id, 'broadcast_sent')
                                                                alert('Carga divulgada para 15 motoristas próximos!')
                                                            }}
                                                            disabled={card.broadcast_status === 'sent'}
                                                        >
                                                            {card.broadcast_status === 'sent' ? (
                                                                <><Check className="w-4 h-4 mr-2" /> Divulgado</>
                                                            ) : (
                                                                <><Send className="w-4 h-4 mr-2" /> Divulgar</>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {/* WhatsApp Group Selection */}
                                                    <div className="pt-4 border-t border-primary/10">
                                                        <Label className="text-xs font-bold text-primary mb-2 block flex items-center gap-1 uppercase tracking-wider">
                                                            <Users className="w-3 h-3" /> Grupo WhatsApp
                                                        </Label>
                                                        {showNewGroupInput ? (
                                                            <div className="flex flex-col gap-3 w-full animate-fade-in">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        value={newGroupName}
                                                                        onChange={(e) => setNewGroupName(e.target.value)}
                                                                        placeholder="Nome do novo grupo..."
                                                                        className="h-9 text-sm bg-white/80 flex-1"
                                                                    />
                                                                    <Button size="sm" onClick={handleCreateGroup} className="h-9 bg-primary text-white">Salvar</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setShowNewGroupInput(false)} className="h-9">Cancelar</Button>
                                                                </div>
                                                                <Input
                                                                    value={newGroupLink}
                                                                    onChange={(e) => setNewGroupLink(e.target.value)}
                                                                    placeholder="Link do WhatsApp (opcional)..."
                                                                    className="h-9 text-sm bg-white/80"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <div className="flex gap-2">
                                                                    <Select
                                                                        value={card.whatsapp_group_id || ''}
                                                                        onValueChange={async (val) => {
                                                                            await updateCard(card.id, { whatsapp_group_id: val })
                                                                            await autoAdvanceCard(card.id, 'whatsapp_group_selected')
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-sm bg-white/80 border-primary/20 focus:ring-primary/20">
                                                                            <SelectValue placeholder="Selecione um grupo..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {groups.map(g => (
                                                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button size="sm" variant="outline" onClick={() => setShowNewGroupInput(true)} className="h-9 border-primary/20 text-primary bg-white/50 hover:bg-primary/10">
                                                                        <Plus className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                                {card.whatsapp_group_id && (
                                                                    <div className="text-xs text-primary bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between">
                                                                        <span className="truncate max-w-[200px] font-medium">
                                                                            {groups.find(g => g.id === card.whatsapp_group_id)?.whatsapp_link || 'Sem link cadastrado'}
                                                                        </span>
                                                                        {groups.find(g => g.id === card.whatsapp_group_id)?.whatsapp_link && (
                                                                            <a
                                                                                href={groups.find(g => g.id === card.whatsapp_group_id)?.whatsapp_link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="font-bold hover:underline flex items-center gap-1"
                                                                            >
                                                                                Abrir <ArrowRight className="w-3 h-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <CandidateList
                                                    loadId={card.id}
                                                    onSelectCandidate={handleSelectCandidate}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {!card.driver ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-6 text-center shadow-sm backdrop-blur-sm">
                                                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Users className="w-6 h-6 text-amber-600" />
                                                            </div>
                                                            <p className="text-sm text-amber-900 font-bold mb-1">Nenhum motorista atribuído</p>
                                                            <p className="text-xs text-amber-700 mb-4">Selecione um candidato abaixo para prosseguir.</p>
                                                        </div>
                                                        <CandidateList
                                                            loadId={card.id}
                                                            onSelectCandidate={handleSelectCandidate}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="glass-card p-4 border-white/40 bg-white/60 rounded-xl flex items-center gap-4 shadow-sm">
                                                        <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                                                            <AvatarImage src="https://i.pravatar.cc/150?u=1" />
                                                            <AvatarFallback>RS</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h4 className="text-base font-bold text-foreground">Roberto Santos <span className="text-amber-500 text-xs ml-1 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">★ 4.7</span></h4>
                                                            <p className="text-sm text-muted-foreground mt-0.5">345 viagens • Ouro</p>
                                                        </div>
                                                        <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white">Ver Perfil</Button>
                                                    </div>
                                                )}

                                                {/* Check-in Action */}
                                                {card.columnId === 'loading' && (
                                                    <div className="glass-card p-6 border-amber-200/40 bg-amber-50/30 flex items-center justify-between rounded-2xl">
                                                        <div>
                                                            <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                                                                <Truck className="w-5 h-5" /> Check-in
                                                            </h3>
                                                            <p className="text-sm text-amber-700 mt-1">Confirmar chegada para carregamento.</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-900/20"
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
                                                    <div className="glass-card p-6 border-blue-200/40 bg-blue-50/30 flex items-center justify-between rounded-2xl">
                                                        <div>
                                                            <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                                                                <Truck className="w-5 h-5" /> Chegada no Destino
                                                            </h3>
                                                            <p className="text-sm text-blue-700 mt-1">Confirmar chegada para descarga.</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
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
                                                    <div className="glass-card p-6 border-emerald-200/40 bg-emerald-50/30 flex items-center justify-between rounded-2xl">
                                                        <div>
                                                            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                                                                <Upload className="w-5 h-5" /> Comprovante (POD)
                                                            </h3>
                                                            <p className="text-sm text-emerald-700 mt-1">Upload do canhoto assinado.</p>
                                                        </div>
                                                        <div className="relative">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-100 bg-white/50"
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
                                                <div className="flex items-center gap-3 animate-fade-in bg-red-50 p-2 rounded-lg border border-red-100">
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
                                        <div className="flex-1 glass-card p-6 mb-4 overflow-y-auto space-y-6 bg-white/40 rounded-2xl border-white/30">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.sender === 'user'
                                                        ? 'bg-primary text-white rounded-tr-none'
                                                        : msg.sender === 'system'
                                                            ? 'bg-gray-100/80 text-gray-500 text-xs text-center w-full shadow-none'
                                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                        }`}>
                                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                                        {msg.sender !== 'system' && (
                                                            <p className={`text-[10px] mt-2 font-medium ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                                {msg.time}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <form onSubmit={handleSendMessage} className="flex gap-3">
                                            <Input
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                                placeholder="Digite sua mensagem..."
                                                className="flex-1 bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white transition-all h-12 rounded-xl shadow-sm"
                                            />
                                            <Button type="submit" className="bg-primary hover:bg-primary-600 text-white h-12 w-12 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-0">
                                                <Send className="w-5 h-5" />
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    {/* Attachments Tab */}
                                    <TabsContent value="attachments" className="mt-0">
                                        <div className="glass-card p-8 border-dashed border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center h-[300px] mb-6 cursor-pointer relative bg-white/40 group">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleFileUpload(e, 'attachment')}
                                            />
                                            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <Paperclip className="w-8 h-8 text-primary" />
                                            </div>
                                            <p className="text-lg font-bold text-gray-700 group-hover:text-primary transition-colors">
                                                {isUploading ? 'Enviando...' : 'Clique para fazer upload'}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2">PDF, JPG ou PNG (max 5MB)</p>
                                        </div>
                                    </TabsContent>

                                    {/* Timeline Tab */}
                                    <TabsContent value="timeline" className="mt-0">
                                        <div className="glass-card p-8 bg-white/40 rounded-2xl border-white/30">
                                            <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <History className="w-5 h-5" />
                                                </div>
                                                Histórico de Atividades
                                            </h3>
                                            <div className="relative border-l-2 border-gray-200/60 ml-3 space-y-8">
                                                {events.map((event) => (
                                                    <div key={event.id} className="relative pl-8 group">
                                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-gray-200 group-hover:border-primary transition-colors shadow-sm"></div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted-foreground font-mono mb-1 bg-gray-50 w-fit px-2 py-0.5 rounded border border-gray-100">
                                                                {new Date(event.createdAt).toLocaleString('pt-BR')}
                                                            </span>
                                                            <span className="text-sm font-bold text-foreground capitalize mt-1">
                                                                {event.action.replace(/_/g, ' ')}
                                                            </span>
                                                            {event.details && (
                                                                <div className="text-xs text-muted-foreground mt-2 bg-white/50 p-3 rounded-lg border border-white/40 font-mono">
                                                                    {JSON.stringify(event.details, null, 2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {events.length === 0 && (
                                                    <p className="text-sm text-muted-foreground pl-8 italic">Nenhuma atividade registrada.</p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Documentation Tab */}
                                    <TabsContent value="documentation" className="mt-0 space-y-6">
                                        <div className="glass-card p-8 bg-white/40 rounded-2xl border-white/30">
                                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <FileCheck className="w-5 h-5" />
                                                </div>
                                                Validação de Documentos
                                            </h3>
                                            <div className="space-y-4">
                                                {['CNH do Motorista', 'CRLV do Veículo', 'Seguro de Carga', 'RNTRC'].map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-700">{doc}</span>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button size="sm" variant="outline" className="h-9 text-xs bg-white hover:bg-gray-50">Visualizar</Button>
                                                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-green-600 hover:bg-green-50 rounded-full">
                                                                <Check className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 flex justify-end">
                                                <Button
                                                    className="bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 font-medium px-6 h-10"
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
                                        <div className="glass-card p-8 bg-white/40 rounded-2xl border-white/30">
                                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                Análise de Risco
                                            </h3>
                                            <div className="grid grid-cols-3 gap-6 mb-8">
                                                <div className="p-6 bg-green-50/80 rounded-2xl border border-green-100 text-center shadow-sm">
                                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Motorista</p>
                                                    <p className="text-xl font-heading font-bold text-green-700">Baixo Risco</p>
                                                </div>
                                                <div className="p-6 bg-green-50/80 rounded-2xl border border-green-100 text-center shadow-sm">
                                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Veículo</p>
                                                    <p className="text-xl font-heading font-bold text-green-700">Baixo Risco</p>
                                                </div>
                                                <div className="p-6 bg-yellow-50/80 rounded-2xl border border-yellow-100 text-center shadow-sm">
                                                    <p className="text-xs text-yellow-600 font-bold uppercase flex items-center justify-center gap-1 tracking-wider mb-2">
                                                        <AlertTriangle className="w-3 h-3" /> Rota
                                                    </p>
                                                    <p className="text-xl font-heading font-bold text-yellow-700">Médio Risco</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-4">
                                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">Reprovar</Button>
                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 font-medium px-6"
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
                                        <div className="glass-card p-10 text-center bg-white/40 rounded-2xl border-white/30">
                                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <FileSignature className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-bold text-foreground mb-2">Contrato de Transporte</h3>
                                            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">Gere o contrato digital automaticamente ou selecione um modelo pré-aprovado para esta operação.</p>

                                            {/* Contract Templates */}
                                            {!card.contract_url && (
                                                <div className="mb-8 max-w-sm mx-auto text-left bg-white/50 p-6 rounded-xl border border-white/40 shadow-sm">
                                                    <Label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-wider">Usar Modelo</Label>
                                                    <div className="flex gap-3">
                                                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                                            <SelectTrigger className="h-10 bg-white border-gray-200">
                                                                <SelectValue placeholder="Selecione um modelo..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {contractTemplates.map(t => (
                                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            size="sm"
                                                            className="bg-primary text-white h-10 px-4"
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
                                                    <div className="flex items-center gap-2 text-green-700 bg-green-100 px-6 py-3 rounded-full border border-green-200 shadow-sm">
                                                        <Check className="w-5 h-5" />
                                                        <span className="text-sm font-bold">Contrato Gerado</span>
                                                    </div>
                                                    <div className="flex gap-3 mt-2">
                                                        <Button variant="outline" onClick={() => window.open(card.contract_url, '_blank')} className="bg-white hover:bg-gray-50">
                                                            <FileText className="w-4 h-4 mr-2" /> Baixar PDF
                                                        </Button>
                                                        <Button variant="outline" onClick={handleSaveContractTemplate} className="bg-white hover:bg-gray-50">
                                                            Salvar como Modelo
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    className="bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 h-12 px-8 text-base font-medium rounded-xl"
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
                                        <div className="glass-card p-4 bg-white/40 rounded-2xl border-white/30 h-[500px] relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                                <div className="text-center space-y-4 z-10">
                                                    <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                                                        <MapPin className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <p className="text-gray-500 font-medium">Mapa em tempo real</p>
                                                </div>
                                                {/* Decorative map pattern */}
                                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6B8CAE_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                            </div>

                                            {/* Floating Info Card */}
                                            <div className="absolute bottom-6 left-6 right-6 glass-card p-4 bg-white/90 backdrop-blur-md border-white/50 shadow-lg rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 rounded-lg">
                                                        <Truck className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-bold uppercase">Status Atual</p>
                                                        <p className="text-sm font-bold text-foreground">Em trânsito - 80km/h</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground font-bold uppercase">Previsão</p>
                                                    <p className="text-sm font-bold text-foreground">14:30 - Hoje</p>
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
