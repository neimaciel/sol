import { Truck, Box, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function VehicleRequirements() {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">Requisitos do Veículo</h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-foreground bg-muted/30 px-3 py-2 border-2 border-border shadow-brutal-sm">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold uppercase">Truck</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground bg-muted/30 px-3 py-2 border-2 border-border shadow-brutal-sm">
                        <Box className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold uppercase">Baú</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground bg-muted/30 px-3 py-2 border-2 border-border shadow-brutal-sm">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold uppercase">Rastreador</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-black text-foreground mb-3 uppercase tracking-wide">Tags</h3>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80 border-2 border-border rounded-none font-bold uppercase">Carga Completa</Badge>
                    <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted/80 border-2 border-border rounded-none font-bold uppercase">Baú</Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-200 rounded-none font-bold uppercase">Urgente</Badge>
                </div>
            </div>
        </div>
    )
}
