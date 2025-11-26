import { Truck, Box, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function VehicleRequirements() {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Requisitos do Veículo</h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Truck className="w-4 h-4 text-[#6B8CAE]" />
                        <span className="text-sm font-medium">Truck</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Box className="w-4 h-4 text-[#6B8CAE]" />
                        <span className="text-sm font-medium">Baú</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <ShieldCheck className="w-4 h-4 text-[#6B8CAE]" />
                        <span className="text-sm font-medium">Rastreador</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Tags</h3>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">Carga Completa</Badge>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">Baú</Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Urgente</Badge>
                </div>
            </div>
        </div>
    )
}
