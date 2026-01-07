import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Save, Upload, Bot, BrainCircuit, ArrowLeft } from 'lucide-react'

// Mock API calls - in real app, use axios/fetch to call backend
const API_URL = 'https://ekimcihxrnigghnappjv.supabase.co/functions/v1/api/v1/admin'

export default function AgentAdmin() {
    const navigate = useNavigate()
    const [config, setConfig] = useState({
        model: 'gemini-2.0-flash-exp',
        system_prompt: '',
        temperature: 0.7
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/config`)
            const data = await res.json()
            setConfig(data)
        } catch (error) {
            console.error('Error fetching config:', error)
            // Fallback for demo if backend not running
            setConfig({
                model: 'gemini-1.5-flash',
                system_prompt: 'Você é um assistente logístico experiente. Seja direto e útil.',
                temperature: 0.7
            })
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await fetch(`${API_URL}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            alert('Configurações salvas com sucesso!')
        } catch (error) {
            console.error('Error saving config:', error)
            alert('Erro ao salvar configurações.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-none border-2 border-primary shadow-brutal-sm">
                        <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Inteligência do Agente</h1>
                        <p className="text-muted-foreground font-medium">Configure o cérebro e a personalidade do seu assistente logístico.</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    className="rounded-none border-2 border-transparent hover:border-border hover:bg-accent transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Configuration */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-2 shadow-brutal">
                        <CardHeader className="border-b-2 bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5" />
                                Parâmetros do Modelo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Modelo de IA</Label>
                                <Select
                                    value={config.model}
                                    onValueChange={(val) => setConfig({ ...config, model: val })}
                                >
                                    <SelectTrigger className="rounded-none border-2 border-border shadow-brutal-sm">
                                        <SelectValue placeholder="Selecione o modelo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-2.0-flash-exp">🔥 Google Gemini 2.0 Flash (Experimental)</SelectItem>
                                        <SelectItem value="gemini-1.5-flash">Google Gemini 1.5 Flash (Rápido)</SelectItem>
                                        <SelectItem value="gemini-1.5-pro">Google Gemini 1.5 Pro (Avançado)</SelectItem>
                                        <SelectItem value="gpt-4o">OpenAI GPT-4o (Latest)</SelectItem>
                                        <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini (Econômico)</SelectItem>
                                        <SelectItem value="gpt-4-turbo">OpenAI GPT-4 Turbo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>System Prompt (Personalidade & Regras)</Label>
                                <Textarea
                                    className="min-h-[300px] font-mono text-sm rounded-none border-2 border-border shadow-brutal-sm focus:shadow-brutal transition-all"
                                    value={config.system_prompt}
                                    onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                                    placeholder="Defina como o agente deve se comportar..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Defina aqui as "Hard Rules" de comportamento, tom de voz e restrições operacionais.
                                </p>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full md:w-auto rounded-none shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-primary font-bold uppercase"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Salvando...' : 'Salvar Configurações'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* RAG / Knowledge Base */}
                <div className="space-y-6">
                    <Card className="border-2 shadow-brutal">
                        <CardHeader className="border-b-2 bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Base de Conhecimento (RAG)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-none p-8 text-center hover:bg-muted/10 transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Arraste arquivos PDF ou TXT</p>
                                <p className="text-xs text-muted-foreground mt-1">Manuais, Tabelas de Frete, Regras</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-bold uppercase">Arquivos Indexados</h4>
                                <div className="text-sm text-muted-foreground italic">Nenhum arquivo indexado.</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
