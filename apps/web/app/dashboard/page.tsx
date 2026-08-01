'use client';

import { MessageSquare, Users, Send, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAnalyticsOverview, useAnalyticsMessages, useAnalyticsTrends, useCampaigns, useFlows } from '../../lib/hooks';
import { useAuthStore } from '../../lib/store';

const PIE_COLORS: Record<string, string> = {
  text: '#292524',
  template: '#16a34a',
  image: '#a8a29e',
  video: '#777169',
  document: '#57534e',
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: overview } = useAnalyticsOverview();
  const { data: msgAnalytics } = useAnalyticsMessages();
  const { data: trendsRes } = useAnalyticsTrends(7);
  const { data: campaigns } = useCampaigns({ limit: '3' });
  const { data: flows } = useFlows();

  const stats = overview?.data ? [
    { label: 'Total Messages', value: (overview.data.totalMessages ?? 0).toLocaleString(), change: '', up: true, icon: MessageSquare },
    { label: 'Delivered', value: overview.data.deliveryRate + '%', change: '', up: true, icon: TrendingUp },
    { label: 'Contacts', value: (overview.data.totalContacts ?? 0).toLocaleString(), change: '', up: true, icon: Users },
    { label: 'Active Conversations', value: (overview.data.activeConversations ?? 0).toLocaleString(), change: '', up: true, icon: Send }
  ] : [];

  const byTypeData = msgAnalytics?.data?.byType
    ? Object.entries(msgAnalytics.data.byType).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: PIE_COLORS[name] || '#a8a29e',
      }))
    : [];

  const totalByType = byTypeData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-display-md text-ink">Dashboard</h1>
        <p className="text-body text-body-md text-muted">Welcome{user ? `, ${user.name}` : ''}! Here&apos;s your messaging overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.length > 0 ? stats.map((stat, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-surface-strong rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-ink" />
              </div>
              <span className={`flex items-center text-caption ${stat.up ? 'text-success' : 'text-error'}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </span>
            </div>
            <div className="font-display text-display-sm text-ink">{stat.value}</div>
            <div className="text-caption text-muted">{stat.label}</div>
          </div>
        )) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-10 w-24 bg-hairline-soft rounded mb-4" />
              <div className="h-8 w-16 bg-hairline-soft rounded mb-2" />
              <div className="h-4 w-20 bg-hairline-soft rounded" />
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <h2 className="font-title-md text-ink mb-4">Message Trends</h2>
          <div className="h-64">
            {trendsRes?.data && trendsRes.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsRes.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" stroke="#777169" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                  <YAxis stroke="#777169" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sent" stroke="#292524" fill="#292524" fillOpacity={0.15} name="Sent" />
                  <Area type="monotone" dataKey="delivered" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} name="Delivered" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted font-body text-body-md">No data yet</div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-title-md text-ink mb-4">Message Types</h2>
          <div className="h-64">
            {byTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {byTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted font-body text-body-sm">No data yet</div>
            )}
          </div>
          <div className="space-y-2">
            {byTypeData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-body-sm text-body">{item.name}</span>
                </div>
                <span className="text-body-sm font-body-strong">{totalByType > 0 ? Math.round(item.value / totalByType * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title-md text-ink">Recent Campaigns</h2>
            <a href="/dashboard/campaigns" className="text-link text-caption">View all</a>
          </div>
          <div className="space-y-3">
            {campaigns?.data?.slice(0, 3).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-canvas-soft rounded-lg">
                <div>
                  <div className="font-body text-body-strong text-ink">{campaign.name}</div>
                  <div className="text-caption text-muted">{campaign.sentCount} sent</div>
                </div>
                <div className="text-right">
                  <div className="text-caption font-body-strong text-success">{campaign.deliveredCount > 0 ? Math.round(campaign.deliveredCount / campaign.sentCount * 100) : 0}%</div>
                  <div className="text-xs text-muted-soft">{campaign.status}</div>
                </div>
              </div>
            )) || (
              <div className="text-center text-muted font-body text-body-sm py-md">No campaigns yet</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title-md text-ink">Active Chatbots</h2>
            <a href="/dashboard/flows" className="text-link text-caption">View all</a>
          </div>
          <div className="space-y-3">
            {(flows?.data || []).slice(0, 3).map((flow) => (
              <div key={flow.id} className="flex items-center justify-between p-3 bg-canvas-soft rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${flow.isActive ? 'bg-success' : 'bg-muted-soft'}`} />
                  <div>
                    <div className="font-body text-body-strong text-ink">{flow.name}</div>
                    <div className="text-caption text-muted">{flow.triggerType}</div>
                  </div>
                </div>
                <span className={`text-caption-uppercase px-2.5 py-1 rounded-pill ${flow.isActive ? 'bg-surface-strong text-ink' : 'bg-hairline-soft text-muted-soft'}`}>
                  {flow.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            )) || (
              <div className="text-center text-muted font-body text-body-sm py-md">No flows yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}