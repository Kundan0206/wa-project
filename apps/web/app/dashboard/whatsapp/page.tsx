'use client';

import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Settings, Phone } from 'lucide-react';

const mockAccounts = [
  { id: '1', name: 'Business Account', wabaId: '1234567890', status: 'active', phoneNumbers: ['+1 555 0100', '+1 555 0101'], currency: 'USD', timezone: 'America/New_York' },
];

const mockPhoneNumbers = [
  { id: '1', number: '+1 555 0100', displayName: 'Support Team', status: 'verified', quality: 'green', isDefault: true, phoneNumberId: 'abc123' },
  { id: '2', number: '+1 555 0101', displayName: 'Sales', status: 'verified', quality: 'green', isDefault: false, phoneNumberId: 'abc124' },
];

const qualityColors: Record<string, string> = {
  green: 'bg-success',
  yellow: 'bg-yellow-500',
  red: 'bg-error'
};

export default function WhatsAppPage() {
  const [showConnect, setShowConnect] = useState(false);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-section">
          {mockAccounts.map((account) => (
            <div key={account.id} className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft hover:shadow-soft transition">
              <div className="flex items-start justify-between mb-md">
                <div className="flex items-center space-x-sm">
                  <div className="w-10 h-10 bg-gradient-mint rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-canvas-deep" />
                  </div>
                  <div>
                    <h3 className="font-body text-title-md text-ink">{account.name}</h3>
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
                  <span className="text-body-strong">{account.phoneNumbers.length}</span>
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
                <button className="flex items-center justify-center px-sm py-xs border border-hairline-strong rounded-lg hover:bg-red-50 text-error transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

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
                {mockPhoneNumbers.map((phone) => (
                  <tr key={phone.id} className="hover:bg-hairline-soft">
                    <td className="px-md py-md font-body text-body-strong text-ink">{phone.number}</td>
                    <td className="px-md py-md font-body text-body-md text-body">{phone.displayName}</td>
                    <td className="px-md py-md">
                      <span className="bg-green-100 text-success text-caption-uppercase px-sm py-xxs rounded-pill font-medium">{phone.status}</span>
                    </td>
                    <td className="px-md py-md">
                      <div className="flex items-center space-x-xs">
                        <div className={`w-3 h-3 rounded-full ${qualityColors[phone.quality]}`} />
                        <span className="font-body text-body-sm capitalize text-body">{phone.quality}</span>
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
              </div>
              <div className="flex justify-end space-x-sm">
                <button 
                  onClick={() => setShowConnect(false)} 
                  className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                >
                  Cancel
                </button>
                <button className="px-md py-sm bg-primary text-on-primary rounded-pill font-body text-button hover:bg-primary-active transition">
                  Connect with Meta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}