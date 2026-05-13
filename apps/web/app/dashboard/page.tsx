'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, Send, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const mockData = {
  messages: [
    { date: 'Mon', sent: 120, delivered: 115, read: 98 },
    { date: 'Tue', sent: 180, delivered: 172, read: 145 },
    { date: 'Wed', sent: 150, delivered: 145, read: 120 },
    { date: 'Thu', sent: 220, delivered: 210, read: 180 },
    { date: 'Fri', sent: 280, delivered: 265, read: 220 },
    { date: 'Sat', sent: 90, delivered: 85, read: 70 },
    { date: 'Sun', sent: 75, delivered: 70, read: 55 }
  ],
  byType: [
    { name: 'Text', value: 65, color: '#292524' },
    { name: 'Template', value: 25, color: '#16a34a' },
    { name: 'Media', value: 10, color: '#a8a29e' }
  ]
};

const stats = [
  { label: 'Total Messages', value: '1,115', change: '+12.5%', up: true, icon: MessageSquare },
  { label: 'Delivered', value: '98.2%', change: '+2.1%', up: true, icon: TrendingUp },
  { label: 'Contacts', value: '2,847', change: '+8.3%', up: true, icon: Users },
  { label: 'Active Conversations', value: '156', change: '-3.2%', up: false, icon: Send }
];

export default function DashboardPage() {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const tenantData = localStorage.getItem('tenant');
    if (tenantData) {
      setTenant(JSON.parse(tenantData));
    }
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-display-md text-ink">Dashboard</h1>
        <p className="text-body text-body-md text-muted">Welcome back! Here's your messaging overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <h2 className="font-title-md text-ink mb-4">Message Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.messages}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#292524" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#292524" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" stroke="#777169" fontSize={12} />
                <YAxis stroke="#777169" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="sent" stroke="#292524" fillOpacity={1} fill="url(#colorSent)" name="Sent" />
                <Area type="monotone" dataKey="delivered" stroke="#16a34a" fillOpacity={0} name="Delivered" />
                <Area type="monotone" dataKey="read" stroke="#777169" fillOpacity={0} name="Read" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="font-title-md text-ink mb-4">Message Types</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockData.byType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {mockData.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {mockData.byType.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-body-sm text-body">{item.name}</span>
                </div>
                <span className="text-body-sm font-body-strong">{item.value}%</span>
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
            {[
              { name: 'Summer Sale', sent: '1,200', delivered: '98%', status: 'completed' },
              { name: 'New Product Launch', sent: '3,500', delivered: '95%', status: 'completed' },
              { name: 'Flash Sale', sent: '800', delivered: '92%', status: 'running' }
            ].map((campaign, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-canvas-soft rounded-lg">
                <div>
                  <div className="font-body text-body-strong text-ink">{campaign.name}</div>
                  <div className="text-caption text-muted">{campaign.sent} sent</div>
                </div>
                <div className="text-right">
                  <div className="text-caption font-body-strong text-success">{campaign.delivered}</div>
                  <div className="text-xs text-muted-soft">{campaign.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title-md text-ink">Active Chatbots</h2>
            <a href="/dashboard/flows" className="text-link text-caption">View all</a>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Support Bot', active: true, sessions: 234 },
              { name: 'Order Status', active: true, sessions: 156 },
              { name: 'Lead Qualification', active: false, sessions: 0 }
            ].map((flow, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-canvas-soft rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${flow.active ? 'bg-success' : 'bg-muted-soft'}`} />
                  <div>
                    <div className="font-body text-body-strong text-ink">{flow.name}</div>
                    <div className="text-caption text-muted">{flow.sessions} sessions</div>
                  </div>
                </div>
                <span className={`text-caption-uppercase px-2.5 py-1 rounded-pill ${flow.active ? 'bg-surface-strong text-ink' : 'bg-hairline-soft text-muted-soft'}`}>
                  {flow.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}