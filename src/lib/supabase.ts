import { createClient } from '@supabase/supabase-js'

// Use Supabase for production
const supabaseUrl = 'https://ekimcihxrnigghnappjv.supabase.co'
const supabaseKey = 'sb_publishable_U-l0teyfrl6UbZysrj_WzQ_7MYuIxkV'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Mock fallback for development
export const supabaseMock = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ error: { message: 'Using local API' } }),
    signUp: () => Promise.resolve({ error: { message: 'Using local API' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: null }, error: null })
  },
  from: (_table: string) => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => ({
      select: () => Promise.resolve({ data: [], error: null })
    }),
    update: () => ({
      eq: () => Promise.resolve({ error: null })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null })
    })
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({})
  }),
  removeChannel: () => {}
} as any;
