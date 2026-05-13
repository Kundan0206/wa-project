'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    businessName: 'My Company',
    businessEmail: 'contact@example.com',
    businessPhone: '+1 234 567 8900',
    businessAddress: '123 Business St, City, State 12345',
    notificationEmail: true,
    notificationSms: false
  });

  return (
    <div className="p-section max-w-3xl">
      <h1 className="font-display text-display-md text-ink mb-lg">Settings</h1>

      <div className="space-y-lg">
        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Business Profile</h2>
          <div className="space-y-md">
            <div>
              <label className="font-body text-caption text-muted mb-xs">Business Name</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="font-body text-caption text-muted mb-xs">Email</label>
              <input
                type="email"
                value={settings.businessEmail}
                onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="font-body text-caption text-muted mb-xs">Phone</label>
              <input
                type="tel"
                value={settings.businessPhone}
                onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="font-body text-caption text-muted mb-xs">Address</label>
              <textarea
                value={settings.businessAddress}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                rows={2}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Notifications</h2>
          <div className="space-y-md">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-caption text-muted">Email notifications</span>
              <input
                type="checkbox"
                checked={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.checked })}
                className="w-5 h-5 rounded border border-hairline-strong text-primary focus:border-2 focus:border-primary"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-caption text-muted">SMS notifications</span>
              <input
                type="checkbox"
                checked={settings.notificationSms}
                onChange={(e) => setSettings({ ...settings, notificationSms: e.target.checked })}
                className="w-5 h-5 rounded border border-hairline-strong text-primary focus:border-2 focus:border-primary"
              />
            </label>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Security</h2>
          <div className="space-y-md">
            <button className="w-full text-left px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft flex items-center justify-between transition">
              <span>Enable Two-Factor Authentication</span>
              <span className="font-body text-caption text-muted">Setup</span>
            </button>
            <button className="w-full text-left px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft flex items-center justify-between transition">
              <span>Change Password</span>
              <span className="font-body text-caption text-muted">Update</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-sm">
          <button className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}