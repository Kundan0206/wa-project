'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxpczsexcmlaqqphagaz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      setError('Authentication is not configured yet.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed');
      }

      const slug = form.companyName?.toLowerCase().replace(/[^a-z0-9]/g, '-')
        || form.email.split('@')[0].toLowerCase();

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: form.companyName || form.name,
          slug: `${slug}-${Date.now()}`,
          plan: 'free',
          status: 'active'
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant error:', tenantError);
      }

      if (tenantData) {
        await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            tenant_id: tenantData.id,
            email: form.email,
            password_hash: 'managed_by_supabase_auth',
            name: form.name,
            role: 'owner',
            is_active: true
          });

        await supabase
          .from('tenant_settings')
          .insert({ tenant_id: tenantData.id });
      }

      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-full max-w-md px-md">
        <div className="card-soft">
          <div className="text-center mb-xl">
            <Link href="/" className="inline-flex items-center space-x-sm mb-md">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span className="font-display text-display-sm text-ink">Wirely</span>
            </Link>
            <h1 className="font-display text-display-md text-ink">Create your account</h1>
            <p className="font-body text-body-md text-muted mt-xs">Start your 14-day free trial</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-md">
            {!isSupabaseConfigured && (
              <div className="bg-error/10 text-error p-sm rounded-md text-body-sm">
                Authentication is not configured yet. Add Supabase environment variables in Vercel.
              </div>
            )}

            {error && <div className="bg-error/10 text-error p-sm rounded-md text-body-sm">{error}</div>}

            <div>
              <label className="font-body text-caption text-muted mb-xs">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="font-body text-caption text-muted mb-xs">Company Name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                placeholder="Acme Inc"
                required
              />
            </div>

            <div>
              <label className="font-body text-caption text-muted mb-xs">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="font-body text-caption text-muted mb-xs">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full btn-primary"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-body text-body-sm text-muted mt-md">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-link font-body text-body-sm">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
