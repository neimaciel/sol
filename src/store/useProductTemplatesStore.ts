import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface ProductTemplate {
    id: string
    name: string
    description: string | null
    product_type: string
    requirements: string | null
    is_active: boolean
    created_at: string
}

interface ProductTemplatesState {
    templates: ProductTemplate[]
    isLoading: boolean
    fetchTemplates: () => Promise<void>
    addTemplate: (template: Omit<ProductTemplate, 'id' | 'created_at'>) => Promise<void>
    updateTemplate: (id: string, template: Partial<Omit<ProductTemplate, 'id' | 'created_at'>>) => Promise<void>
    deleteTemplate: (id: string) => Promise<void>
}

export const useProductTemplatesStore = create<ProductTemplatesState>((set, get) => ({
    templates: [],
    isLoading: false,

    fetchTemplates: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('product_templates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            set({ templates: data as ProductTemplate[], isLoading: false })
        } catch (error) {
            console.error('Error fetching templates:', error)
            set({ isLoading: false })
        }
    },

    addTemplate: async (newTemplate) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('product_templates')
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
                .from('product_templates')
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
                .from('product_templates')
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
