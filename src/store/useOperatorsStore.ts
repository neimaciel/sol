import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Operator {
    id: string
    name: string
    email: string
    role: 'Senior' | 'Pleno' | 'Junior'
    status: 'active' | 'inactive'
    lastAccess: string
}

interface OperatorsState {
    operators: Operator[]
    fetchOperators: () => Promise<void>
    addOperator: (operator: Omit<Operator, 'id'>) => Promise<void>
    updateOperator: (id: string, operator: Partial<Operator>) => Promise<void>
    deleteOperator: (id: string) => Promise<void>
    subscribeToOperators: () => () => void
}

export const useOperatorsStore = create<OperatorsState>((set) => ({
    operators: [],

    fetchOperators: async () => {
        const { data, error } = await supabase
            .from('operators')
            .select('*')
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching operators:', error)
            return
        }

        const mappedOperators: Operator[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            role: item.role,
            status: item.status,
            lastAccess: item.last_access || new Date().toISOString()
        }))

        set({ operators: mappedOperators })
    },

    addOperator: async (operator) => {
        // Optimistic update
        const tempId = Math.random().toString(36).substr(2, 9)
        set((state) => ({
            operators: [...state.operators, { ...operator, id: tempId }],
        }))

        const { data, error } = await supabase
            .from('operators')
            .insert([{
                name: operator.name,
                email: operator.email,
                role: operator.role,
                status: operator.status,
                last_access: operator.lastAccess || new Date().toISOString()
            }])
            .select()

        if (error) {
            console.error('Error adding operator:', error)
            // Revert optimistic update
            set((state) => ({
                operators: state.operators.filter((o) => o.id !== tempId),
            }))
        } else if (data) {
            // Update with real ID
            set((state) => ({
                operators: state.operators.map((o) =>
                    o.id === tempId ? { ...o, id: data[0].id } : o
                ),
            }))
        }
    },

    updateOperator: async (id, updatedOperator) => {
        // Optimistic update
        set((state) => ({
            operators: state.operators.map((operator) =>
                operator.id === id ? { ...operator, ...updatedOperator } : operator
            ),
        }))

        const dbUpdate: any = {}
        if (updatedOperator.name) dbUpdate.name = updatedOperator.name
        if (updatedOperator.email) dbUpdate.email = updatedOperator.email
        if (updatedOperator.role) dbUpdate.role = updatedOperator.role
        if (updatedOperator.status) dbUpdate.status = updatedOperator.status
        if (updatedOperator.lastAccess) dbUpdate.last_access = updatedOperator.lastAccess

        const { error } = await supabase
            .from('operators')
            .update(dbUpdate)
            .eq('id', id)

        if (error) {
            console.error('Error updating operator:', error)
        }
    },

    deleteOperator: async (id) => {
        // Optimistic update
        set((state) => ({
            operators: state.operators.filter((operator) => operator.id !== id),
        }))

        const { error } = await supabase
            .from('operators')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting operator:', error)
        }
    },

    subscribeToOperators: () => {
        const subscription = supabase
            .channel('operators_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'operators' },
                (payload: any) => {
                    console.log('Real-time operators update:', payload)
                    useOperatorsStore.getState().fetchOperators()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }
}))
