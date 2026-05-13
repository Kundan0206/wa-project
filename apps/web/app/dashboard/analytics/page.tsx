'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

const mockData = {
  messages: [
    { date: 'Jan 1', sent: 120, delivered: 115, read: 98 },
    { date: 'Jan 2', sent: 180, delivered: 172, read: 145 },
    { date: 'Jan 3', sent: 150, delivered: 145, read: 120 },
    { date: 'Jan 4', sent: 220, delivered: 210, read: 180 },
    { date: 'Jan 5', sent: 280, delivered: 265, read: 220 },
    { date: 'Jan 6', sent: 90, delivered: 85, read: 70 },
    { date: 'Jan 7', sent: 75, delivered: 70, read: 55 }
  ],
  campaigns: [
    { name: 'Campaign 1', sent: 1200, delivered: 1150, read: 890 },
    { name: 'Campaign 2', sent: 2500, delivered: 2350, read: 1800 },
    { name: 'Campaign 3', sent: 800, delivered: 750, read: 520 }
  ],
  inbox: [
    { day: 'Mon', conversations: 45, resolved: 38 },
    { day: 'Tue', conversations: 52, resolved: 45 },
    { day: 'Wed', conversations: 48, resolved: 42 },
    { day: 'Thu', conversations: 61, resolved: 55 },
    { day: 'Fri', conversations: 55, resolved: 48 },
    { day: 'Sat', conversations: 20, resolved: 18 },
    { day: 'Sun', conversations: 15, resolved: 12 }
  ]
};

const stats = [
  { label: 'Total Sent', value: '8,450', change: '+15%' },
  { label: 'Delivery Rate', value: '97.8%', change: '+2.1%' },
  { label: 'Read Rate', value: '72.3%', change: '+5.2%' },
  { label: 'Failed', value: '0.8%', change: '-0.3%' }
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');

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
              <div className="font-body text-body-sm text-success">{stat.change} vs last period</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-section">
          <div className="bg-surface-card border border-hairline rounded-xl p-lg">
            <h2 className="font-display text-display-sm text-ink mb-md">Message Trends</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData.messages}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="{colors.primary}" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="{colors.primary}" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="{colors.hairline}" />
                  <XAxis dataKey="date" stroke="{colors.muted}" fontSize={12} />
                  <YAxis stroke="{colors.muted}" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sent" stroke="{colors.primary}" fillOpacity={1} fill="url(#colorSent)" name="Sent" />
                  <Area type="monotone" dataKey="delivered" stroke="{colors.success}" fillOpacity={0} name="Delivered" />
                  <Area type="monotone" dataKey="read" stroke="{colors.muted}" fillOpacity={0} name="Read" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-card border border-hairline rounded-xl p-lg">
            <h2 className="font-display text-display-sm text-ink mb-md">Campaign Performance</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.campaigns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="{colors.hairline}" />
                  <XAxis dataKey="name" stroke="{colors.muted}" fontSize={12} />
                  <YAxis stroke="{colors.muted}" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sent" fill="{colors.primary}" name="Sent" />
                  <Bar dataKey="delivered" fill="{colors.success}" name="Delivered" />
                  <Bar dataKey="read" fill="{colors.muted}" name="Read" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-md">Inbox Performance</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData.inbox}>
                <CartesianGrid strokeDasharray="3 3" stroke="{colors.hairline}" />
                <XAxis dataKey="day" stroke="{colors.muted}" fontSize={12} />
                <YAxis stroke="{colors.muted}" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="conversations" stroke="{colors.primary}" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="resolved" stroke="{colors.success}" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}