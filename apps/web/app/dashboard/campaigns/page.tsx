'use client';

import { useState } from 'react';
import { Plus, Search, Play, MoreVertical, BarChart2 } from 'lucide-react';
import { useCampaigns, useSendCampaign, useDeleteCampaign } from '../../../lib/hooks';

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
  const { data: campaignsRes, isLoading } = useCampaigns();
  const sendCampaign = useSendCampaign();
  const deleteCampaign = useDeleteCampaign();

  const campaigns = campaignsRes?.data || [];

  const filtered = searchTerm
    ? campaigns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : campaigns;

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
          </div>

          {isLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">No campaigns yet</div>
          ) : (
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
                  {filtered.map((campaign) => {
                    const deliveryRate = campaign.sentCount > 0 ? ((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1) : '0';
                    const readRate = campaign.deliveredCount > 0 ? ((campaign.readCount / campaign.deliveredCount) * 100).toFixed(1) : '0';
                    const templateName = (campaign as any).templates?.name || 'N/A';

                    return (
                      <tr key={campaign.id} className="hover:bg-canvas-soft">
                        <td className="px-md py-sm">
                          <div className="font-body text-body-strong text-ink">{campaign.name}</div>
                        </td>
                        <td className="px-md py-sm font-body text-body-sm text-body">{templateName}</td>
                        <td className="px-md py-sm font-body text-body-sm">{campaign.contactCount.toLocaleString()}</td>
                        <td className="px-md py-sm font-body text-body-sm">{campaign.sentCount.toLocaleString()}</td>
                        <td className="px-md py-sm font-body text-body-sm">
                          <div>{campaign.deliveredCount.toLocaleString()}</div>
                          <div className="font-body text-caption text-muted-soft">{deliveryRate}%</div>
                        </td>
                        <td className="px-md py-sm font-body text-body-sm">
                          <div>{campaign.readCount.toLocaleString()}</div>
                          <div className="font-body text-caption text-muted-soft">{readRate}%</div>
                        </td>
                        <td className="px-md py-sm">
                          <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[campaign.status] || statusColors.draft}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-md py-sm font-body text-body-sm text-body">
                          {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : ''}
                        </td>
                        <td className="px-md py-sm">
                          <div className="flex items-center space-x-sm">
                            {campaign.status === 'draft' && (
                              <button onClick={() => sendCampaign.mutate(campaign.id)} className="p-xs hover:bg-hairline-soft rounded-md transition">
                                <Play className="w-4 h-4 text-muted" />
                              </button>
                            )}
                            {campaign.status === 'completed' && (
                              <button className="p-xs hover:bg-hairline-soft rounded-md transition">
                                <BarChart2 className="w-4 h-4 text-muted" />
                              </button>
                            )}
                            <button onClick={() => deleteCampaign.mutate(campaign.id)} className="p-xs hover:bg-hairline-soft rounded-md transition">
                              <MoreVertical className="w-4 h-4 text-muted" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
