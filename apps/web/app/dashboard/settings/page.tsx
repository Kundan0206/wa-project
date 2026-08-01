'use client';

import { useState, useEffect } from 'react';
import {
  useBusinessProfile, useUpdateBusinessProfile,
  useNotificationSettings, useUpdateNotificationSettings,
  useChangePassword
} from '../../../lib/hooks';

export default function SettingsPage() {
  const { data: profileRes, isLoading } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();
  const { data: notificationsRes } = useNotificationSettings();
  const updateNotifications = useUpdateNotificationSettings();
  const changePassword = useChangePassword();

  const [form, setForm] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    const d = profileRes?.data;
    if (d) {
      setForm({
        businessName: d.businessName || '',
        businessEmail: d.businessEmail || '',
        businessPhone: d.businessPhone || '',
        businessAddress: d.businessAddress || '',
      });
    }
  }, [profileRes]);

  const notificationEmail = notificationsRes?.data?.notificationEmail ?? true;
  const notificationSms = notificationsRes?.data?.notificationSms ?? false;

  const handleSave = async () => {
    setSaveMessage('');
    try {
      await updateProfile.mutateAsync({
        business_name: form.businessName,
        business_email: form.businessEmail,
        business_phone: form.businessPhone,
        business_address: form.businessAddress,
      });
      setSaveMessage('Saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setSaveMessage(err.message || 'Failed to save');
    }
  };

  const handleToggleNotification = (key: 'notification_email' | 'notification_sms', value: boolean) => {
    updateNotifications.mutate({ [key]: value });
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    try {
      await changePassword.mutateAsync();
      setPasswordMessage('Password reset email sent - check your inbox.');
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to send reset email');
    }
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
                checked={notificationEmail}
                onChange={(e) => handleToggleNotification('notification_email', e.target.checked)}
                disabled={updateNotifications.isPending}
                className="w-5 h-5 rounded border border-hairline-strong text-primary focus:border-2 focus:border-primary"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-body text-caption text-muted">SMS notifications</span>
              <input
                type="checkbox"
                checked={notificationSms}
                onChange={(e) => handleToggleNotification('notification_sms', e.target.checked)}
                disabled={updateNotifications.isPending}
                className="w-5 h-5 rounded border border-hairline-strong text-primary focus:border-2 focus:border-primary"
              />
            </label>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Security</h2>
          <div className="space-y-md">
            <div className="w-full text-left px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-muted flex items-center justify-between opacity-60 cursor-not-allowed">
              <span>Two-Factor Authentication</span>
              <span className="font-body text-caption text-muted">Coming soon</span>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changePassword.isPending}
              className="w-full text-left px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft flex items-center justify-between transition disabled:opacity-50"
            >
              <span>Change Password</span>
              <span className="font-body text-caption text-muted">
                {changePassword.isPending ? 'Sending...' : 'Send reset email'}
              </span>
            </button>
            {passwordMessage && (
              <p className="font-body text-body-sm text-muted">{passwordMessage}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-sm">
          {saveMessage && (
            <span className="font-body text-body-sm text-muted">{saveMessage}</span>
          )}
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
