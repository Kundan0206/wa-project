'use client';

import { useState } from 'react';
import { Plus, Search, Play, Trash2, BarChart2, X } from 'lucide-react';
import {
  useCampaigns, useSendCampaign, useDeleteCampaign, useCreateCampaign,
  useTemplates, usePhoneNumbers, useCampaignAnalytics
} from '../../../lib/hooks';

const statusColors: Record<string, string> = {
  draft: 'bg-hairline-soft text-muted',
  scheduled: 'bg-gradient-peach/20 text-body-strong',
  running: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  paused: 'bg-muted/10 text-muted',
  failed: 'bg-error/10 text-error'
};

const emptyForm = {
  name: '',
  templateId: '',
  phoneNumberId: '',
  audienceType: 'all' as 'all' | 'custom'
};

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [analyticsCampaign, setAnalyticsCampaign] = useState<{ id: string; name: string } | null>(null);
  const { data: campaignsRes, isLoading } = useCampaigns();
  const { data: templatesRes } = useTemplates({ status: 'approved' });
  const { data: phoneRes } = usePhoneNumbers();
  const sendCampaign = useSendCampaign();
  const deleteCampaign = useDeleteCampaign();
  const createCampaign = useCreateCampaign();

  const campaigns = campaignsRes?.data || [];
  const approvedTemplates = templatesRes?.data || [];
  const phoneNumbers = phoneRes?.data || [];

  const filtered = searchTerm
    ? campaigns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : campaigns;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Campaign name is required');
      return;
    }
    if (!form.templateId) {
      setFormError('Select a template');
      return;
    }
    if (!form.phoneNumberId) {
      setFormError('Select a phone number');
      return;
    }

    try {
      await createCampaign.mutateAsync({
        name: form.name.trim(),
        template_id: form.templateId,
        phone_number_id: form.phoneNumberId,
        audience_type: form.audienceType
      });
      setShowCreate(false);
      setForm(emptyForm);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create campaign');
    }
  };

  const handleSend = (id: string, name: string) => {
    if (confirm(`Send "${name}" now? This will message every contact in the audience.`)) {
      sendCampaign.mutate(id);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete campaign "${name}"? This cannot be undone.`)) {
      deleteCampaign.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Campaigns</h1>
            <p className="font-body text-body-md text-muted mt-xs">Send bulk messages to your contacts</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setFormError(''); }}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
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
                              <button
                                onClick={() => handleSend(campaign.id, campaign.name)}
                                title="Send campaign"
                                className="p-xs hover:bg-hairline-soft rounded-md transition"
                              >
                                <Play className="w-4 h-4 text-muted" />
                              </button>
                            )}
                            {(campaign.status === 'completed' || campaign.status === 'running') && (
                              <button
                                onClick={() => setAnalyticsCampaign({ id: campaign.id, name: campaign.name })}
                                title="View analytics"
                                className="p-xs hover:bg-hairline-soft rounded-md transition"
                              >
                                <BarChart2 className="w-4 h-4 text-muted" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(campaign.id, campaign.name)}
                              title="Delete campaign"
                              className="p-xs hover:bg-red-50 rounded-md transition"
                            >
                              <Trash2 className="w-4 h-4 text-muted hover:text-error" />
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

      {showCreate && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Create Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-md">
              <div>
                <label className="font-body text-caption text-muted mb-xs block">Campaign Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Summer Sale Announcement"
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="font-body text-caption text-muted mb-xs block">Template</label>
                <select
                  value={form.templateId}
                  onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                >
                  <option value="">Select an approved template</option>
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {approvedTemplates.length === 0 && (
                  <p className="font-body text-caption text-muted-soft mt-xxs">No approved templates yet. Create one and wait for Meta approval first.</p>
                )}
              </div>

              <div>
                <label className="font-body text-caption text-muted mb-xs block">Send From</label>
                <select
                  value={form.phoneNumberId}
                  onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                >
                  <option value="">Select a phone number</option>
                  {phoneNumbers.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayNumber || p.displayName || p.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-body text-caption text-muted mb-xs block">Audience</label>
                <div className="flex space-x-sm">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, audienceType: 'all' })}
                    className={`flex-1 px-md py-sm rounded-lg font-body text-body-sm border transition ${form.audienceType === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-hairline-strong text-ink hover:bg-hairline-soft'}`}
                  >
                    All opted-in contacts
                  </button>
                </div>
              </div>

              {formError && (
                <p className="font-body text-body-sm text-error">{formError}</p>
              )}

              <div className="flex justify-end space-x-sm pt-md border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCampaign.isPending}
                  className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                >
                  {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {analyticsCampaign && (
        <CampaignAnalyticsModal
          campaignId={analyticsCampaign.id}
          campaignName={analyticsCampaign.name}
          onClose={() => setAnalyticsCampaign(null)}
        />
      )}
    </div>
  );
}

function CampaignAnalyticsModal({ campaignId, campaignName, onClose }: { campaignId: string; campaignName: string; onClose: () => void }) {
  const { data, isLoading } = useCampaignAnalytics(campaignId);
  const analytics = data?.data;

  return (
    <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
      <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-display-sm text-ink">{campaignName}</h2>
          <button onClick={onClose} className="p-xs hover:bg-hairline-soft rounded">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-hairline-soft rounded animate-pulse" />
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 gap-md">
            <div className="p-md bg-canvas-soft rounded-lg">
              <div className="font-body text-caption text-muted">Sent</div>
              <div className="font-display text-display-sm text-ink">{analytics.sent.toLocaleString()}</div>
            </div>
            <div className="p-md bg-canvas-soft rounded-lg">
              <div className="font-body text-caption text-muted">Failed</div>
              <div className="font-display text-display-sm text-error">{analytics.failed.toLocaleString()}</div>
            </div>
            <div className="p-md bg-canvas-soft rounded-lg">
              <div className="font-body text-caption text-muted">Delivered</div>
              <div className="font-display text-display-sm text-ink">{analytics.delivered.toLocaleString()}</div>
              <div className="font-body text-caption text-muted-soft">{analytics.deliveryRate}%</div>
            </div>
            <div className="p-md bg-canvas-soft rounded-lg">
              <div className="font-body text-caption text-muted">Read</div>
              <div className="font-display text-display-sm text-ink">{analytics.read.toLocaleString()}</div>
              <div className="font-body text-caption text-muted-soft">{analytics.readRate}%</div>
            </div>
          </div>
        ) : (
          <p className="font-body text-body-md text-muted text-center py-lg">No analytics available yet</p>
        )}
      </div>
    </div>
  );
}
