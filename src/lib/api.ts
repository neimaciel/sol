/**
 * API client for local backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

  // Auth methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/v1/operators/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token if login successful
    if ('session_token' in response) {
      this.token = response.session_token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/api/v1/operators/auth/logout', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/api/v1/operators/auth/me');
  }

  // Drivers methods
  async getDrivers(): Promise<any> {
    return this.request('/api/v1/drivers/');
  }

  async getDriver(id: string): Promise<any> {
    return this.request(`/api/v1/drivers/${id}`);
  }

  // Loads methods  
  async getLoads(): Promise<any> {
    return this.request('/api/v1/loads/');
  }

  async createLoad(load: any): Promise<any> {
    return this.request('/api/v1/loads/', {
      method: 'POST',
      body: JSON.stringify(load),
    });
  }

  async updateLoad(id: string, updates: any): Promise<any> {
    return this.request(`/api/v1/loads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLoad(id: string): Promise<any> {
    return this.request(`/api/v1/loads/${id}`, {
      method: 'DELETE',
    });
  }

  // Payments methods
  async getPayments(): Promise<any> {
    return this.request('/api/v1/payments/');
  }

  // Groups methods
  async getGroups(): Promise<any> {
    return this.request('/api/v1/groups/');
  }

  async createGroup(group: any): Promise<any> {
    return this.request('/api/v1/groups/', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }

  async updateGroup(id: string, group: any): Promise<any> {
    return this.request(`/api/v1/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(group),
    });
  }

  async deleteGroup(id: string): Promise<any> {
    return this.request(`/api/v1/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
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