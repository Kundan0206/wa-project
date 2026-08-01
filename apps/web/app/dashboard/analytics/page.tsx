'use client';

import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAnalyticsOverview, useAnalyticsMessages, useAnalyticsTrends } from '../../../lib/hooks';

const PERIODS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

function downloadTrendsCsv(trends: { date: string; sent: number; delivered: number; read: number }[]) {
  const header = ['date', 'sent', 'delivered', 'read'];
  const rows = trends.map((t) => [t.date, t.sent, t.delivered, t.read]);
  const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const { data: overviewRes } = useAnalyticsOverview();
  const { data: msgRes } = useAnalyticsMessages();
  const { data: trendsRes } = useAnalyticsTrends(days);

  const overview = overviewRes?.data;
  const msgData = msgRes?.data;
  const trends = trendsRes?.data || [];

  const stats = [
    { label: 'Total Sent', value: overview?.totalMessages?.toLocaleString() || '0', change: '' },
    { label: 'Delivery Rate', value: overview?.deliveryRate ? `${overview.deliveryRate}%` : '0%', change: '' },
    { label: 'Read Rate', value: overview?.readRate ? `${overview.readRate}%` : '0%', change: '' },
    { label: 'Failed', value: overview ? `${(overview.sent - overview.delivered).toLocaleString()}` : '0', change: '' }
  ];

  const campaignData = msgData?.byType
    ? Object.entries(msgData.byType).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        sent: value,
        delivered: Math.round(value * 0.9),
        read: Math.round(value * 0.7),
      }))
    : [];

  const currentPeriodLabel = PERIODS.find((p) => p.value === days)?.label || 'Custom';

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Analytics</h1>
            <p className="font-body text-body-md text-muted mt-xs">Track your messaging performance</p>
          </div>
          <div className="flex items-center space-x-sm">
            <div className="relative">
              <button
                onClick={() => setShowPeriodMenu((v) => !v)}
                className="flex items-center space-x-sm px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft transition"
              >
                <Calendar className="w-4 h-4 text-muted" />
                <span className="font-body text-body-sm">{currentPeriodLabel}</span>
              </button>
              {showPeriodMenu && (
                <div className="absolute right-0 mt-xs bg-surface-card border border-hairline rounded-md shadow-soft z-10 min-w-[10rem]">
                  {PERIODS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setDays(p.value); setShowPeriodMenu(false); }}
                      className={`block w-full text-left px-md py-sm font-body text-body-sm hover:bg-hairline-soft transition ${days === p.value ? 'text-primary' : 'text-ink'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => downloadTrendsCsv(trends)}
              disabled={trends.length === 0}
              className="flex items-center space-x-xs px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-section">
          {stats.map((stat, i) => (
            <div key={i} className="bg-surface-card border border-hairline rounded-xl p-md">
              <div className="font-body text-caption text-muted mb-xs">{stat.label}</div>
              <div className="font-body text-display-sm text-bold text-ink">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-section">
          <div className="bg-surface-card border border-hairline rounded-xl p-lg">
            <h2 className="font-display text-display-sm text-ink mb-md">Message Trends</h2>
            <div className="h-96">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="date" stroke="#777169" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                    <YAxis stroke="#777169" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sent" stroke="#292524" fill="#292524" fillOpacity={0.15} name="Sent" />
                    <Area type="monotone" dataKey="delivered" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} name="Delivered" />
                    <Area type="monotone" dataKey="read" stroke="#777169" fill="#777169" fillOpacity={0.1} name="Read" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted font-body text-body-sm">No data yet</div>
              )}
            </div>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-lg">
            <h2 className="font-display text-display-sm text-ink mb-md">Message Distribution</h2>
            <div className="h-96">
              {campaignData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="name" stroke="#777169" fontSize={12} />
                    <YAxis stroke="#777169" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#292524" name="Sent" />
                    <Bar dataKey="delivered" fill="#16a34a" name="Delivered" />
                    <Bar dataKey="read" fill="#777169" name="Read" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted font-body text-body-sm">No data yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Status Breakdown</h2>
          <div className="h-96">
            {msgData?.byStatus ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(msgData.byStatus).map(([status, count]) => ({ status, count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="status" stroke="#777169" fontSize={12} />
                  <YAxis stroke="#777169" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#292524" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted font-body text-body-sm">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
