import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw, LogOut, Smartphone, QrCode, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

export default function WhatsAppSettings() {
    const [status, setStatus] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [connectedNumber, setConnectedNumber] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [useAsSystemPhone, setUseAsSystemPhone] = useState(false)

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    const fetchStatus = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/v1/whatsapp/status`)
            const data = await response.json()

            let state = data.state
            if (!state && data.instance && data.instance.state) {
                state = data.instance.state
            }

            if (state) {
                // Evolution API returns 'open', 'close', 'connecting'
                setStatus(state)

                if (state === 'open') {
                    // Fetch connected number
                    try {
                        const phoneResponse = await fetch(`${apiUrl}/api/v1/whatsapp/system-phone`)
                        const phoneData = await phoneResponse.json()
                        if (phoneData.phone) {
                            setConnectedNumber(phoneData.phone)
                        }
                    } catch (e) {
                        console.error('Error fetching phone:', e)
                    }
                }
            } else if (data.status) {
                // Fallback
                setStatus(data.status)
            }

            // If we have instance info, we might get the number
            // Note: Evolution API might not return the number directly in connectionState
            // We might need to fetch instance info separately or parse it if available
            // For now, let's assume if it's open, we are good.

        } catch (error) {
            console.error('Error fetching status:', error)
            setStatus('unknown')
        }
    }

    const handleConnect = async () => {
        setIsLoading(true)
        setQrCode(null)
        try {
            const response = await fetch(`${apiUrl}/api/v1/whatsapp/connect`)
            const data = await response.json()

            if (data.qrcode && data.qrcode.base64) {
                // Remove prefix if present
                const base64 = data.qrcode.base64.replace('data:image/png;base64,', '')
                setQrCode(base64)
            } else if (data.base64) {
                setQrCode(data.base64.replace('data:image/png;base64,', ''))
            } else if (data.code) {
                // Sometimes it returns just the code string for QR generation
                setQrCode(data.code)
            }

            setStatus('connecting')
        } catch (error) {
            console.error('Error connecting:', error)
            alert('Erro ao iniciar conexão')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        if (!confirm('Tem certeza que deseja desconectar?')) return

        setIsLoading(true)
        try {
            await fetch(`${apiUrl}/api/v1/whatsapp/logout`, { method: 'POST' })
            setStatus('close')
            setQrCode(null)
            setConnectedNumber(null)
        } catch (error) {
            console.error('Error logging out:', error)
            alert('Erro ao desconectar')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        // Poll status every 5 seconds if connecting or open
        const interval = setInterval(() => {
            fetchStatus()
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="p-8 space-y-8 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-black text-foreground uppercase tracking-tight">Configuração WhatsApp</h1>
                    <p className="text-muted-foreground font-medium mt-2">Gerencie a conexão com a API do Evolution</p>
                </div>
                <Button variant="outline" onClick={fetchStatus} className="border-2 border-border font-bold uppercase">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Status
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Connection Status Card */}
                <Card className="border-2 border-border shadow-brutal rounded-none">
                    <CardHeader className="border-b-2 border-border bg-muted/10">
                        <CardTitle className="flex items-center gap-2 uppercase">
                            <Smartphone className="w-5 h-5" />
                            Status da Conexão
                        </CardTitle>
                        <CardDescription>Estado atual da instância do WhatsApp</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-card border-2 border-border shadow-brutal-sm">
                            <span className="font-bold uppercase text-sm text-muted-foreground">Estado Atual</span>
                            <Badge
                                variant={status === 'open' ? 'default' : status === 'connecting' ? 'secondary' : 'destructive'}
                                className="text-sm px-3 py-1 rounded-none font-bold uppercase"
                            >
                                {status === 'open' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {status === 'connecting' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {status === 'close' && <XCircle className="w-4 h-4 mr-2" />}
                                {status === 'unknown' && <AlertTriangle className="w-4 h-4 mr-2" />}
                                {status === 'open' ? 'Conectado' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                            </Badge>
                        </div>

                        {status === 'open' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800">
                                    <p className="font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" />
                                        WhatsApp Conectado com Sucesso!
                                    </p>
                                    <p className="text-sm mt-1">O sistema está pronto para enviar e receber mensagens.</p>
                                    {connectedNumber && (
                                        <p className="text-lg font-black mt-2">
                                            Número: +{connectedNumber}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Usar como Telefone do Sistema</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Substituir automaticamente o número de contato do sistema pelo número conectado.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={useAsSystemPhone}
                                        onCheckedChange={setUseAsSystemPhone}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>

                                <Button
                                    variant="destructive"
                                    className="w-full font-bold uppercase rounded-none shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    onClick={handleLogout}
                                    disabled={isLoading}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Desconectar
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Para conectar, clique no botão abaixo e escaneie o QR Code com seu WhatsApp.
                                </p>
                                <Button
                                    className="w-full bg-primary text-primary-foreground font-bold uppercase rounded-none shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    onClick={handleConnect}
                                    disabled={isLoading || status === 'connecting'}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                                    Gerar QR Code
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* QR Code Display */}
                {(status === 'close' || status === 'connecting') && (
                    <Card className="border-2 border-border shadow-brutal rounded-none">
                        <CardHeader className="border-b-2 border-border bg-muted/10">
                            <CardTitle className="flex items-center gap-2 uppercase">
                                <QrCode className="w-5 h-5" />
                                Escanear QR Code
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                            {qrCode ? (
                                <div className="space-y-4 text-center animate-in fade-in zoom-in duration-300">
                                    <div className="p-4 bg-white border-4 border-black inline-block">
                                        {/* If it's a raw string (not base64 image), use QRCodeSVG */}
                                        {qrCode.length < 200 ? (
                                            <QRCodeSVG value={qrCode} size={256} />
                                        ) : (
                                            <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground uppercase animate-pulse">
                                        Aguardando leitura...
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <QrCode className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Clique em "Gerar QR Code" para iniciar</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
