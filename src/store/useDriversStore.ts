import { create } from 'zustand'
import { api } from '@/lib/apiClient'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

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
                logger.warn('No drivers data received')
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
            logger.error('Error fetching drivers:', error)
            const message = error instanceof Error ? error.message : 'Erro ao buscar motoristas'
            toast.error(message)
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
                toast.success('Motorista criado com sucesso!')
            }
        } catch (error) {
            logger.error('Error adding driver:', error)
            const message = error instanceof Error ? error.message : 'Erro ao criar motorista'
            toast.error(message)
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
                toast.success('Motorista atualizado com sucesso!')
            }
        } catch (error) {
            logger.error('Error updating driver:', error)
            const message = error instanceof Error ? error.message : 'Erro ao atualizar motorista'
            toast.error(message)
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
                toast.success('Motorista excluído com sucesso!')
            }
        } catch (error) {
            logger.error('Error deleting driver:', error)
            const message = error instanceof Error ? error.message : 'Erro ao excluir motorista'
            toast.error(message)
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
