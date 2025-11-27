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
            let whatsappId = null

            // If user provided a WhatsApp link, try to extract the JID automatically
            if (newGroup.whatsappLink) {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                    const response = await fetch(`${apiUrl}/api/v1/whatsapp/extract-group-jid`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            invite_link: newGroup.whatsappLink
                        })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        whatsappId = data.jid
                        console.log('✅ Automatically extracted WhatsApp ID:', whatsappId)
                    } else {
                        console.warn('⚠️ Could not extract WhatsApp ID from link. Group will be saved without JID.')
                    }
                } catch (extractError) {
                    console.warn('⚠️ Error extracting WhatsApp ID:', extractError)
                    // Continue saving even if extraction fails
                }
            }

            const { error } = await supabase
                .from('groups')
                .insert([{
                    name: newGroup.name,
                    type: newGroup.type,
                    description: newGroup.description,
                    region: newGroup.region,
                    whatsapp_link: newGroup.whatsappLink || null,
                    whatsapp_id: whatsappId,
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
            let whatsappId = undefined

            // If user updated the WhatsApp link, try to extract the JID automatically
            if (updatedGroup.whatsappLink) {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                    const response = await fetch(`${apiUrl}/api/v1/whatsapp/extract-group-jid`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            invite_link: updatedGroup.whatsappLink
                        })
                    })

                    if (response.ok) {
                        const data = await response.json()
                        whatsappId = data.jid
                        console.log('✅ Automatically extracted WhatsApp ID:', whatsappId)
                    } else {
                        console.warn('⚠️ Could not extract WhatsApp ID from link.')
                    }
                } catch (extractError) {
                    console.warn('⚠️ Error extracting WhatsApp ID:', extractError)
                }
            }

            const updateData: any = {
                name: updatedGroup.name,
                type: updatedGroup.type,
                description: updatedGroup.description,
                region: updatedGroup.region,
                whatsapp_link: updatedGroup.whatsappLink || null,
                members_count: updatedGroup.membersCount
            }

            // Only update whatsapp_id if we extracted one
            if (whatsappId) {
                updateData.whatsapp_id = whatsappId
            }

            const { error } = await supabase
                .from('groups')
                .update(updateData)
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
