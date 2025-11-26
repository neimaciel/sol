import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Group {
    id: string
    name: string
    type: 'Frota Própria' | 'Agregados' | 'Terceiros'
    description: string
    membersCount: number
    region: string
    whatsappLink?: string
}

interface GroupsState {
    groups: Group[]
    isLoading: boolean
    fetchGroups: () => Promise<void>
    addGroup: (group: Omit<Group, 'id' | 'membersCount'>) => Promise<void>
    updateGroup: (id: string, group: Partial<Group>) => Promise<void>
    deleteGroup: (id: string) => Promise<void>
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
    groups: [],
    isLoading: false,
    fetchGroups: async () => {
        set({ isLoading: true })
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            set({
                groups: data.map(g => ({
                    id: g.id,
                    name: g.name,
                    type: g.type,
                    description: g.description,
                    membersCount: g.members_count,
                    region: g.region,
                    whatsappLink: g.whatsapp_link
                })),
                isLoading: false
            })
        } catch (error) {
            console.error('Error fetching groups:', error)
            set({ isLoading: false })
        }
    },
    addGroup: async (newGroup) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('groups')
                .insert([{
                    name: newGroup.name,
                    type: newGroup.type,
                    description: newGroup.description,
                    region: newGroup.region,
                    whatsapp_link: newGroup.whatsappLink || null,
                    members_count: 0
                }])

            if (error) throw error

            await get().fetchGroups()
        } catch (error) {
            console.error('Error adding group:', error)
            set({ isLoading: false })
        }
    },
    updateGroup: async (id, updatedGroup) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('groups')
                .update({
                    name: updatedGroup.name,
                    type: updatedGroup.type,
                    description: updatedGroup.description,
                    region: updatedGroup.region,
                    whatsapp_link: updatedGroup.whatsappLink || null,
                    members_count: updatedGroup.membersCount
                })
                .eq('id', id)

            if (error) throw error

            await get().fetchGroups()
        } catch (error) {
            console.error('Error updating group:', error)
            set({ isLoading: false })
        }
    },
    deleteGroup: async (id) => {
        set({ isLoading: true })
        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', id)

            if (error) throw error

            await get().fetchGroups()
        } catch (error) {
            console.error('Error deleting group:', error)
            set({ isLoading: false })
        }
    }
}))
