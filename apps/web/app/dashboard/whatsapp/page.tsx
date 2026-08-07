'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, RefreshCw, Settings, Phone, CheckCircle, AlertCircle, Send, X, Sparkles, Webhook, Stethoscope, RotateCcw, XCircle } from 'lucide-react';

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}
import {
  useWabaAccounts, useDisconnectWaba, usePhoneNumbers, useEmbeddedCallback,
  useSyncPhoneNumbers, useRegisterPhoneNumber, useDeregisterPhoneNumber,
  useRequestVerificationCode, useVerifyPhoneCode, useWabaMetaDetails, useSetDefaultPhoneNumber,
  usePhoneNumberDetails, useSubscribeWabaWebhooks, useTestWabaConnection, WabaConnectionCheck
} from '../../../lib/hooks';

const qualityColors: Record<string, string> = {
  green: 'bg-success',
  yellow: 'bg-yellow-500',
  red: 'bg-error',
  na: 'bg-muted-soft',
  verified: 'bg-success',
  registered: 'bg-primary',
  pending: 'bg-yellow-500'
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  registered: 'Registered',
  verified: 'Verified',
  pending: 'Pending',
  deregistered: 'Deregistered'
};

function WhatsAppContent() {
  const searchParams = useSearchParams();
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [registerPin, setRegisterPin] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [embeddedSignupLoaded, setEmbeddedSignupLoaded] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [detailsWabaId, setDetailsWabaId] = useState<string | null>(null);
  const [detailsPhoneId, setDetailsPhoneId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [testResultsWabaId, setTestResultsWabaId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ healthy: boolean; checks: WabaConnectionCheck[] } | null>(null);
  const [testError, setTestError] = useState('');
  const fbRef = useRef<any>(null);

  const { data: wabaRes, isLoading: wabaLoading, refetch } = useWabaAccounts();
  const { data: phoneRes, refetch: refetchPhones } = usePhoneNumbers();
  const disconnectWaba = useDisconnectWaba();
  const embeddedCallback = useEmbeddedCallback();
  const syncPhoneNumbers = useSyncPhoneNumbers();
  const registerPhone = useRegisterPhoneNumber();
  const deregisterPhone = useDeregisterPhoneNumber();
  const requestCode = useRequestVerificationCode();
  const verifyCodeMutation = useVerifyPhoneCode();
  const setDefaultPhone = useSetDefaultPhoneNumber();
  const subscribeWebhooks = useSubscribeWabaWebhooks();
  const testConnection = useTestWabaConnection();
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const accounts = wabaRes?.data || [];
  const phoneNumbers = phoneRes?.data || [];

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      setCodeError(message || 'OAuth error');
      window.history.replaceState({}, '', '/dashboard/whatsapp');
    }
  }, [searchParams]);

  const handleEmbeddedSignupCallback = async (code: string) => {
    setConnecting(true);
    setCodeError('');
    try {
      const res = await embeddedCallback.mutateAsync(code);
      const { wabaIds = [], skipped = [] } = res.data || {};

      if (wabaIds.length > 0) {
        setCodeSuccess(
          wabaIds.length === 1
            ? 'WhatsApp Business Account connected successfully!'
            : `Connected ${wabaIds.length} WhatsApp Business Accounts successfully!`
        );
      } else if (skipped.length > 0) {
        setCodeError('That WhatsApp Business Account is already connected to another workspace.');
      } else {
        setCodeError('No WhatsApp Business Account was returned by Meta. Please try again.');
      }
      refetch();
    } catch (err: any) {
      setCodeError(err.message || 'Failed to connect WhatsApp Business Account');
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !fbRef.current) {
      const appId = process.env.NEXT_PUBLIC_META_APP_ID || '1198923135565390';

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v25.0'
        });
        setEmbeddedSignupLoaded(true);
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  // Meta's Embedded Signup dialog is used for both connecting an existing
  // WhatsApp Business Account and creating a new one - it shows the user's
  // existing accounts (if any) as part of its own UI, and the backend
  // (embedded-callback) discovers and connects whichever account results,
  // instead of always assuming a brand new one was created.
  const startEmbeddedSignup = () => {
    if (typeof window !== 'undefined' && window.FB) {
      setCodeError('');
      window.FB.login((response: any) => {
        if (response.authResponse && response.authResponse.code) {
          handleEmbeddedSignupCallback(response.authResponse.code);
        } else {
          setCodeError('Meta login was cancelled or did not return an authorization code.');
        }
      }, {
        config_id: '2026748608261800',
        response_type: 'code',
        override_default_response_type: true,
        extras: { "version": "v25.0" }
      });
    } else {
      setCodeError('Facebook SDK not loaded. Please refresh and try again.');
    }
  };

  const handleDisconnect = async (id: string) => {
    if (confirm('Disconnect this WABA account? This will remove all phone numbers.')) {
      try {
        await disconnectWaba.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || 'Failed to disconnect WABA account');
      }
    }
  };

  const handleSync = async () => {
    try {
      await syncPhoneNumbers.mutateAsync();
      refetchPhones();
    } catch (err: any) {
      alert(err.message || 'Failed to sync phone numbers');
    }
  };

  const handleSubscribeWebhooks = async (wabaId: string) => {
    setSubscribeMessage('');
    try {
      await subscribeWebhooks.mutateAsync(wabaId);
      setSubscribeMessage('Subscribed! Incoming messages should now reach your inbox.');
      setTimeout(() => setSubscribeMessage(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to subscribe to webhooks');
    }
  };

  const handleTestConnection = async (wabaId: string) => {
    setTestResultsWabaId(wabaId);
    setTestResults(null);
    setTestError('');
    try {
      const res = await testConnection.mutateAsync(wabaId);
      if (res.data) setTestResults(res.data);
    } catch (err: any) {
      setTestError(err.message || 'Failed to test connection');
    }
  };

  // Meta's Embedded Signup updates the access token in place for a WABA it
  // already recognizes as connected (see embedded-callback), rather than
  // creating a duplicate - so "Reconnect" is the same flow as connecting,
  // just re-run to mint a fresh token when the old one has expired or lost
  // permissions (e.g. the "code 200: no permission to send" error).
  const handleReconnect = () => {
    setReconnecting(true);
    setShowAddNumber(true);
  };

  const handleRegister = async () => {
    if (!registerPin || registerPin.length !== 6) {
      alert('Please enter a 6-digit PIN');
      return;
    }
    try {
      await registerPhone.mutateAsync({ id: selectedPhoneId!, pin: registerPin });
      setShowRegisterModal(false);
      setRegisterPin('');
      refetchPhones();
      alert('Phone registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to register phone');
    }
  };

  const handleRequestCode = async () => {
    try {
      await requestCode.mutateAsync({ id: selectedPhoneId!, method: 'SMS' });
      alert('Verification code sent! Check your phone.');
    } catch (err: any) {
      alert(err.message || 'Failed to send code');
    }
  };

  const handleVerify = async () => {
    if (!verifyCode) {
      alert('Please enter the verification code');
      return;
    }
    try {
      await verifyCodeMutation.mutateAsync({ id: selectedPhoneId!, code: verifyCode });
      setShowVerifyModal(false);
      setVerifyCode('');
      refetchPhones();
      alert('Phone verified successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to verify phone');
    }
  };

  const handleDeregister = async (id: string) => {
    if (confirm('Deregister this phone number? You can re-register it later.')) {
      try {
        await deregisterPhone.mutateAsync(id);
        refetchPhones();
      } catch (err: any) {
        alert(err.message || 'Failed to deregister');
      }
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        {subscribeMessage && (
          <div className="mb-md p-md bg-success/10 border border-success/20 rounded-lg font-body text-body-sm text-success">
            {subscribeMessage}
          </div>
        )}
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">WhatsApp Accounts</h1>
            <p className="font-body text-body-md text-muted mt-xs">Connect and manage your WhatsApp Business API</p>
          </div>
          <div className="flex items-center space-x-sm">
            <button
              onClick={() => setShowAddNumber(true)}
              className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
            >
              <Plus className="w-4 h-4" />
              <span>Connect WhatsApp</span>
            </button>
          </div>
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
                No WABA accounts connected. Click &ldquo;Connect WhatsApp&rdquo; to connect an account you already manage, or create a new one.
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
                    <span className="text-muted">Timezone ID</span>
                    <span className="text-body-strong">{account.timezone}</span>
                  </div>
                  <div className="flex justify-between font-body text-body-md">
                    <span className="text-muted">Phone Numbers</span>
                    <span className="text-body-strong">{(account as any).phoneNumbers?.length || 0}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-xs pt-md border-t border-hairline">
                  <button
                    onClick={() => handleTestConnection(account.id)}
                    disabled={testConnection.isPending}
                    title="Check whether this account's access token can still send messages"
                    className="flex items-center justify-center gap-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition disabled:opacity-50"
                  >
                    <Stethoscope className={`w-4 h-4 ${testConnection.isPending && testResultsWabaId === account.id ? 'animate-pulse' : ''}`} />
                    <span>Test Connection</span>
                  </button>
                  <button
                    onClick={handleReconnect}
                    title="Re-run Meta's Embedded Signup to refresh this account's access token"
                    className="flex items-center justify-center gap-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reconnect</span>
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncPhoneNumbers.isPending}
                    className="flex items-center justify-center gap-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncPhoneNumbers.isPending ? 'animate-spin' : ''}`} />
                    <span>{syncPhoneNumbers.isPending ? 'Syncing...' : 'Sync'}</span>
                  </button>
                  <button
                    onClick={() => setDetailsWabaId(account.id)}
                    className="flex items-center justify-center gap-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Details</span>
                  </button>
                  <button
                    onClick={() => handleSubscribeWebhooks(account.id)}
                    disabled={subscribeWebhooks.isPending}
                    title="Re-subscribe to incoming message webhooks for this account"
                    className="flex items-center justify-center gap-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition disabled:opacity-50"
                  >
                    <Webhook className="w-4 h-4" />
                    <span>{subscribeWebhooks.isPending ? 'Subscribing...' : 'Enable Inbox'}</span>
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
            <div className="flex space-x-sm">
              {accounts.length > 0 && (
                <button 
                  onClick={handleSync}
                  disabled={syncPhoneNumbers.isPending}
                  className="px-md py-xs border border-hairline-strong rounded-lg font-body text-body-sm text-ink hover:bg-hairline-soft flex items-center gap-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncPhoneNumbers.isPending ? 'animate-spin' : ''}`} />
                  Sync from Meta
                </button>
              )}
            </div>
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
                      No phone numbers. Connect a WABA and sync to fetch phone numbers.
                    </td>
                  </tr>
                )}
                {phoneNumbers.map((phone) => (
                  <tr key={phone.id} className="hover:bg-hairline-soft">
                    <td className="px-md py-md font-body text-body-strong text-ink">{phone.displayNumber}</td>
                    <td className="px-md py-md font-body text-body-md text-body">{phone.displayName || '-'}</td>
                    <td className="px-md py-md">
                      <span className={`text-caption-uppercase px-sm py-xxs rounded-pill font-medium ${
                        phone.status === 'registered' || phone.status === 'verified' 
                          ? 'bg-success/10 text-success' 
                          : phone.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-hairline-soft text-muted'
                      }`}>
                        {statusLabels[phone.status] || phone.status}
                      </span>
                    </td>
                    <td className="px-md py-md">
                      <div className="flex items-center space-x-xs">
                        <div className={`w-3 h-3 rounded-full ${qualityColors[phone.qualityRating] || 'bg-muted-soft'}`} />
                        <span className="font-body text-body-sm capitalize text-body">{phone.qualityRating || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-md py-md">
                      {phone.isDefault ? (
                        <span className="bg-surface-strong text-ink text-caption-uppercase px-sm py-xxs rounded-pill font-medium">Default</span>
                      ) : (
                        <button
                          onClick={() => setDefaultPhone.mutate(phone.id)}
                          disabled={setDefaultPhone.isPending}
                          className="font-body text-body-sm text-primary hover:underline disabled:opacity-50"
                        >
                          Set as default
                        </button>
                      )}
                    </td>
                    <td className="px-md py-md">
                      <div className="flex items-center space-x-xs">
                        {phone.status !== 'registered' && phone.status !== 'verified' && (
                          <button 
                            onClick={() => { setSelectedPhoneId(phone.id); setShowRegisterModal(true); }}
                            className="p-xs bg-primary/10 hover:bg-primary/20 rounded-md transition text-primary"
                            title="Register phone number"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {phone.status === 'registered' && (
                          <button 
                            onClick={() => { setSelectedPhoneId(phone.id); setShowVerifyModal(true); }}
                            className="p-xs bg-success/10 hover:bg-success/20 rounded-md transition text-success"
                            title="Verify phone number"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        {phone.status === 'verified' && (
                          <button 
                            className="p-xs bg-success/10 rounded-md transition text-success"
                            title="Verified"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDetailsPhoneId(phone.id)}
                          className="p-xs hover:bg-hairline-soft rounded-md transition"
                          title="Details"
                        >
                          <Settings className="w-4 h-4 text-muted" />
                        </button>
                        <button 
                          onClick={() => handleDeregister(phone.id)}
                          className="p-xs hover:bg-red-50 rounded-md transition" 
                          title="Deregister"
                        >
                          <Trash2 className="w-4 h-4 text-muted hover:text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connect/Reconnect WhatsApp Modal - Embedded Signup (handles both existing and new accounts) */}
        {showAddNumber && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-display text-display-md text-ink">{reconnecting ? 'Reconnect WhatsApp Business' : 'Connect WhatsApp Business'}</h2>
                <button
                  onClick={() => { setShowAddNumber(false); setCodeError(''); setCodeSuccess(''); setReconnecting(false); }}
                  className="p-xs hover:bg-hairline-soft rounded"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              {codeSuccess && (
                <div className="mb-md p-md bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-sm text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-body text-body-md">{codeSuccess}</span>
                  </div>
                </div>
              )}

              {!codeSuccess && (
                <>
                  <div className="bg-gradient-mint/20 border border-hairline rounded-lg p-md mb-md">
                    {reconnecting ? (
                      <p className="font-body text-body-sm text-muted mb-sm">
                        Re-run Meta&apos;s sign-in below and pick the same WhatsApp Business Account.
                        This mints a fresh access token for it &mdash; use this if Test Connection
                        reported a permission or authentication error.
                      </p>
                    ) : (
                      <p className="font-body text-body-sm text-muted mb-sm">
                        This opens Meta&apos;s Embedded Signup flow. If you already manage a WhatsApp
                        Business Account in Meta Business Manager, Meta will let you select it there
                        &mdash; no duplicate account will be created. You can also create a brand new
                        account from the same flow.
                      </p>
                    )}
                    <ul className="font-body text-body-sm text-muted list-disc list-inside space-y-xs">
                      <li>Connect an existing WhatsApp Business Account, or create a new one</li>
                      <li>Add and verify a phone number</li>
                      <li>Set up your business profile</li>
                    </ul>
                  </div>

                  {codeError && (
                    <p className="font-body text-body-sm text-error mb-md">{codeError}</p>
                  )}

                  <div className="flex space-x-sm">
                    <button
                      onClick={startEmbeddedSignup}
                      disabled={!embeddedSignupLoaded || connecting}
                      className="flex-1 bg-gradient-mint text-canvas-deep font-body text-button h-10 rounded-pill hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center space-x-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {connecting ? 'Connecting...' : !embeddedSignupLoaded ? 'Loading...' : reconnecting ? 'Reconnect with Meta' : 'Connect with Meta'}
                      </span>
                    </button>
                    <button
                      onClick={() => { setShowAddNumber(false); setReconnecting(false); }}
                      className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {codeSuccess && (
                <div className="flex justify-end">
                  <button
                    onClick={() => { setShowAddNumber(false); setCodeSuccess(''); setCodeError(''); setReconnecting(false); }}
                    className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Register Phone Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-display text-display-sm text-ink">Register Phone Number</h2>
                <button onClick={() => setShowRegisterModal(false)} className="p-xs hover:bg-hairline-soft rounded">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <p className="font-body text-body-sm text-muted mb-md">
                Enter the 6-digit PIN you set up for two-step verification. This is required to send messages.
              </p>
              <input
                type="text"
                maxLength={6}
                value={registerPin}
                onChange={(e) => setRegisterPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN"
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-lg text-ink px-md py-sm h-12 text-center tracking-widest mb-md"
              />
              <button
                onClick={handleRegister}
                disabled={registerPhone.isPending || registerPin.length !== 6}
                className="w-full bg-primary text-on-primary font-body text-button h-10 rounded-pill hover:bg-primary-active transition disabled:opacity-50"
              >
                {registerPhone.isPending ? 'Registering...' : 'Register'}
              </button>
            </div>
          </div>
        )}

        {/* Verify Phone Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-display text-display-sm text-ink">Verify Phone Number</h2>
                <button onClick={() => setShowVerifyModal(false)} className="p-xs hover:bg-hairline-soft rounded">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <p className="font-body text-body-sm text-muted mb-md">
                First, request a verification code sent to your phone, then enter it below.
              </p>
              <button
                onClick={handleRequestCode}
                disabled={requestCode.isPending}
                className="w-full bg-surface-strong text-ink font-body text-button h-10 rounded-pill hover:bg-hairline-soft transition disabled:opacity-50 mb-md"
              >
                {requestCode.isPending ? 'Sending...' : 'Request Code'}
              </button>
              <input
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-lg text-ink px-md py-sm h-12 text-center tracking-widest mb-md"
              />
              <button
                onClick={handleVerify}
                disabled={verifyCodeMutation.isPending || verifyCode.length !== 6}
                className="w-full bg-primary text-on-primary font-body text-button h-10 rounded-pill hover:bg-primary-active transition disabled:opacity-50"
              >
                {verifyCodeMutation.isPending ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}
      </div>

      {detailsWabaId && (
        <WabaDetailsModal wabaId={detailsWabaId} onClose={() => setDetailsWabaId(null)} />
      )}

      {detailsPhoneId && (
        <PhoneDetailsModal phoneId={detailsPhoneId} onClose={() => setDetailsPhoneId(null)} />
      )}

      {testResultsWabaId && (
        <TestConnectionModal
          isPending={testConnection.isPending}
          results={testResults}
          error={testError}
          onReconnect={() => { setTestResultsWabaId(null); handleReconnect(); }}
          onClose={() => { setTestResultsWabaId(null); setTestResults(null); setTestError(''); }}
        />
      )}
    </div>
  );
}

function TestConnectionModal({
  isPending, results, error, onReconnect, onClose
}: {
  isPending: boolean;
  results: { healthy: boolean; checks: WabaConnectionCheck[] } | null;
  error: string;
  onReconnect: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50 p-md">
      <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-display-sm text-ink">Connection Test</h2>
          <button onClick={onClose} className="p-xs hover:bg-hairline-soft rounded">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {isPending ? (
          <div className="space-y-sm">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 bg-hairline-soft rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="font-body text-body-md text-error text-center py-lg">{error}</p>
        ) : results ? (
          <>
            <div className={`flex items-center gap-sm p-md rounded-lg mb-md ${results.healthy ? 'bg-success/10' : 'bg-error/10'}`}>
              {results.healthy ? <CheckCircle className="w-5 h-5 text-success flex-shrink-0" /> : <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
              <span className={`font-body text-body-md ${results.healthy ? 'text-success' : 'text-error'}`}>
                {results.healthy ? 'This account can send messages' : 'This account cannot send messages right now'}
              </span>
            </div>

            <div className="space-y-sm mb-md">
              {results.checks.map((c, i) => (
                <div key={i} className="border border-hairline rounded-lg p-sm">
                  <div className="flex items-center gap-xs mb-xxs">
                    {c.ok ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0" /> : <XCircle className="w-4 h-4 text-error flex-shrink-0" />}
                    <span className="font-body text-body-strong text-ink text-body-sm">{c.check}</span>
                  </div>
                  <p className={`font-body text-caption ${c.ok ? 'text-muted' : 'text-error'}`}>{c.detail}</p>
                </div>
              ))}
            </div>

            {!results.healthy && (
              <button
                onClick={onReconnect}
                className="w-full flex items-center justify-center gap-xs bg-primary text-on-primary font-body text-button h-10 rounded-pill hover:bg-primary-active transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reconnect this account
              </button>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function PhoneDetailsModal({ phoneId, onClose }: { phoneId: string; onClose: () => void }) {
  const { data, isLoading, error } = usePhoneNumberDetails(phoneId);
  const details = data?.data;

  return (
    <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
      <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-display-sm text-ink">Phone Number Details</h2>
          <button onClick={onClose} className="p-xs hover:bg-hairline-soft rounded">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-hairline-soft rounded animate-pulse" />
            ))}
          </div>
        ) : error || !details ? (
          <p className="font-body text-body-md text-error text-center py-lg">Failed to load details from Meta</p>
        ) : (
          <div className="space-y-sm">
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Number</span>
              <span className="text-body-strong">{details.display_phone_number || details.displayPhoneNumber || '-'}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Verified Name</span>
              <span className="text-body-strong">{details.verified_name || details.verifiedName || '-'}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Quality Rating</span>
              <span className="text-body-strong capitalize">{(details.quality_rating || details.qualityRating || '-').toLowerCase()}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Status</span>
              <span className="text-body-strong capitalize">{(details.status || '-').toLowerCase()}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Name Status</span>
              <span className="text-body-strong capitalize">{(details.name_status || details.nameStatus || '-').toLowerCase()}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Code Verification</span>
              <span className="text-body-strong capitalize">{(details.code_verification_status || details.codeVerificationStatus || '-').toLowerCase()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WabaDetailsModal({ wabaId, onClose }: { wabaId: string; onClose: () => void }) {
  const { data, isLoading, error } = useWabaMetaDetails(wabaId, true);
  const details = data?.data;

  return (
    <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
      <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-display-sm text-ink">Account Details</h2>
          <button onClick={onClose} className="p-xs hover:bg-hairline-soft rounded">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-hairline-soft rounded animate-pulse" />
            ))}
          </div>
        ) : error || !details ? (
          <p className="font-body text-body-md text-error text-center py-lg">Failed to load account details from Meta</p>
        ) : (
          <div className="space-y-sm">
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Name</span>
              <span className="text-body-strong">{details.name || '-'}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">WABA ID</span>
              <span className="text-body-strong">{details.id}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Currency</span>
              <span className="text-body-strong">{details.currency || '-'}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Timezone ID</span>
              <span className="text-body-strong">{details.timezoneId || '-'}</span>
            </div>
            <div className="flex justify-between font-body text-body-md">
              <span className="text-muted">Template Namespace</span>
              <span className="text-body-strong text-caption break-all">{details.messageTemplateNamespace || '-'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  return <WhatsAppContent />;
}