'use client';

import { useState, useEffect } from 'react';
import { useBusinessProfile, useUpdateBusinessProfile } from '../../../lib/hooks';

export default function SettingsPage() {
  const { data: profileRes, isLoading } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();

  const [form, setForm] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    notificationEmail: true,
    notificationSms: false,
  });

  useEffect(() => {
    const d = profileRes?.data;
    if (d) {
      setForm((prev) => ({
        ...prev,
        businessName: d.business_name || '',
        businessEmail: d.business_email || '',
        businessPhone: d.business_phone || '',
        businessAddress: d.business_address || '',
      }));
    }
  }, [profileRes]);

  const handleSave = async () => {
    updateProfile.mutate({
      business_name: form.businessName,
      business_email: form.businessEmail,
      business_phone: form.businessPhone,
      business_address: form.businessAddress,
    });
  };

  return (
    <div className="p-section max-w-3xl">
      <h1 className="font-display text-display-md text-ink mb-lg">Settings</h1>

      <div className="space-y-lg">
        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Business Profile</h2>
          {isLoading ? (
            <div className="space-y-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-md">
              <div>
                <label className="font-body text-caption text-muted mb-xs">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="font-body text-caption text-muted mb-xs">Email</label>
                <input
                  type="email"
                  value={form.businessEmail}
                  onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="font-body text-caption text-muted mb-xs">Phone</label>
                <input
                  type="tel"
                  value={form.businessPhone}
                  onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="font-body text-caption text-muted mb-xs">Address</label>
                <textarea
                  value={form.businessAddress}
                  onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                  rows={2}
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-md pr-sm py-sm focus:outline-none focus:border-2 focus:border-primary transition resize-y"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Notifications</h2>
          <div className="space-y-md">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-caption text-muted">Email notifications</span>
              <input
                type="checkbox"
                checked={form.notificationEmail}
                onChange={(e) => setForm({ ...form, notificationEmail: e.target.checked })}
                className="w-5 h-5 rounded border border-hairline-strong text-primary focus:border-2 focus:border-primary"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-caption text-muted">SMS notifications</span>
              <input
                type="checkbox"
                checked={form.notificationSms}
                onChange={(e) => setForm({ ...form, notificationSms: e.target.checked })}
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
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
