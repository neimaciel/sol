import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, Check, X, Plus } from 'lucide-react'
import { useCandidatesStore } from '@/store/useCandidatesStore'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useDriversStore } from '@/store/useDriversStore'

interface CandidateListProps {
    loadId: string
    onSelectCandidate: (candidateId: string) => void
}

export function CandidateList({ loadId, onSelectCandidate }: CandidateListProps) {
    const { candidates, fetchCandidates, addCandidate, updateCandidateStatus, isLoading } = useCandidatesStore()
    const { drivers, fetchDrivers } = useDriversStore()
    const [isInviteOpen, setIsInviteOpen] = useState(false)

    useEffect(() => {
        console.log('CandidateList mounted with loadId:', loadId)
        fetchCandidates(loadId)
        fetchDrivers()
    }, [loadId, fetchCandidates, fetchDrivers])

    const handleInvite = async (driverId: string) => {
        await addCandidate(loadId, driverId)
        setIsInviteOpen(false)
    }

    const handleReject = async (candidateId: string) => {
        await updateCandidateStatus(candidateId, 'rejected')
    }

    const activeCandidates = candidates.filter(c => c.status !== 'rejected')

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">{activeCandidates.length} motoristas interessados</h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <Clock className="w-3 h-3 mr-1" /> Tempo médio: 5min
                    </Badge>
                    <span className="text-xs text-gray-400">ID: {loadId}</span>
                    <Button size="sm" variant="ghost" onClick={() => fetchCandidates(loadId)} className="h-6 w-6 p-0">
                        R
                    </Button>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Plus className="w-4 h-4 mr-1" /> Convidar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card">
                        <DialogHeader>
                            <DialogTitle>Convidar Motorista</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {drivers.map(driver => (
                                <div key={driver.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={driver.photo} />
                                            <AvatarFallback>{driver.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{driver.name}</p>
                                            <p className="text-xs text-gray-500">{driver.vehicle}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleInvite(driver.id)}>Convidar</Button>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Carregando candidatos...</div>
                ) : activeCandidates.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="text-gray-500 text-sm">Nenhum candidato ainda.</p>
                        <p className="text-xs text-gray-400 mt-1">Divulgue a carga ou convide motoristas.</p>
                    </div>
                ) : (
                    activeCandidates.map((candidate) => (
                        <div key={candidate.id} className="glass-card p-3 flex items-center justify-between hover:bg-white/60 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                    <AvatarImage src={candidate.driver.avatar_url} />
                                    <AvatarFallback>{candidate.driver.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">{candidate.driver.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="flex items-center text-amber-500 font-bold">
                                            <Star className="w-3 h-3 fill-current mr-0.5" /> {candidate.driver.rating}
                                        </span>
                                        <span>• {candidate.driver.vehicle}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">
                                        {candidate.bidValue ? `R$ ${candidate.bidValue}` : 'A combinar'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(candidate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleReject(candidate.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg shadow-green-600/20"
                                        onClick={() => onSelectCandidate(candidate.id)}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
