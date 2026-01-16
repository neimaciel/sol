import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

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
            logger.error('Error fetching templates:', error)
            const message = error instanceof Error ? error.message : 'Erro ao buscar templates'
            toast.error(message)
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
            toast.success('Template adicionado com sucesso!')
        } catch (error) {
            logger.error('Error adding template:', error)
            const message = error instanceof Error ? error.message : 'Erro ao adicionar template'
            toast.error(message)
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
            toast.success('Template atualizado com sucesso!')
        } catch (error) {
            logger.error('Error updating template:', error)
            const message = error instanceof Error ? error.message : 'Erro ao atualizar template'
            toast.error(message)
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
            toast.success('Template excluído com sucesso!')
        } catch (error) {
            logger.error('Error deleting template:', error)
            const message = error instanceof Error ? error.message : 'Erro ao excluir template'
            toast.error(message)
            set({ isLoading: false })
        }
    }
}))
