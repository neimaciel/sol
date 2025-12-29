/**
 * API client for Supabase Edge Functions
 */

// Use environment variable or default to placeholder for Supabase project  
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const API_BASE_URL = `${SUPABASE_URL}/rest/v1`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    status_code: number;
  };
}

interface LoginResponse {
  operator: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: {
      can_manage_drivers: boolean;
      can_manage_loads: boolean;
      can_confirm_payments: boolean;
      can_manage_operators: boolean;
      can_access_reports: boolean;
      can_manage_contracts: boolean;
    };
  };
  session_token: string;
  expires_at: string;
}

class ApiClient {
  private baseURL = API_BASE_URL;
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods (simplified for Edge Functions)
  async login(email: string, _password: string): Promise<LoginResponse> {
    // For now, return a mock response since auth will be handled by Supabase Auth
    const response = {
      operator: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: email,
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
      },
      session_token: 'mock-token',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // Set the token in the API client
    this.setToken(response.session_token);
    
    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
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
    };
  }

  // Drivers methods
  async getDrivers(): Promise<any> {
    return this.request('/drivers');
  }

  async getDriver(id: string): Promise<any> {
    return this.request(`/drivers/${id}`);
  }

  // Loads methods  
  async getLoads(): Promise<any> {
    return this.request('/loads');
  }

  async getLoad(id: string): Promise<any> {
    const loads = await this.request(`/loads?id=eq.${id}`) as any[];
    return loads[0] || null;
  }

  async createLoad(load: any): Promise<any> {
    return this.request('/loads', {
      method: 'POST',
      body: JSON.stringify(load),
    });
  }

  async updateLoad(id: string, updates: any): Promise<any> {
    return this.request(`/loads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLoad(id: string): Promise<any> {
    return this.request(`/loads/${id}`, {
      method: 'DELETE',
    });
  }

  // Payments methods
  async getPayments(): Promise<any> {
    return this.request('/payments');
  }

  // Groups methods
  async getGroups(): Promise<any> {
    return this.request('/groups');
  }

  async createGroup(group: any): Promise<any> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }

  async updateGroup(id: string, group: any): Promise<any> {
    return this.request(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(group),
    });
  }

  async deleteGroup(id: string): Promise<any> {
    return this.request(`/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Broadcast to WhatsApp groups
  async broadcastToGroups(loadId: string, groupIds: string[], message: string): Promise<any> {
    return this.request('/groups/broadcast', {
      method: 'POST',
      body: JSON.stringify({ loadId, groupIds, message }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/loads');
  }

  // Set token manually (for initialization)
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Get current token
  getToken() {
    return this.token;
  }
}

export const api = new ApiClient();
export type { ApiResponse, LoginResponse };