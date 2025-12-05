import { CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Phone, MapPin, Truck, FileCheck } from 'lucide-react'

interface Driver {
    id: string
    name: string
    photo: string
    rating: number
    phone: string
    location: string
    vehicle: string
    status: 'available' | 'busy' | 'offline'
}

interface DriverCardProps {
    driver: Driver
}

import { useNavigate } from 'react-router-dom'

export function DriverCard({ driver }: DriverCardProps) {
    const navigate = useNavigate()

    return (
        <div className="bg-card border-2 border-border shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
            <CardHeader className="p-5 space-y-4">
                {/* Avatar & Status */}
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-none bg-muted overflow-hidden border-2 border-border">
                            <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-none border-2 border-border ${driver.status === 'available' ? 'bg-emerald-400' :
                            driver.status === 'busy' ? 'bg-red-400' : 'bg-gray-300'
                            }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-foreground text-base truncate uppercase">{driver.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Star className="w-4 h-4 fill-foreground text-foreground" strokeWidth={0} />
                            <span className="text-sm font-bold text-foreground">{(driver.rating || 0).toFixed(1)}</span>
                        </div>
                    </div>
                    <Badge className={`
            ${driver.status === 'available' ? 'bg-emerald-100 text-emerald-900 border-emerald-900' :
                            driver.status === 'busy' ? 'bg-red-100 text-red-900 border-red-900' :
                                'bg-gray-100 text-gray-900 border-gray-900'}
            border-2 font-bold text-xs px-2 rounded-none uppercase
          `}>
                        {driver.status === 'available' ? 'Disponível' : driver.status === 'busy' ? 'Em Rota' : 'Offline'}
                    </Badge>
                </div>

                {/* Info */}
                <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-none bg-primary/10 border-2 border-border flex items-center justify-center flex-shrink-0">
                            <Truck className="w-4 h-4 text-primary" strokeWidth={2} />
                        </div>
                        <span className="font-bold truncate uppercase">{driver.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-none bg-primary/10 border-2 border-border flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-primary" strokeWidth={2} />
                        </div>
                        <span className="font-bold truncate uppercase">{driver.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-none bg-emerald-100 border-2 border-border flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-4 h-4 text-emerald-900" strokeWidth={2} />
                        </div>
                        <span className="font-black text-emerald-700 uppercase">Documentação OK</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-border font-bold uppercase hover:bg-accent" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                    </Button>
                    <Button
                        className="flex-1 rounded-none border-2 border-primary shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-bold uppercase"
                        size="sm"
                        onClick={() => navigate(`/motoristas/${driver.id}`)}
                    >
                        Ver Perfil
                    </Button>
                </div>
            </CardHeader>
        </div>
    )
}
