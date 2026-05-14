'use client';

import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Settings, Phone } from 'lucide-react';
import { useWabaAccounts, useDisconnectWaba, usePhoneNumbers } from '../../../lib/hooks';

const qualityColors: Record<string, string> = {
  green: 'bg-success',
  yellow: 'bg-yellow-500',
  red: 'bg-error'
};

export default function WhatsAppPage() {
  const [showConnect, setShowConnect] = useState(false);
  const { data: wabaRes, isLoading: wabaLoading } = useWabaAccounts();
  const { data: phoneRes } = usePhoneNumbers();
  const disconnectWaba = useDisconnectWaba();

  const accounts = wabaRes?.data || [];
  const phoneNumbers = phoneRes?.data || [];

  const handleDisconnect = async (id: string) => {
    if (confirm('Disconnect this WABA account?')) {
      disconnectWaba.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">WhatsApp Accounts</h1>
            <p className="font-body text-body-md text-muted mt-xs">Connect and manage your WhatsApp Business API</p>
          </div>
          <button
            onClick={() => setShowConnect(true)}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
            <Plus className="w-4 h-4" />
            <span>Connect WABA</span>
          </button>
        </div>

        {wabaLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-card border border-hairline rounded-xl p-lg animate-pulse">
                <div className="h-6 w-32 bg-hairline-soft rounded mb-4" />
                <div className="h-4 w-48 bg-hairline-soft rounded mb-2" />
                <div className="h-4 w-24 bg-hairline-soft rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-section">
            {accounts.length === 0 && (
              <div className="lg:col-span-3 text-center py-xl text-muted font-body text-body-md">
                No WABA accounts connected. Click &ldquo;Connect WABA&rdquo; to get started.
              </div>
            )}
            {accounts.map((account) => (
              <div key={account.id} className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft hover:shadow-soft transition">
                <div className="flex items-start justify-between mb-md">
                  <div className="flex items-center space-x-sm">
                    <div className="w-10 h-10 bg-gradient-mint rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-canvas-deep" />
                    </div>
                    <div>
                      <h3 className="font-body text-title-md text-ink">{account.wabaName}</h3>
                      <p className="font-body text-caption text-muted">WABA: {account.wabaId}</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-success text-caption-uppercase px-sm py-xxs rounded-pill font-medium">{account.status}</span>
                </div>

                <div className="space-y-sm mb-md">
                  <div className="flex justify-between font-body text-body-md">
                    <span className="text-muted">Currency</span>
                    <span className="text-body-strong">{account.currency}</span>
                  </div>
                  <div className="flex justify-between font-body text-body-md">
                    <span className="text-muted">Timezone</span>
                    <span className="text-body-strong">{account.timezone}</span>
                  </div>
                  <div className="flex justify-between font-body text-body-md">
                    <span className="text-muted">Phone Numbers</span>
                    <span className="text-body-strong">{(account as any).phone_numbers?.length || 0}</span>
                  </div>
                </div>

                <div className="flex space-x-sm pt-md border-t border-hairline">
                  <button className="flex-1 flex items-center justify-center space-x-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition">
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="flex items-center justify-center px-sm py-xs border border-hairline-strong rounded-lg hover:bg-red-50 text-error transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          <div className="p-md border-b border-hairline flex items-center justify-between">
            <h2 className="font-display text-display-sm text-ink">Phone Numbers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-canvas-soft">
                <tr>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Phone Number</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Display Name</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Quality</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Default</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {phoneNumbers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-lg text-muted font-body text-body-sm">
                      No phone numbers found. Connect a WABA account first.
                    </td>
                  </tr>
                )}
                {phoneNumbers.map((phone) => (
                  <tr key={phone.id} className="hover:bg-hairline-soft">
                    <td className="px-md py-md font-body text-body-strong text-ink">{phone.displayNumber}</td>
                    <td className="px-md py-md font-body text-body-md text-body">{phone.displayName}</td>
                    <td className="px-md py-md">
                      <span className="bg-green-100 text-success text-caption-uppercase px-sm py-xxs rounded-pill font-medium">{phone.status}</span>
                    </td>
                    <td className="px-md py-md">
                      <div className="flex items-center space-x-xs">
                        <div className={`w-3 h-3 rounded-full ${qualityColors[phone.qualityRating] || 'bg-muted-soft'}`} />
                        <span className="font-body text-body-sm capitalize text-body">{phone.qualityRating}</span>
                      </div>
                    </td>
                    <td className="px-md py-md">
                      {phone.isDefault ? (
                        <span className="bg-surface-strong text-ink text-caption-uppercase px-sm py-xxs rounded-pill font-medium">Default</span>
                      ) : (
                        <button className="font-body text-body-sm text-primary hover:underline">Set as default</button>
                      )}
                    </td>
                    <td className="px-md py-md">
                      <div className="flex space-x-xs">
                        <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Settings className="w-4 h-4 text-muted" /></button>
                        <button className="p-xs hover:bg-red-50 rounded-md transition"><Trash2 className="w-4 h-4 text-muted hover:text-error" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showConnect && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft">
              <h2 className="font-display text-display-md text-ink mb-md">Connect WhatsApp Business</h2>
              <div className="bg-gradient-sky/20 border border-hairline rounded-lg p-md mb-md">
                <p className="font-body text-body-md text-body">
                  Click the button below to connect your WhatsApp Business Account via Meta&apos;s Embedded Signup flow.
                </p>
                <p className="font-body text-body-sm text-muted mt-sm">
                  After authorizing via Meta, paste the authorization code returned in the callback URL.
                </p>
              </div>
              <div className="flex justify-end space-x-sm">
                <button
                  onClick={() => setShowConnect(false)}
                  className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                >
                  Cancel
                </button>
                <a
                  href={`https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID || '1198923135565390'}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_API_URL + '/api/v1/waba/callback')}&scope=whatsapp_business_messaging%2Cwhatsapp_business_management`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-md py-sm bg-primary text-on-primary rounded-pill font-body text-button hover:bg-primary-active transition inline-block"
                >
                  Connect with Meta
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
