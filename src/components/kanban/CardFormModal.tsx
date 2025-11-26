import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useKanbanStore, type KanbanCard } from '@/store/useKanbanStore'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CardFormModalProps {
    isOpen: boolean
    onClose: () => void
    card?: KanbanCard | null
}

interface LoadModel {
    id: string
    name: string
    origin: string
    destination: string
    vehicle_type: string
    type: string
}

export function CardFormModal({ isOpen, onClose, card }: CardFormModalProps) {
    const { addCard, updateCard } = useKanbanStore()
    const [loadModels, setLoadModels] = useState<LoadModel[]>([])
    const [isLoadingModels, setIsLoadingModels] = useState(false)
    const [saveAsModel, setSaveAsModel] = useState(false)
    const [modelName, setModelName] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        origin: '',
        destination: '',
        value: '',
        date: '',
        priority: 'normal' as 'high' | 'normal',
        columnId: 'registration',
    })

    useEffect(() => {
        if (isOpen) {
            fetchLoadModels()
        }
    }, [isOpen])

    const fetchLoadModels = async () => {
        setIsLoadingModels(true)
        try {
            const { data, error } = await supabase
                .from('load_models')
                .select('*')
                .order('name')

            if (error) throw error
            setLoadModels(data || [])
        } catch (error) {
            console.error('Error fetching load models:', error)
        } finally {
            setIsLoadingModels(false)
        }
    }

    useEffect(() => {
        if (card) {
            setFormData({
                title: card.title,
                origin: card.origin,
                destination: card.destination,
                value: card.value,
                date: card.date,
                priority: card.priority,
                columnId: card.columnId,
            })
        } else {
            // Check if there's a preselected model from ModelsList
            const preselectedModel = localStorage.getItem('selectedLoadModel')
            if (preselectedModel) {
                const model = JSON.parse(preselectedModel)
                setFormData({
                    title: model.title || '',
                    origin: model.origin || '',
                    destination: model.destination || '',
                    value: '',
                    date: '',
                    priority: 'normal',
                    columnId: 'registration',
                })
                // Clear the stored model after using it
                localStorage.removeItem('selectedLoadModel')
            } else {
                setFormData({
                    title: '',
                    origin: '',
                    destination: '',
                    value: '',
                    date: new Date().toLocaleDateString('pt-BR'),
                    priority: 'normal',
                    columnId: 'registration',
                })
            }
        }
        setSaveAsModel(false)
        setModelName('')
    }, [card, isOpen])

    const handleModelSelect = (modelId: string) => {
        const model = loadModels.find(m => m.id === modelId)
        if (model) {
            setFormData(prev => ({
                ...prev,
                title: model.name, // Or keep user input? Let's use model name as title suggestion
                origin: model.origin,
                destination: model.destination,
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (card) {
            updateCard(card.id, formData)
        } else {
            addCard(formData)
        }

        if (saveAsModel && modelName && !card) {
            try {
                await supabase.from('load_models').insert([{
                    name: modelName,
                    origin: formData.origin,
                    destination: formData.destination,
                    type: 'Carga Geral', // Default or add field
                    vehicle_type: 'Truck' // Default or add field
                }])
            } catch (error) {
                console.error('Error saving model:', error)
            }
        }

        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card max-w-lg border-white/40 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                        {card ? 'Editar Carga' : 'Nova Carga'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                    {!card && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Carregar Modelo (Opcional)</Label>
                            <Select onValueChange={handleModelSelect}>
                                <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                    <SelectValue placeholder={isLoadingModels ? "Carregando..." : "Selecione um modelo..."} />
                                </SelectTrigger>
                                <SelectContent className="glass-card border-white/40">
                                    {loadModels.map(model => (
                                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="origin" className="text-sm font-medium text-muted-foreground">Origem</Label>
                                <Input
                                    id="origin"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                    placeholder="São Paulo, SP"
                                    className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination" className="text-sm font-medium text-muted-foreground">Destino</Label>
                                <Input
                                    id="destination"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    placeholder="Campinas, SP"
                                    className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium text-muted-foreground">Título da Rota</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: SP → Campinas"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="value" className="text-sm font-medium text-muted-foreground">Valor</Label>
                                <Input
                                    id="value"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="R$ 2.500"
                                    className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-medium text-muted-foreground">Data</Label>
                                <Input
                                    id="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    placeholder="14/03/2024"
                                    className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground">Prioridade</Label>
                                <Select value={formData.priority} onValueChange={(value: 'high' | 'normal') => setFormData({ ...formData, priority: value })}>
                                    <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-card border-white/40">
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="column" className="text-sm font-medium text-muted-foreground">Estágio</Label>
                                <Select value={formData.columnId} onValueChange={(value) => setFormData({ ...formData, columnId: value })}>
                                    <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-card border-white/40">
                                        <SelectItem value="registration">Cadastro</SelectItem>
                                        <SelectItem value="broadcast">Divulgação</SelectItem>
                                        <SelectItem value="initial_service">Atendimento</SelectItem>
                                        <SelectItem value="documentation">Documentação</SelectItem>
                                        <SelectItem value="risk">Risco</SelectItem>
                                        <SelectItem value="contract">Contratação</SelectItem>
                                        <SelectItem value="loading">Carregamento</SelectItem>
                                        <SelectItem value="transit">Trânsito</SelectItem>
                                        <SelectItem value="unloading">Descarga</SelectItem>
                                        <SelectItem value="completed">Finalização</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!card && (
                            <div className="pt-2 space-y-2 border-t border-white/20">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="saveAsModel"
                                        checked={saveAsModel}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveAsModel(e.target.checked)}
                                        className="border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor="saveAsModel" className="text-sm font-medium text-muted-foreground cursor-pointer">
                                        Salvar como novo modelo
                                    </Label>
                                </div>
                                {saveAsModel && (
                                    <Input
                                        value={modelName}
                                        onChange={(e) => setModelName(e.target.value)}
                                        placeholder="Nome do Modelo (ex: Rota SP-RJ Padrão)"
                                        className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                        required={saveAsModel}
                                    />
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 hover:bg-white/40 text-muted-foreground hover:text-foreground">
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20">
                                {card ? 'Salvar' : 'Criar Carga'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
