'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Users, Send, Bot, BarChart3,
  Settings, Phone, FileText, ScrollText, Image as ImageIcon,
  UserCog, Key, CreditCard, Code2
} from 'lucide-react';
import { useAuthStore } from '../../lib/store';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/media', label: 'Media', icon: ImageIcon },
  { href: '/dashboard/flows', label: 'Chatbots', icon: Bot },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: Phone },
];

const settingsItems = [
  { href: '/dashboard/logs', label: 'Logs', icon: ScrollText },
  { href: '/dashboard/team', label: 'Team', icon: UserCog },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/api-docs', label: 'API Docs', icon: Code2 },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!useAuthStore.getState().token) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-64 bg-surface-card border-r border-hairline flex flex-col">
        <div className="p-4 border-b border-hairline">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span className="font-display text-lg text-ink">Wirely</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-surface-strong text-ink' : 'text-muted hover:text-ink hover:bg-hairline-soft'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-body text-body-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-hairline space-y-1">
          {settingsItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-surface-strong text-ink' : 'text-muted hover:text-ink hover:bg-hairline-soft'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-body text-body-md">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-hairline">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center">
              <span className="text-sm font-body text-ink">{user.name?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body text-body-strong truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-muted hover:text-ink">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}