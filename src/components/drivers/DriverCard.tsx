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

export function DriverCard({ driver }: DriverCardProps) {
    return (
        <div className="glass-hover group">
            <CardHeader className="p-5 space-y-4">
                {/* Avatar & Status */}
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden border-2 border-white shadow-sm">
                            <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-sm ${driver.status === 'available' ? 'bg-emerald-400' :
                            driver.status === 'busy' ? 'bg-red-400' : 'bg-gray-300'
                            }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-base truncate">{driver.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                            <span className="text-sm font-bold text-gray-700">{driver.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <Badge className={`
            ${driver.status === 'available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            driver.status === 'busy' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'}
            border font-semibold text-xs px-3
          `}>
                        {driver.status === 'available' ? 'Disponível' : driver.status === 'busy' ? 'Em Rota' : 'Offline'}
                    </Badge>
                </div>

                {/* Info */}
                <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-4 h-4 text-[#6B8CAE]" strokeWidth={2} />
                        </div>
                        <span className="font-medium truncate">{driver.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-purple-500" strokeWidth={2} />
                        </div>
                        <span className="font-medium truncate">{driver.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                        </div>
                        <span className="font-semibold text-emerald-700">Documentação OK</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 glass-card border-gray-200/50 hover:bg-gray-100/60" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                    </Button>
                    <Button className="flex-1 btn-soft-blue" size="sm">
                        Ver Perfil
                    </Button>
                </div>
            </CardHeader>
        </div>
    )
}
