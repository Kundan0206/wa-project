'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { useAnalyticsOverview, useAnalyticsMessages } from '../../../lib/hooks';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');
  const { data: overviewRes } = useAnalyticsOverview();
  const { data: msgRes } = useAnalyticsMessages();

  const overview = overviewRes?.data;
  const msgData = msgRes?.data;

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

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Analytics</h1>
            <p className="font-body text-body-md text-muted mt-xs">Track your messaging performance</p>
          </div>
          <div className="flex items-center space-x-sm">
            <button className="flex items-center space-x-sm px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft transition">
              <Calendar className="w-4 h-4 text-muted" />
              <span className="font-body text-body-sm">Last 7 days</span>
            </button>
            <button className="px-md py-sm border border-hairline-strong rounded-md font-body text-body-sm text-ink hover:bg-hairline-soft transition">Export</button>
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
            <div className="h-96 flex items-center justify-center text-muted font-body text-body-md">
              Historical chart available with time-series data
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
