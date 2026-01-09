import { create } from 'zustand'
import { api } from '@/lib/apiClient'

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

    addDriver: async (driver) => {
        try {
            const driverData = {
                name: driver.name,
                phone: driver.phone,
                cpf_cnpj: driver.cpf || driver.cnh,
                vehicle_type: driver.vehicle,
                photo: driver.photo
            }

            const response = await api.createDriver(driverData)

            if (response.success) {
                // Refresh drivers to get the latest data
                await useDriversStore.getState().fetchDrivers()
            }
        } catch (error) {
            console.error('Error adding driver:', error)
            throw error
        }
    },

    updateDriver: async (id, updatedDriver) => {
        try {
            const updateData: any = {}
            if (updatedDriver.name) updateData.name = updatedDriver.name
            if (updatedDriver.phone) updateData.phone = updatedDriver.phone
            if (updatedDriver.cpf || updatedDriver.cnh) updateData.cpf_cnpj = updatedDriver.cpf || updatedDriver.cnh
            if (updatedDriver.vehicle) updateData.vehicle_type = updatedDriver.vehicle
            if (updatedDriver.photo) updateData.photo = updatedDriver.photo

            const response = await api.updateDriver(id, updateData)

            if (response.success) {
                // Refresh drivers to get the latest data
                await useDriversStore.getState().fetchDrivers()
            }
        } catch (error) {
            console.error('Error updating driver:', error)
            throw error
        }
    },

    deleteDriver: async (id) => {
        try {
            const response = await api.deleteDriver(id)

            if (response.success) {
                // Optimistically remove from local state
                set((state) => ({
                    drivers: state.drivers.filter((d) => d.id !== id)
                }))
            }
        } catch (error) {
            console.error('Error deleting driver:', error)
            // Refresh to revert optimistic update on error
            await useDriversStore.getState().fetchDrivers()
            throw error
        }
    },

    subscribeToDrivers: () => {
        console.log('Real-time subscriptions disabled for local API')
        return () => {
            // No-op
        }
    }
}))
