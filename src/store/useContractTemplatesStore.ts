import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

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
            logger.error('Error fetching templates:', error)
            const message = error instanceof Error ? error.message : 'Erro ao buscar templates de contrato'
            toast.error(message)
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
            toast.success('Template de contrato adicionado com sucesso!')
        } catch (error) {
            logger.error('Error adding template:', error)
            const message = error instanceof Error ? error.message : 'Erro ao adicionar template de contrato'
            toast.error(message)
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
            toast.success('Template de contrato atualizado com sucesso!')
        } catch (error) {
            logger.error('Error updating template:', error)
            const message = error instanceof Error ? error.message : 'Erro ao atualizar template de contrato'
            toast.error(message)
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
            toast.success('Template de contrato excluído com sucesso!')
        } catch (error) {
            logger.error('Error deleting template:', error)
            const message = error instanceof Error ? error.message : 'Erro ao excluir template de contrato'
            toast.error(message)
            set({ isLoading: false })
        }
    }
}))
