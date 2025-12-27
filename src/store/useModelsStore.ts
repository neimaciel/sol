import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface LoadModel {
    id: string
    name: string
    type: 'Fracionada' | 'Refrigerada' | 'Carga Geral' | 'Granel'
    vehicleType: 'Van' | 'Carreta' | 'Truck' | 'Bitrem' | 'Toco' | 'VUC'
    origin: string
    destination: string
    description: string
    usageCount: number
    createdAt: string
}

interface ModelsState {
    models: LoadModel[]
    isLoading: boolean
    fetchModels: () => Promise<void>
    addModel: (model: Omit<LoadModel, 'id' | 'createdAt' | 'usageCount'>) => Promise<void>
    deleteModel: (id: string) => Promise<void>
    updateModel: (id: string, model: Partial<Omit<LoadModel, 'id' | 'createdAt' | 'usageCount'>>) => Promise<void>
}

export const useModelsStore = create<ModelsState>((set, get) => ({
    models: [],
    isLoading: false,
    fetchModels: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('load_models')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            set({
                models: data.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    type: m.type,
                    vehicleType: m.vehicle_type,
                    origin: m.origin,
                    destination: m.destination,
                    description: m.description,
                    usageCount: m.usage_count,
                    createdAt: new Date(m.created_at).toLocaleDateString('pt-BR')
                })),
                isLoading: false
            })
        } catch (error) {
            console.error('Error fetching models:', error)
            set({ isLoading: false })
        }
    },
    addModel: async (newModel) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('load_models')
                .insert([{
                    name: newModel.name,
                    type: newModel.type,
                    vehicle_type: newModel.vehicleType,
                    origin: newModel.origin,
                    destination: newModel.destination,
                    description: newModel.description,
                    usage_count: 0
                }])

            if (error) throw error

            await get().fetchModels()
        } catch (error) {
            console.error('Error adding model:', error)
            set({ isLoading: false })
        }
    },
    deleteModel: async (id) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('load_models')
                .delete()
                .eq('id', id)

            if (error) throw error

            await get().fetchModels()
        } catch (error) {
            console.error('Error deleting model:', error)
            set({ isLoading: false })
        }
    },
    updateModel: async (id, updatedModel) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('load_models')
                .update({
                    name: updatedModel.name,
                    type: updatedModel.type,
                    vehicle_type: updatedModel.vehicleType,
                    origin: updatedModel.origin,
                    destination: updatedModel.destination,
                    description: updatedModel.description
                })
                .eq('id', id)

            if (error) throw error

            await get().fetchModels()
        } catch (error) {
            console.error('Error updating model:', error)
            set({ isLoading: false })
        }
    }
}))
