import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  token: null,
  setAuth: (user, tenant, token) => {
    localStorage.setItem('supabase_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tenant', JSON.stringify(tenant));
    set({ user, tenant, token });
  },
  logout: () => {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    set({ user: null, tenant: null, token: null });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('supabase_token');
    const userStr = localStorage.getItem('user');
    const tenantStr = localStorage.getItem('tenant');
    if (token && userStr) {
      try {
        set({
          token,
          user: JSON.parse(userStr),
          tenant: tenantStr ? JSON.parse(tenantStr) : null,
        });
      } catch {
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
      }
    }
  },
}));
