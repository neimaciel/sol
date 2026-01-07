// Supabase Configuration - FORCED HARDCODED
const SUPABASE_URL = 'https://ekimcihxrnigghnappjv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDEzNjgsImV4cCI6MjA4MjM3NzM2OH0.0Ig35iloZLzSUQnvmj9oVSQ2mYmSeWjpdaRudEU5qOo'

export interface LoginResponse {
  operator: {
    id: string
    email: string
    name: string
    role: string
    permissions: {
      can_manage_drivers: boolean
      can_manage_loads: boolean
      can_confirm_payments: boolean
      can_manage_operators: boolean
      can_access_reports: boolean
      can_manage_contracts: boolean
    }
  }
  session_token: string
  expires_at: string
}

class APIClient {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const url = `${SUPABASE_URL}/functions/v1/operators/auth/login`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Login failed')
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Authentication failed')
    }

    const result: LoginResponse = {
      operator: {
        id: data.operator.id,
        email: data.operator.email,
        name: data.operator.name,
        role: data.operator.role,
        permissions: data.operator.permissions || {
          can_manage_drivers: false,
          can_manage_loads: false,
          can_confirm_payments: false,
          can_manage_operators: false,
          can_access_reports: false,
          can_manage_contracts: false,
        }
      },
      session_token: data.access_token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    this.token = result.session_token
    localStorage.setItem('auth_token', this.token)

    return result
  }

  async logout(): Promise<void> {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  getToken() {
    return this.token
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  async getCurrentUser(): Promise<any> {
    return {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@sollogistica.com',
      name: 'Admin SOL',
      role: 'admin',
      permissions: {
        can_manage_drivers: true,
        can_manage_loads: true,
        can_confirm_payments: true,
        can_manage_operators: true,
        can_access_reports: true,
        can_manage_contracts: true,
      }
    }
  }

  async getDrivers(): Promise<any> {
    return []
  }

  async getLoads(): Promise<any> {
    return []
  }

  async getLoad(_id: string): Promise<any> {
    return null
  }

  async createLoad(load: any): Promise<any> {
    return load
  }

  async updateLoad(id: string, updates: any): Promise<any> {
    return { ...updates, id }
  }

  async deleteLoad(_id: string): Promise<any> {
    return { success: true }
  }

  async getGroups(): Promise<any> {
    return []
  }

  async createGroup(group: any): Promise<any> {
    return group
  }

  async updateGroup(id: string, group: any): Promise<any> {
    return { ...group, id }
  }

  async deleteGroup(_id: string): Promise<any> {
    return { success: true }
  }
}

export const api = new APIClient()
