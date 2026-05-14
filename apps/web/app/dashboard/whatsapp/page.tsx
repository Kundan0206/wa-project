'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, RefreshCw, Settings, Phone, CheckCircle, AlertCircle, Send, X } from 'lucide-react';
import { 
  useWabaAccounts, useDisconnectWaba, usePhoneNumbers, useConnectWaba, 
  useSyncPhoneNumbers, useRegisterPhoneNumber, useDeregisterPhoneNumber,
  useRequestVerificationCode, useVerifyPhoneCode
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
  const [showConnect, setShowConnect] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [registerPin, setRegisterPin] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const { data: wabaRes, isLoading: wabaLoading, refetch } = useWabaAccounts();
  const { data: phoneRes, refetch: refetchPhones } = usePhoneNumbers();
  const disconnectWaba = useDisconnectWaba();
  const connectWaba = useConnectWaba();
  const syncPhoneNumbers = useSyncPhoneNumbers();
  const registerPhone = useRegisterPhoneNumber();
  const deregisterPhone = useDeregisterPhoneNumber();
  const requestCode = useRequestVerificationCode();
  const verifyCodeMutation = useVerifyPhoneCode();

  const accounts = wabaRes?.data || [];
  const phoneNumbers = phoneRes?.data || [];

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (code) {
      setAuthCode(code);
      setShowConnect(true);
      window.history.replaceState({}, '', '/dashboard/whatsapp');
    }
    if (error) {
      setCodeError(message || 'OAuth error');
    }
  }, [searchParams]);

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) {
      setCodeError('Please enter the authorization code');
      return;
    }

    try {
      await connectWaba.mutateAsync(authCode.trim());
      setCodeSuccess('WABA connected successfully!');
      setAuthCode('');
      setShowConnect(false);
      refetch();
    } catch (err: any) {
      setCodeError(err.message || 'Failed to connect WABA');
    }
  };

  const handleDisconnect = async (id: string) => {
    if (confirm('Disconnect this WABA account? This will remove all phone numbers.')) {
      disconnectWaba.mutate(id);
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

  const getMetaAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_META_APP_ID || '1198923135565390';
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/waba/callback`;
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=whatsapp_business_messaging,whatsapp_business_management`;
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
                  <button 
                    onClick={handleSync}
                    disabled={syncPhoneNumbers.isPending}
                    className="flex-1 flex items-center justify-center space-x-xs px-sm py-xs border border-hairline-strong rounded-lg hover:bg-hairline-soft font-body text-body-sm text-ink transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncPhoneNumbers.isPending ? 'animate-spin' : ''}`} />
                    <span>{syncPhoneNumbers.isPending ? 'Syncing...' : 'Sync'}</span>
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
                        <button className="font-body text-body-sm text-primary hover:underline">Set as default</button>
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
                        <button className="p-xs hover:bg-hairline-soft rounded-md transition" title="Settings">
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

        {/* Connect WABA Modal */}
        {showConnect && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft">
              <h2 className="font-display text-display-md text-ink mb-md">Connect WhatsApp Business</h2>
              
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
                  <div className="bg-gradient-sky/20 border border-hairline rounded-lg p-md mb-md">
                    <p className="font-body text-body-md text-body mb-sm">
                      Click &ldquo;Connect with Meta&rdquo; below to authorize via Meta.
                    </p>
                    <p className="font-body text-body-sm text-muted">
                      After authorization, you&apos;ll be redirected back. Then enter the authorization code below to complete the connection.
                    </p>
                  </div>

                  <form onSubmit={handleConnectSubmit} className="mb-md">
                    <label className="font-body text-caption text-muted mb-xs block">Authorization Code</label>
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => { setAuthCode(e.target.value); setCodeError(''); }}
                      placeholder="Paste the authorization code here"
                      className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition mb-sm"
                    />
                    {codeError && (
                      <p className="font-body text-body-sm text-error">{codeError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={connectWaba.isPending}
                      className="w-full bg-primary text-on-primary font-body text-button h-10 rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                    >
                      {connectWaba.isPending ? 'Connecting...' : 'Submit Code'}
                    </button>
                  </form>

                  <div className="border-t border-hairline pt-md">
                    <p className="font-body text-caption text-muted mb-sm">Step 1: Authorize with Meta</p>
                    <a
                      href={getMetaAuthUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                    >
                      Connect with Meta
                    </a>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-sm mt-md pt-md border-t border-hairline">
                <button
                  onClick={() => { setShowConnect(false); setCodeError(''); setCodeSuccess(''); setAuthCode(''); }}
                  className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                >
                  {codeSuccess ? 'Done' : 'Cancel'}
                </button>
              </div>
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
    </div>
  );
}

export default function WhatsAppPage() {
  return <WhatsAppContent />;
}