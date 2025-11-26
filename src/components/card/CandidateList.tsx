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
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wide">{activeCandidates.length} motoristas interessados</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-200 rounded-none font-bold uppercase">
                        <Clock className="w-3 h-3 mr-1" /> Tempo médio: 5min
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono font-bold">ID: {loadId}</span>
                    <Button size="sm" variant="ghost" onClick={() => fetchCandidates(loadId)} className="h-6 w-6 p-0 rounded-none hover:bg-muted border-2 border-transparent hover:border-border">
                        R
                    </Button>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-blue-600 border-2 border-blue-200 hover:bg-blue-50 rounded-none font-bold uppercase shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                            <Plus className="w-4 h-4 mr-1" /> Convidar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-2 border-border shadow-brutal p-6 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight">Convidar Motorista</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {drivers.map(driver => (
                                <div key={driver.id} className="flex items-center justify-between p-2 hover:bg-muted/50 border-2 border-transparent hover:border-border transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-foreground rounded-none">
                                            <AvatarImage src={driver.photo} />
                                            <AvatarFallback className="rounded-none font-bold">{driver.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-bold text-foreground uppercase">{driver.name}</p>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">{driver.vehicle}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleInvite(driver.id)} className="rounded-none font-bold uppercase shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all border-2 border-primary">Convidar</Button>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm font-bold uppercase">Carregando candidatos...</div>
                ) : activeCandidates.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border bg-muted/10">
                        <p className="text-muted-foreground text-sm font-bold uppercase">Nenhum candidato ainda.</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Divulgue a carga ou convide motoristas.</p>
                    </div>
                ) : (
                    activeCandidates.map((candidate) => (
                        <div key={candidate.id} className="bg-card border-2 border-border p-3 flex items-center justify-between shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-foreground rounded-none">
                                    <AvatarImage src={candidate.driver.avatar_url} />
                                    <AvatarFallback className="rounded-none font-bold">{candidate.driver.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-black text-foreground uppercase">{candidate.driver.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase">
                                        <span className="flex items-center text-amber-600">
                                            <Star className="w-3 h-3 fill-current mr-0.5" /> {candidate.driver.rating}
                                        </span>
                                        <span>• {candidate.driver.vehicle}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-black text-foreground">
                                        {candidate.bidValue ? `R$ ${candidate.bidValue}` : 'A combinar'}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-bold">
                                        {new Date(candidate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-none border-2 border-transparent hover:border-red-200"
                                        onClick={() => handleReject(candidate.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded-none shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-green-800"
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
