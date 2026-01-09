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
    localStorage.setItem('auth_user', JSON.stringify(result.operator))

    return result
  }

  async logout(): Promise<void> {
    this.token = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
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
    localStorage.removeItem('auth_user')
  }

  async getCurrentUser(): Promise<any> {
    // Try to get user from localStorage first (cached from login)
    const cachedUser = localStorage.getItem('auth_user')
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser)
      } catch (e) {
        console.error('Failed to parse cached user', e)
      }
    }

    // If no cached user, try to fetch from API
    const url = `${SUPABASE_URL}/functions/v1/operators/auth/me`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get current user')
    }

    const data = await response.json()
    const user = data.operator

    // Cache the user data
    localStorage.setItem('auth_user', JSON.stringify(user))

    return user
  }

  async getDrivers(): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch drivers')
    }

    return await response.json()
  }

  async createDriver(driver: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(driver)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create driver')
    }

    return await response.json()
  }

  async updateDriver(id: string, updates: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers/${id}`

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to update driver')
    }

    return await response.json()
  }

  async deleteDriver(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers/${id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to delete driver')
    }

    return await response.json()
  }

  async getLoads(): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch loads')
    }

    return await response.json()
  }

  async getLoad(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads/${id}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch load')
    }

    return await response.json()
  }

  async createLoad(load: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(load)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create load')
    }

    return await response.json()
  }

  async updateLoad(id: string, updates: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads/${id}`

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to update load')
    }

    return await response.json()
  }

  async deleteLoad(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads/${id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to delete load')
    }

    return await response.json()
  }

  async getGroups(): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch groups')
    }

    return await response.json()
  }

  async createGroup(group: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(group)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create group')
    }

    return await response.json()
  }

  async updateGroup(id: string, group: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups/${id}`

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(group)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to update group')
    }

    return await response.json()
  }

  async deleteGroup(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups/${id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to delete group')
    }

    return await response.json()
  }
}

export const api = new APIClient()
