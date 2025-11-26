import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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
        const { data, error } = await supabase
            .from('drivers')
            .select('*')

        if (error) {
            console.error('Error fetching drivers:', error)
            return
        }

        const mappedDrivers: Driver[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            photo: item.avatar_url || 'https://i.pravatar.cc/150',
            rating: item.rating,
            phone: item.phone,
            location: item.location,
            vehicle: item.vehicle,
            status: item.status,
            cnh: item.cnh,
            cpf: item.cpf
        }))

        set({ drivers: mappedDrivers })
    },

    addDriver: async (driver) => {
        // Optimistic update
        const tempId = Math.random().toString(36).substr(2, 9)
        set((state) => ({
            drivers: [...state.drivers, { ...driver, id: tempId }],
        }))

        const { data, error } = await supabase
            .from('drivers')
            .insert([{
                name: driver.name,
                phone: driver.phone,
                vehicle: driver.vehicle,
                location: driver.location,
                status: driver.status,
                rating: driver.rating,
                cnh: driver.cnh,
                cpf: driver.cpf,
                avatar_url: driver.photo
            }])
            .select()

        if (error) {
            console.error('Error adding driver:', error)
            // Revert optimistic update
            set((state) => ({
                drivers: state.drivers.filter((d) => d.id !== tempId),
            }))
        } else if (data) {
            // Update with real ID
            set((state) => ({
                drivers: state.drivers.map((d) =>
                    d.id === tempId ? { ...d, id: data[0].id } : d
                ),
            }))
        }
    },

    updateDriver: async (id, updatedDriver) => {
        // Optimistic update
        set((state) => ({
            drivers: state.drivers.map((driver) =>
                driver.id === id ? { ...driver, ...updatedDriver } : driver
            ),
        }))

        const dbUpdate: any = {}
        if (updatedDriver.name) dbUpdate.name = updatedDriver.name
        if (updatedDriver.phone) dbUpdate.phone = updatedDriver.phone
        if (updatedDriver.vehicle) dbUpdate.vehicle = updatedDriver.vehicle
        if (updatedDriver.location) dbUpdate.location = updatedDriver.location
        if (updatedDriver.status) dbUpdate.status = updatedDriver.status
        if (updatedDriver.rating) dbUpdate.rating = updatedDriver.rating
        if (updatedDriver.cnh) dbUpdate.cnh = updatedDriver.cnh
        if (updatedDriver.cpf) dbUpdate.cpf = updatedDriver.cpf
        if (updatedDriver.photo) dbUpdate.avatar_url = updatedDriver.photo

        const { error } = await supabase
            .from('drivers')
            .update(dbUpdate)
            .eq('id', id)

        if (error) {
            console.error('Error updating driver:', error)
        }
    },

    deleteDriver: async (id) => {
        // Optimistic update
        set((state) => ({
            drivers: state.drivers.filter((driver) => driver.id !== id),
        }))

        const { error } = await supabase
            .from('drivers')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting driver:', error)
        }
    },

    subscribeToDrivers: () => {
        const subscription = supabase
            .channel('drivers_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'drivers' },
                (payload) => {
                    console.log('Real-time drivers update:', payload)
                    useDriversStore.getState().fetchDrivers()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }
}))
