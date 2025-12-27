import { useEffect } from 'react'
import { useCandidatesStore } from '@/store/useCandidatesStore'
import { motion } from 'framer-motion'
import { User, Truck, Phone, MessageCircle, CheckCircle } from 'lucide-react'

interface CandidateListProps {
    loadId: string
    onSelectCandidate?: (driverId: string) => void
    onChatClick?: (candidate: any) => void
}

export default function CandidateList({ loadId, onSelectCandidate, onChatClick }: CandidateListProps) {
    const { candidates, loading, fetchCandidates, selectCandidate } = useCandidatesStore()

    useEffect(() => {
        fetchCandidates(loadId)
    }, [loadId, fetchCandidates])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (candidates.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <p>Nenhum candidato ainda.</p>
                <p className="text-sm mt-1">Divulgue a carga para receber propostas.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {candidates.map((candidate) => (
                <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border-2 p-4 flex items-center justify-between gap-4 transition-colors ${candidate.status === 'selected'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : candidate.status === 'rejected'
                            ? 'border-zinc-200 opacity-60'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-zinc-500" />
                        </div>

                        <div>
                            <h3 className="font-bold text-zinc-900">{candidate.driver.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    {candidate.driver.vehicle_type}
                                    {candidate.driver.vehicle_plate && ` • ${candidate.driver.vehicle_plate}`}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {candidate.driver.phone}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${candidate.status === 'selected' ? 'bg-emerald-100 text-emerald-700' :
                            candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                candidate.status === 'negotiating' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                            }`}>
                            {candidate.status === 'selected' ? 'Selecionado' :
                                candidate.status === 'rejected' ? 'Rejeitado' :
                                    candidate.status === 'negotiating' ? 'Negociando' :
                                        'Pendente'}
                        </div>

                        {/* Actions */}
                        {candidate.status !== 'rejected' && (
                            <div className="flex items-center gap-1 pl-2 border-l border-zinc-200 ml-2">
                                <button
                                    className="p-2 hover:bg-zinc-100 rounded text-zinc-600 hover:text-blue-600 transition-colors"
                                    title="Abrir Chat"
                                    onClick={() => onChatClick && onChatClick(candidate)}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>

                                {candidate.status !== 'selected' && (
                                    <button
                                        onClick={async () => {
                                            await selectCandidate(candidate.id)
                                            if (onSelectCandidate) {
                                                onSelectCandidate(candidate.driver_id)
                                            }
                                        }}
                                        className="p-2 hover:bg-emerald-50 rounded text-zinc-600 hover:text-emerald-600 transition-colors"
                                        title="Selecionar Motorista"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
