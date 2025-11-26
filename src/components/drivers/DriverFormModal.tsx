import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDriversStore, type Driver } from '@/store/useDriversStore'
import { useState, useEffect } from 'react'

interface DriverFormModalProps {
    isOpen: boolean
    onClose: () => void
    driver?: Driver | null
}

export function DriverFormModal({ isOpen, onClose, driver }: DriverFormModalProps) {
    const { addDriver, updateDriver } = useDriversStore()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        vehicle: '',
        status: 'available' as 'available' | 'busy' | 'offline',
        cnh: '',
        cpf: '',
        photo: 'https://i.pravatar.cc/150?u=new',
        rating: 5.0
    })

    useEffect(() => {
        if (driver) {
            setFormData({
                name: driver.name,
                phone: driver.phone,
                location: driver.location,
                vehicle: driver.vehicle,
                status: driver.status,
                cnh: driver.cnh,
                cpf: driver.cpf,
                photo: driver.photo,
                rating: driver.rating
            })
        } else {
            setFormData({
                name: '',
                phone: '',
                location: '',
                vehicle: '',
                status: 'available',
                cnh: '',
                cpf: '',
                photo: `https://i.pravatar.cc/150?u=${Date.now()}`,
                rating: 5.0
            })
        }
    }, [driver, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (driver) {
            updateDriver(driver.id, formData)
        } else {
            addDriver(formData)
        }

        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card max-w-lg border-white/40 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading font-bold text-foreground">
                        {driver ? 'Editar Motorista' : 'Novo Motorista'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: João Silva"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Telefone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm font-medium text-muted-foreground">Localização Atual</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Cidade, UF"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehicle" className="text-sm font-medium text-muted-foreground">Veículo</Label>
                        <Input
                            id="vehicle"
                            value={formData.vehicle}
                            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                            placeholder="Ex: Volvo FH 540"
                            className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-sm font-medium text-muted-foreground">CPF</Label>
                            <Input
                                id="cpf"
                                value={formData.cpf}
                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnh" className="text-sm font-medium text-muted-foreground">CNH</Label>
                            <Input
                                id="cnh"
                                value={formData.cnh}
                                onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                                placeholder="00000000000"
                                className="input-soft bg-white/50 border-white/40 focus:bg-white/80"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status</Label>
                        <Select value={formData.status} onValueChange={(value: 'available' | 'busy' | 'offline') => setFormData({ ...formData, status: value })}>
                            <SelectTrigger className="input-soft bg-white/50 border-white/40 focus:bg-white/80">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-white/40">
                                <SelectItem value="available">Disponível</SelectItem>
                                <SelectItem value="busy">Em Rota</SelectItem>
                                <SelectItem value="offline">Indisponível</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 hover:bg-white/40 text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20">
                            {driver ? 'Salvar Alterações' : 'Cadastrar Motorista'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
