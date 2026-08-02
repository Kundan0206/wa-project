'use client';

import { useState } from 'react';
import { CreditCard, MessageSquare, Users, UserCog, ArrowUpCircle, ArrowDownCircle, Plus, X } from 'lucide-react';
import {
  useBillingPlan, useBillingUsage, useWallet,
  useRazorpayConfig, useCreateTopUpOrder
} from '../../../lib/hooks';
import { useAuthStore } from '../../../lib/store';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function UsageBar({ label, used, limit, icon: Icon }: { label: string; used: number; limit: number; icon: any }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isNearLimit = pct >= 90;

  return (
    <div className="mb-md">
      <div className="flex items-center justify-between mb-xs">
        <div className="flex items-center space-x-xs">
          <Icon className="w-4 h-4 text-muted" />
          <span className="font-body text-body-sm text-ink">{label}</span>
        </div>
        <span className="font-body text-caption text-muted">
          {used.toLocaleString()} {limit > 0 ? `/ ${limit.toLocaleString()}` : ''}
        </span>
      </div>
      {limit > 0 && (
        <div className="w-full h-2 bg-hairline-soft rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-error' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PRESET_AMOUNTS = [500, 1000, 5000];

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const { data: planRes, isLoading: planLoading } = useBillingPlan();
  const { data: usageRes } = useBillingUsage();
  const { data: walletRes, refetch: refetchWallet } = useWallet();
  const { data: razorpayConfigRes } = useRazorpayConfig();
  const createOrder = useCreateTopUpOrder();

  const [showAddCredits, setShowAddCredits] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const current = planRes?.data?.current;
  const plans = planRes?.data?.plans || [];
  const usage = usageRes?.data;
  const wallet = walletRes?.data;
  const razorpayKeyId = razorpayConfigRes?.data?.keyId;

  const effectiveAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  const handlePay = async () => {
    setPayError('');

    if (effectiveAmount < 1) {
      setPayError('Enter an amount of at least ₹1');
      return;
    }
    if (!razorpayKeyId) {
      setPayError('Payments are not configured yet. Contact support.');
      return;
    }

    setPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPayError('Failed to load payment gateway. Check your connection and try again.');
        setPaying(false);
        return;
      }

      const orderRes = await createOrder.mutateAsync(effectiveAmount);
      const order = orderRes.data;
      if (!order) {
        setPayError('Failed to create payment order');
        setPaying(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'Wirely',
        description: `${order.amount} credits`,
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#292524' },
        handler: () => {
          // This callback only confirms the browser's checkout flow
          // completed - it is never trusted to credit the wallet. The
          // actual credit happens server-side once Razorpay's webhook
          // delivers a signature-verified payment.captured event, which
          // typically lands within a few seconds.
          setPaymentSuccess(true);
          setPaying(false);
          setTimeout(() => {
            refetchWallet();
          }, 3000);
        },
        modal: {
          ondismiss: () => setPaying(false)
        }
      });

      razorpay.on('payment.failed', () => {
        setPayError('Payment failed. No credits were added.');
        setPaying(false);
      });

      razorpay.open();
    } catch (err: any) {
      setPayError(err.message || 'Failed to start payment');
      setPaying(false);
    }
  };

  const closeModal = () => {
    setShowAddCredits(false);
    setPayError('');
    setPaymentSuccess(false);
    setSelectedAmount(500);
    setCustomAmount('');
    refetchWallet();
  };

  return (
    <div className="p-section max-w-3xl">
      <h1 className="font-display text-display-md text-ink mb-lg">Billing & Usage</h1>

      <div className="space-y-lg">
        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Current Plan</h2>
          {planLoading ? (
            <div className="h-16 bg-hairline-soft rounded animate-pulse" />
          ) : current ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-title-md text-ink">{(current as any).plans?.name || 'Unknown'}</p>
                <p className="font-body text-body-sm text-muted">
                  Renews {new Date(current.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <span className="text-caption-uppercase px-sm py-xxs rounded-pill bg-success/10 text-success">{current.status}</span>
            </div>
          ) : (
            <p className="font-body text-body-md text-muted">No active subscription &mdash; you&apos;re on the free tier.</p>
          )}
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Usage This Period</h2>
          {usage ? (
            <>
              <UsageBar label="Messages" used={usage.messages} limit={(current as any)?.plans?.messageLimit || 0} icon={MessageSquare} />
              <UsageBar label="Contacts" used={usage.contacts} limit={(current as any)?.plans?.contactLimit || 0} icon={Users} />
              <UsageBar label="Team Members" used={usage.agents} limit={(current as any)?.plans?.agentLimit || 0} icon={UserCog} />
            </>
          ) : (
            <div className="space-y-md">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-display text-display-sm text-ink">Wallet</h2>
            <div className="flex items-center space-x-md">
              <div className="flex items-center space-x-xs">
                <CreditCard className="w-4 h-4 text-muted" />
                <span className="font-display text-title-md text-ink">{(wallet?.balance ?? 0).toLocaleString()} credits</span>
              </div>
              <button
                onClick={() => setShowAddCredits(true)}
                className="bg-primary text-on-primary font-body text-button h-9 px-md rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Credits</span>
              </button>
            </div>
          </div>
          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="divide-y divide-hairline">
              {wallet.transactions.map((tx) => (
                <div key={tx.id} className="py-sm flex items-center justify-between">
                  <div className="flex items-center space-x-sm">
                    {tx.type === 'credit' ? (
                      <ArrowUpCircle className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4 text-error" />
                    )}
                    <div>
                      <p className="font-body text-body-sm text-ink">{tx.description}</p>
                      <p className="font-body text-caption text-muted-soft">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-body text-body-strong ${tx.type === 'credit' ? 'text-success' : 'text-error'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} credits
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-body-md text-muted text-center py-md">No transactions yet</p>
          )}
        </div>

        {plans.length > 0 && (
          <div className="bg-surface-card border border-hairline rounded-xl p-lg">
            <h2 className="font-display text-display-sm text-ink mb-md">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {plans.map((plan) => (
                <div key={plan.id} className={`border rounded-lg p-md ${current && (current as any).planId === plan.id ? 'border-primary bg-primary/5' : 'border-hairline'}`}>
                  <p className="font-body text-title-sm text-ink mb-xs">{plan.name}</p>
                  <p className="font-display text-display-sm text-ink mb-sm">${plan.priceMonthly}<span className="font-body text-caption text-muted">/mo</span></p>
                  <ul className="font-body text-caption text-muted space-y-xxs">
                    <li>{plan.messageLimit.toLocaleString()} messages</li>
                    <li>{plan.contactLimit.toLocaleString()} contacts</li>
                    <li>{plan.agentLimit} team members</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddCredits && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Add Credits</h2>
              <button onClick={closeModal} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="text-center py-md">
                <div className="p-md bg-success/10 border border-success/20 rounded-lg font-body text-body-md text-success mb-md">
                  Payment received! Your credits will appear in a few seconds once confirmed.
                </div>
                <button
                  onClick={closeModal}
                  className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="font-body text-body-sm text-muted mb-md">1 &#8377; = 1 credit. Choose an amount or enter your own.</p>

                <div className="grid grid-cols-3 gap-sm mb-md">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-sm rounded-lg font-body text-body-sm border transition ${
                        selectedAmount === amt ? 'border-primary bg-primary/10 text-primary' : 'border-hairline-strong text-ink hover:bg-hairline-soft'
                      }`}
                    >
                      &#8377;{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Custom amount (&#8377;)</label>
                  <input
                    type="number"
                    min={1}
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    placeholder="e.g. 2500"
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>

                {effectiveAmount > 0 && (
                  <p className="font-body text-body-sm text-muted mt-sm">
                    You&apos;ll receive <strong className="text-ink">{effectiveAmount.toLocaleString()} credits</strong>
                  </p>
                )}

                {payError && (
                  <p className="font-body text-body-sm text-error mt-sm">{payError}</p>
                )}

                <div className="flex justify-end space-x-sm pt-md mt-md border-t border-hairline">
                  <button
                    onClick={closeModal}
                    className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePay}
                    disabled={paying || effectiveAmount < 1}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                  >
                    {paying ? 'Opening...' : `Pay ₹${effectiveAmount.toLocaleString() || 0}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
