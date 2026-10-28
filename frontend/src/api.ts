import { User, Zone, Category, Issue, Report, AnalyticsSummary } from './types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('urban_token');
};

export const setAuthToken = (token: string, user: User) => {
  localStorage.setItem('urban_token', token);
  localStorage.setItem('urban_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('urban_token');
  localStorage.removeItem('urban_user');
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem('urban_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const getHeaders = (isMultipart: boolean = false) => {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async register(email: string, password: string, fullName: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, full_name: fullName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  // Zones & Categories
  async getZones(): Promise<Zone[]> {
    const res = await fetch(`${API_BASE}/zones`);
    if (!res.ok) throw new Error('Failed to fetch zones');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async lookupZone(lat: number, lon: number): Promise<Zone> {
    const res = await fetch(`${API_BASE}/lookup-zone`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude: lat, longitude: lon })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Point outside pilot zones' }));
      throw new Error(err.detail || 'Point outside pilot zones');
    }
    return res.json();
  },

  // AI Suggestion
  async suggestCategory(description: string) {
    const res = await fetch(`${API_BASE}/reports/suggest-category`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ description })
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Reports
  async submitReport(formData: FormData): Promise<Report> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit report' }));
      throw new Error(err.detail || 'Failed to submit report');
    }
    return res.json();
  },

  async getMyReports(): Promise<Report[]> {
    const res = await fetch(`${API_BASE}/reports/mine`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load my reports');
    return res.json();
  },

  async getAllReports(params?: { zone_id?: string; category_id?: string }): Promise<Report[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/reports?${query}`);
    if (!res.ok) throw new Error('Failed to load reports');
    return res.json();
  },

  // Issues
  async getIssues(params?: { zone_id?: string; category_id?: string; status?: string }): Promise<Issue[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/issues?${query}`);
    if (!res.ok) throw new Error('Failed to load tracked issues');
    return res.json();
  },

  async getIssue(id: string): Promise<Issue> {
    const res = await fetch(`${API_BASE}/issues/${id}`);
    if (!res.ok) throw new Error('Failed to load issue');
    return res.json();
  },

  async updateIssueStatus(id: string, status: string, reason?: string): Promise<Issue> {
    const res = await fetch(`${API_BASE}/issues/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update status' }));
      throw new Error(err.detail || 'Failed to update status');
    }
    return res.json();
  },

  async submitFeedback(id: string, verdict: 'fixed' | 'not_fixed', rating?: number, comment?: string) {
    const res = await fetch(`${API_BASE}/issues/${id}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ verdict, rating, comment })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Feedback submission failed' }));
      throw new Error(err.detail || 'Feedback submission failed');
    }
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  }
};
