'use client';

import { CreditCard, MessageSquare, Users, UserCog, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useBillingPlan, useBillingUsage, useWallet } from '../../../lib/hooks';

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

export default function BillingPage() {
  const { data: planRes, isLoading: planLoading } = useBillingPlan();
  const { data: usageRes } = useBillingUsage();
  const { data: walletRes } = useWallet();

  const current = planRes?.data?.current;
  const plans = planRes?.data?.plans || [];
  const usage = usageRes?.data;
  const wallet = walletRes?.data;

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
            <div className="flex items-center space-x-xs">
              <CreditCard className="w-4 h-4 text-muted" />
              <span className="font-display text-title-md text-ink">${(wallet?.balance ?? 0).toLocaleString()}</span>
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
                    {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
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
    </div>
  );
}
