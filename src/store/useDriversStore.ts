import { create } from 'zustand'
import { api } from '@/lib/api'

export interface Driver {
    id: string
    name: string
    photo: string
    rating: number
    phone: string
    location: string
    vehicle: string
    status: 'available' | 'busy' | 'offline'
    cnh: string
    cpf: string
}

interface DriversState {
    drivers: Driver[]
    fetchDrivers: () => Promise<void>
    addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>
    updateDriver: (id: string, driver: Partial<Driver>) => Promise<void>
    deleteDriver: (id: string) => Promise<void>
    subscribeToDrivers: () => () => void
}

export const useDriversStore = create<DriversState>((set) => ({
    drivers: [],

    fetchDrivers: async () => {
        try {
            const response = await api.getDrivers()
            const data = response.drivers

            if (!data) {
                console.warn('No drivers data received')
                return
            }

            const mappedDrivers: Driver[] = data.map((item: any) => ({
                id: item.id,
                name: item.name || 'Motorista',
                photo: item.photo || 'https://i.pravatar.cc/150',
                rating: 5.0, // Default rating
                phone: item.phone || '',
                location: 'Disponível',
                vehicle: item.vehicle_type || 'Não informado',
                status: 'available',
                cnh: item.cpf_cnpj || '',
                cpf: item.cpf_cnpj || ''
            }))

            set({ drivers: mappedDrivers })
        } catch (error) {
            console.error('Error fetching drivers:', error)
        }
    },

    addDriver: async (_driver) => {
        console.log('Add driver not implemented for local API yet')
        // TODO: Implement when needed
    },

    updateDriver: async (_id, _updatedDriver) => {
        console.log('Update driver not implemented for local API yet')
        // TODO: Implement when needed
    },

    deleteDriver: async (_id) => {
        console.log('Delete driver not implemented for local API yet')
        // TODO: Implement when needed
    },

    subscribeToDrivers: () => {
        console.log('Real-time subscriptions disabled for local API')
        return () => {
            // No-op
        }
    }
}))
