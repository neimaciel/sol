import { create } from 'zustand'
import { api } from '@/lib/apiClient'

export interface Group {
    id: string
    name: string
    type: 'Frota Própria' | 'Agregados' | 'Terceiros'
    description: string
    membersCount: number
    region: string
    whatsappLink?: string
    whatsappId?: string
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
            const groups = await api.getGroups()

            // getGroups now returns array directly
            set({
                groups: (Array.isArray(groups) ? groups : []).map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    type: g.type,
                    description: g.description,
                    membersCount: g.members_count || 0,
                    region: g.region,
                    whatsappLink: g.whatsapp_link,
                    whatsappId: g.whatsapp_id
                })),
                isLoading: false
            })
        } catch (error) {
            console.error('Error fetching groups:', error)
            set({ isLoading: false, groups: [] })
        }
    },
    addGroup: async (newGroup) => {
        set({ isLoading: true })
        try {
            let whatsappId = newGroup.whatsappId || null

            // Extract JID from WhatsApp invite link if provided
            if (newGroup.whatsappLink && !whatsappId) {
                try {
                    // Extract invite code from link (last 22 characters after last /)
                    const linkParts = newGroup.whatsappLink.split('/')
                    const inviteCode = linkParts[linkParts.length - 1]?.trim()

                    if (inviteCode && inviteCode.length === 22 && /^[a-zA-Z0-9]{22}$/.test(inviteCode)) {
                        const evolutionApiUrl = 'https://api.ampler.me'
                        const evolutionApiKey = '52f13a23eee6e422dc718d4df667326c21168c2e7b2b777aa8d4b29c038acafb'

                        const response = await fetch(`${evolutionApiUrl}/group/inviteInfo/SOL?inviteCode=${inviteCode}`, {
                            method: 'GET',
                            headers: {
                                'apikey': evolutionApiKey,
                                'Content-Type': 'application/json'
                            }
                        })

                        if (response.ok) {
                            const data = await response.json()
                            whatsappId = data.id || data.jid
                            console.log('✅ Extracted WhatsApp Group JID:', whatsappId)
                        } else {
                            const error = await response.json()
                            console.warn('⚠️ Could not extract WhatsApp ID:', error)
                        }
                    } else {
                        console.warn('⚠️ Invalid invite code format. Expected 22 alphanumeric characters.')
                    }
                } catch (extractError) {
                    console.error('⚠️ Error extracting WhatsApp ID:', extractError)
                }
            }

            const groupData = {
                name: newGroup.name,
                type: newGroup.type,
                description: newGroup.description,
                region: newGroup.region,
                whatsapp_link: newGroup.whatsappLink || null,
                whatsapp_id: whatsappId,
                members_count: 0
            }

            await api.createGroup(groupData)
            await get().fetchGroups()
        } catch (error) {
            console.error('Error adding group:', error)
            set({ isLoading: false })
        }
    },
    updateGroup: async (id, updatedGroup) => {
        set({ isLoading: true })
        try {
            let whatsappId = updatedGroup.whatsappId

            // Extract JID from WhatsApp invite link if provided and changed
            if (updatedGroup.whatsappLink && whatsappId === undefined) {
                try {
                    // Extract invite code from link (last 22 characters after last /)
                    const linkParts = updatedGroup.whatsappLink.split('/')
                    const inviteCode = linkParts[linkParts.length - 1]?.trim()

                    if (inviteCode && inviteCode.length === 22 && /^[a-zA-Z0-9]{22}$/.test(inviteCode)) {
                        const evolutionApiUrl = 'https://api.ampler.me'
                        const evolutionApiKey = '52f13a23eee6e422dc718d4df667326c21168c2e7b2b777aa8d4b29c038acafb'

                        const response = await fetch(`${evolutionApiUrl}/group/inviteInfo/SOL?inviteCode=${inviteCode}`, {
                            method: 'GET',
                            headers: {
                                'apikey': evolutionApiKey,
                                'Content-Type': 'application/json'
                            }
                        })

                        if (response.ok) {
                            const data = await response.json()
                            whatsappId = data.id || data.jid
                            console.log('✅ Extracted WhatsApp Group JID:', whatsappId)
                        } else {
                            const error = await response.json()
                            console.warn('⚠️ Could not extract WhatsApp ID:', error)
                        }
                    } else {
                        console.warn('⚠️ Invalid invite code format. Expected 22 alphanumeric characters.')
                    }
                } catch (extractError) {
                    console.error('⚠️ Error extracting WhatsApp ID:', extractError)
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

            // Only update whatsapp_id if we have a value (either passed or extracted)
            if (whatsappId !== undefined) {
                updateData.whatsapp_id = whatsappId
            }

            await api.updateGroup(id, updateData)
            await get().fetchGroups()
        } catch (error) {
            console.error('Error updating group:', error)
            set({ isLoading: false })
        }
    },
    deleteGroup: async (id) => {
        set({ isLoading: true })
        try {
            await api.deleteGroup(id)
            await get().fetchGroups()
        } catch (error) {
            console.error('Error deleting group:', error)
            set({ isLoading: false })
        }
    }
}))
