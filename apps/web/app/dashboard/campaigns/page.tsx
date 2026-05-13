'use client';

import { useState } from 'react';
import { Plus, Search, Play, Pause, MoreVertical, BarChart2 } from 'lucide-react';

const mockCampaigns = [
  { id: '1', name: 'Summer Sale 2024', template: 'summer_promo', contacts: 2500, sent: 2480, delivered: 2420, read: 1980, status: 'completed', date: '2024-01-10' },
  { id: '2', name: 'New Product Launch', template: 'product_launch', contacts: 5000, sent: 5000, delivered: 4850, read: 3200, status: 'completed', date: '2024-01-08' },
  { id: '3', name: 'Flash Sale Weekend', template: 'flash_sale', contacts: 1200, sent: 850, delivered: 780, read: 450, status: 'running', date: '2024-01-12' },
  { id: '4', name: 'Welcome Series', template: 'welcome', contacts: 450, sent: 0, delivered: 0, read: 0, status: 'scheduled', date: '2024-01-15' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-hairline-soft text-muted',
  scheduled: 'bg-gradient-peach/20 text-body-strong',
  running: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  paused: 'bg-muted/10 text-muted',
  failed: 'bg-error/10 text-error'
};

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Campaigns</h1>
            <p className="font-body text-body-md text-muted mt-xs">Send bulk messages to your contacts</p>
          </div>
          <button className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition">
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          <div className="p-md border-b border-hairline flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-sm top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-xl pr-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
            <div className="flex space-x-sm">
              <button className="px-md py-sm border border-hairline rounded-md font-body text-caption text-muted hover:bg-hairline-soft transition">Filter</button>
              <button className="px-md py-sm border border-hairline rounded-md font-body text-caption text-muted hover:bg-hairline-soft transition">Export</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-canvas-soft">
                <tr>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Campaign</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Template</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Contacts</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Sent</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Delivered</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Read</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Date</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {mockCampaigns.map((campaign) => {
                  const deliveryRate = campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : '0';
                  const readRate = campaign.delivered > 0 ? ((campaign.read / campaign.delivered) * 100).toFixed(1) : '0';

                  return (
                    <tr key={campaign.id} className="hover:bg-canvas-soft">
                      <td className="px-md py-sm">
                        <div className="font-body text-body-strong text-ink">{campaign.name}</div>
                      </td>
                      <td className="px-md py-sm font-body text-body-sm text-body">{campaign.template}</td>
                      <td className="px-md py-sm font-body text-body-sm">{campaign.contacts.toLocaleString()}</td>
                      <td className="px-md py-sm font-body text-body-sm">{campaign.sent.toLocaleString()}</td>
                      <td className="px-md py-sm font-body text-body-sm">
                        <div>{campaign.delivered.toLocaleString()}</div>
                        <div className="font-body text-caption text-muted-soft">{deliveryRate}%</div>
                      </td>
                      <td className="px-md py-sm font-body text-body-sm">
                        <div>{campaign.read.toLocaleString()}</div>
                        <div className="font-body text-caption text-muted-soft">{readRate}%</div>
                      </td>
                      <td className="px-md py-sm">
                        <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[campaign.status]}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-md py-sm font-body text-body-sm text-body">{campaign.date}</td>
                      <td className="px-md py-sm">
                        <div className="flex items-center space-x-sm">
                          {campaign.status === 'running' && (
                            <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Pause className="w-4 h-4 text-muted" /></button>
                          )}
                          {campaign.status === 'paused' && (
                            <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Play className="w-4 h-4 text-muted" /></button>
                          )}
                          {campaign.status === 'completed' && (
                            <button className="p-xs hover:bg-hairline-soft rounded-md transition"><BarChart2 className="w-4 h-4 text-muted" /></button>
                          )}
                          <button className="p-xs hover:bg-hairline-soft rounded-md transition"><MoreVertical className="w-4 h-4 text-muted" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}