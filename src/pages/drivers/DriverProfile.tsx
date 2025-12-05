import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Star, Phone, MapPin, Truck, FileCheck, Package, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDriversStore } from '@/store/useDriversStore'

interface LoadHistory {
    id: string
    title: string
    origin: string
    destination: string
    value: string
    status: string
    date: string
    column_id: string
}

interface DriverProfileData {
    driver: {
        id: string
        name: string
        phone: string
        vehicle: string
        location: string
        rating: number
        photo: string
        status: 'available' | 'busy' | 'offline'
    }
    active_load: LoadHistory | null
    history: LoadHistory[]
}

export default function DriverProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<DriverProfileData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/v1/drivers/${id}/profile`)
                if (response.ok) {
                    const data = await response.json()
                    setProfile(data)
                } else {
                    console.error('Failed to fetch profile')
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (id) {
            fetchProfile()
        }
    }, [id, apiUrl])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <h1 className="text-2xl font-bold">Motorista não encontrado</h1>
                <Button onClick={() => navigate('/motoristas')}>Voltar</Button>
            </div>
        )
    }

    const { driver, active_load, history } = profile

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen p-8 bg-background space-y-8"
        >
            {/* Header / Back */}
            <div className="max-w-7xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/motoristas')}
                    className="mb-6 pl-0 hover:bg-transparent hover:text-primary font-bold uppercase"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar para Lista
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="space-y-6">
                        <Card className="border-2 border-border shadow-brutal rounded-none overflow-hidden">
                            <div className="h-32 bg-muted relative border-b-2 border-border">
                                <div className="absolute -bottom-12 left-6">
                                    <div className="w-24 h-24 rounded-none border-4 border-background bg-muted overflow-hidden">
                                        <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>
                            <CardContent className="pt-16 pb-6 px-6 space-y-6">
                                <div>
                                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">{driver.name}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Star className="w-4 h-4 fill-primary text-primary" />
                                        <span className="font-bold">{(driver.rating || 0).toFixed(1)}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <Badge variant={driver.status === 'available' ? 'default' : 'secondary'} className="rounded-none uppercase font-bold">
                                            {driver.status === 'available' ? 'Disponível' : driver.status === 'busy' ? 'Em Rota' : 'Offline'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t-2 border-border">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-mono">{driver.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Truck className="w-4 h-4 text-muted-foreground" />
                                        <span className="uppercase font-bold">{driver.vehicle}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span className="uppercase">{driver.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <FileCheck className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-emerald-700 uppercase">Documentação Verificada</span>
                                    </div>
                                </div>

                                <Button className="w-full font-bold uppercase rounded-none shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Entrar em Contato
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Active Load & History */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Active Load Section */}
                        {active_load && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                    <Package className="w-6 h-6 text-primary" />
                                    Carga Ativa
                                </h2>
                                <Card className="border-2 border-primary bg-primary/5 shadow-brutal rounded-none">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold uppercase">{active_load.title}</h3>
                                                <p className="text-sm text-muted-foreground font-mono">ID: {active_load.id}</p>
                                            </div>
                                            <Badge className="self-start rounded-none bg-primary text-primary-foreground uppercase font-bold">
                                                {active_load.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t-2 border-primary/20">
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Origem</span>
                                                <p className="font-bold">{active_load.origin}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Destino</span>
                                                <p className="font-bold">{active_load.destination}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Valor</span>
                                                <p className="font-mono font-bold text-emerald-600">{active_load.value}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Data</span>
                                                <p className="font-mono">{new Date(active_load.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* History Section */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Clock className="w-6 h-6 text-muted-foreground" />
                                Histórico de Viagens
                            </h2>

                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((load) => (
                                        <Card key={load.id} className="border-2 border-border shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all rounded-none">
                                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="font-bold uppercase">{load.title}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <span>{load.origin}</span>
                                                        <span>→</span>
                                                        <span>{load.destination}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="font-mono font-bold text-sm">{load.value}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(load.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-2 border-border border-dashed bg-muted/20 rounded-none">
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        <p>Nenhuma viagem concluída no histórico.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
