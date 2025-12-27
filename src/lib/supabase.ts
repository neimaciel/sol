// Supabase disabled for local development
// Using local API backend instead

// Mock supabase client to prevent errors
export const supabase = {
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
