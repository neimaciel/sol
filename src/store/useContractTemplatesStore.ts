import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface ContractTemplate {
    id: string
    name: string
    description: string | null
    content: string
    category: string | null
    is_active: boolean
    created_at: string
}

interface ContractTemplatesState {
    templates: ContractTemplate[]
    isLoading: boolean
    fetchTemplates: () => Promise<void>
    addTemplate: (template: Omit<ContractTemplate, 'id' | 'created_at'>) => Promise<void>
    updateTemplate: (id: string, template: Partial<Omit<ContractTemplate, 'id' | 'created_at'>>) => Promise<void>
    deleteTemplate: (id: string) => Promise<void>
}

export const useContractTemplatesStore = create<ContractTemplatesState>((set, get) => ({
    templates: [],
    isLoading: false,

    fetchTemplates: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('contract_templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            set({ templates: data as ContractTemplate[], isLoading: false })
        } catch (error) {
            console.error('Error fetching templates:', error)
            set({ isLoading: false })
        }
    },

    addTemplate: async (newTemplate) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('contract_templates')
                .insert([newTemplate])

            if (error) throw error

            await get().fetchTemplates()
        } catch (error) {
            console.error('Error adding template:', error)
            set({ isLoading: false })
        }
    },

    updateTemplate: async (id, updatedTemplate) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('contract_templates')
                .update(updatedTemplate)
                .eq('id', id)

            if (error) throw error

            await get().fetchTemplates()
        } catch (error) {
            console.error('Error updating template:', error)
            set({ isLoading: false })
        }
    },

    deleteTemplate: async (id) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('contract_templates')
                .delete()
                .eq('id', id)

            if (error) throw error

            await get().fetchTemplates()
        } catch (error) {
            console.error('Error deleting template:', error)
            set({ isLoading: false })
        }
    }
}))
