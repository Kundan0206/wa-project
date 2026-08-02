const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiError {
  success: false;
  error: string;
}

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const { useAuthStore } = await import('./store');
  const token = useAuthStore.getState().token;
  if (token) return token;
  return localStorage.getItem('supabase_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | undefined>) => {
    const entries = params
      ? Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
      : [];
    const query = entries.length > 0 ? '?' + new URLSearchParams(entries).toString() : '';
    return request<T>(`${endpoint}${query}`);
  },
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
