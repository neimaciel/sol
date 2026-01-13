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
  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token')
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

    console.log('🔐 Login response:', data)

    if (!data.success) {
      throw new Error(data.message || 'Authentication failed')
    }

    if (!data.access_token) {
      console.error('❌ No access_token in response!', data)
      throw new Error('No access token returned from server')
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

    console.log('💾 Saving token to localStorage:', result.session_token.substring(0, 50) + '...')
    localStorage.setItem('auth_token', result.session_token)
    localStorage.setItem('auth_user', JSON.stringify(result.operator))

    console.log('✅ Token saved. Testing retrieval...')
    const savedToken = localStorage.getItem('auth_token')
    console.log('📦 Retrieved token:', savedToken?.substring(0, 50) + '...')

    return result
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token)
  }

  getToken() {
    return this.getStoredToken()
  }

  clearToken() {
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
        'Authorization': `Bearer ${this.getStoredToken()}`,
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
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch drivers')
    }

    const data = await response.json()
    // Edge function returns array directly, wrap it for consistency
    return { drivers: Array.isArray(data) ? data : [] }
  }

  async createDriver(driver: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(driver)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create driver')
    }

    const data = await response.json()
    return { success: true, driver: data }
  }

  async updateDriver(id: string, updates: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers/${id}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to update driver')
    }

    const data = await response.json()
    return { success: true, driver: data }
  }

  async deleteDriver(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/drivers/${id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
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
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch loads')
    }

    const data = await response.json()
    // Edge function returns array directly, wrap it for consistency
    return { loads: Array.isArray(data) ? data : [] }
  }

  async getLoad(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads/${id}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
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
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(load)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create load')
    }

    const data = await response.json()
    return { success: true, load: data }
  }

  async updateLoad(id: string, updates: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads/${id}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to update load')
    }

    const data = await response.json()
    return { success: true, load: data }
  }

  async deleteLoad(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/loads/${id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to delete load')
    }

    // DELETE returns {success: true} directly from edge function
    return await response.json()
  }

  async getGroups(): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups`
    const token = this.getStoredToken()

    console.log('🔍 getGroups - Token being used:', token ? token.substring(0, 50) + '...' : 'NO TOKEN!')

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch groups')
    }

    const data = await response.json()
    // Edge function returns array directly
    return Array.isArray(data) ? data : []
  }

  async createGroup(group: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(group)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create group')
    }

    const data = await response.json()
    return { success: true, group: data }
  }

  async updateGroup(id: string, group: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups/${id}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(group)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to update group')
    }

    const data = await response.json()
    return { success: true, group: data }
  }

  async deleteGroup(id: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/groups/${id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to delete group')
    }

    // DELETE returns {success: true} directly from edge function
    return await response.json()
  }

  // Payments Methods
  async getPayment(loadId: string): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/payments/load/${loadId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch payment')
    }

    return await response.json()
  }

  async createPayment(payment: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/payments`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payment)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to create payment')
    }

    const data = await response.json()
    return { success: true, payment: data }
  }

  async confirmManualPayment(paymentId: string, confirmation: any): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/payments/${paymentId}/confirm`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(confirmation)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || 'Failed to confirm payment')
    }

    const data = await response.json()
    return { success: true, ...data }
  }

  async getPaymentMethods(): Promise<any> {
    const url = `${SUPABASE_URL}/functions/v1/payments/methods`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
        'apikey': SUPABASE_ANON_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch payment methods')
    }

    return await response.json()
  }
}

export const api = new APIClient()
