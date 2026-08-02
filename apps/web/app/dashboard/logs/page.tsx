'use client';

import { useState } from 'react';
import { Plus, Trash2, Send, X, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import {
  useWebhooks, useCreateWebhook, useDeleteWebhook, useTestWebhook, useWebhookLogs,
  useMetaEventLogs, MetaEventLog
} from '../../../lib/hooks';

const EVENT_OPTIONS = [
  'message.received',
  'message.sent',
  'message.delivered',
  'message.read',
  'message.failed'
];

const META_EVENT_TYPES = [
  { value: '', label: 'All events' },
  { value: 'message_received', label: 'Message received' },
  { value: 'message_sent', label: 'Message sent' },
  { value: 'message_delivered', label: 'Message delivered' },
  { value: 'message_read', label: 'Message read' },
  { value: 'message_failed', label: 'Message failed' },
  { value: 'message_template_status_update', label: 'Template status update' },
  { value: 'message_template_quality_update', label: 'Template quality update' },
  { value: 'phone_number_quality_update', label: 'Phone number quality update' },
  { value: 'account_update', label: 'Account update' },
  { value: 'account_alerts', label: 'Account alerts' },
  { value: 'security', label: 'Security' }
];

function metaEventBadgeStyle(eventType: string): string {
  if (eventType.includes('failed') || eventType === 'security') return 'bg-error/10 text-error';
  if (eventType.includes('template_status')) return 'bg-primary/10 text-primary';
  if (eventType.includes('quality')) return 'bg-warning/10 text-warning';
  if (eventType.includes('delivered') || eventType.includes('read') || eventType === 'message_received') return 'bg-success/10 text-success';
  return 'bg-hairline-soft text-body';
}

function metaEventLabel(eventType: string): string {
  const match = META_EVENT_TYPES.find((e) => e.value === eventType);
  return match ? match.label : eventType.replace(/_/g, ' ');
}

function MetaEventRow({ log }: { log: MetaEventLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-canvas-soft cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <td className="px-md py-sm">
          <span className={`inline-flex items-center text-caption-uppercase px-sm py-xxs rounded-pill ${metaEventBadgeStyle(log.eventType)}`}>
            {metaEventLabel(log.eventType)}
          </span>
        </td>
        <td className="px-md py-sm font-body text-body-sm text-body truncate max-w-xs">{log.entityId || '—'}</td>
        <td className="px-md py-sm font-body text-body-sm text-body truncate max-w-[10rem]">{log.phoneNumberId || '—'}</td>
        <td className="px-md py-sm">
          {log.status === 'error' ? (
            <span className="inline-flex items-center gap-xxs text-caption-uppercase px-sm py-xxs rounded-pill bg-error/10 text-error">
              <XCircle className="w-3 h-3" /> Error
            </span>
          ) : (
            <span className="inline-flex items-center gap-xxs text-caption-uppercase px-sm py-xxs rounded-pill bg-success/10 text-success">
              <CheckCircle className="w-3 h-3" /> Processed
            </span>
          )}
        </td>
        <td className="px-md py-sm font-body text-body-sm text-body">
          {new Date(log.receivedAt).toLocaleString()}
        </td>
        <td className="px-md py-sm">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-canvas-soft">
          <td colSpan={6} className="px-md py-md">
            {log.errorMessage && (
              <p className="font-body text-body-sm text-error mb-sm">{log.errorMessage}</p>
            )}
            <pre className="font-mono text-caption text-body bg-surface-card border border-hairline rounded-md p-md overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: number | null }) {
  if (status === null) {
    return (
      <span className="inline-flex items-center gap-xxs text-caption-uppercase px-sm py-xxs rounded-pill bg-hairline-soft text-muted">
        <Clock className="w-3 h-3" /> No response
      </span>
    );
  }
  if (status >= 200 && status < 300) {
    return (
      <span className="inline-flex items-center gap-xxs text-caption-uppercase px-sm py-xxs rounded-pill bg-success/10 text-success">
        <CheckCircle className="w-3 h-3" /> {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-xxs text-caption-uppercase px-sm py-xxs rounded-pill bg-error/10 text-error">
      <XCircle className="w-3 h-3" /> {status}
    </span>
  );
}

export default function LogsPage() {
  const [tab, setTab] = useState<'meta' | 'webhooks'>('meta');
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['message.received']);
  const [formError, setFormError] = useState('');
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [metaEventFilter, setMetaEventFilter] = useState('');

  const { data: webhooksRes, isLoading: webhooksLoading } = useWebhooks();
  const { data: logsRes, isLoading: logsLoading } = useWebhookLogs();
  const { data: metaEventsRes, isLoading: metaEventsLoading } = useMetaEventLogs({
    eventType: metaEventFilter || undefined,
    limit: '50'
  });
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const webhooks = webhooksRes?.data || [];
  const logs = logsRes?.data || [];
  const metaEvents = metaEventsRes?.data || [];

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!url.trim()) {
      setFormError('Webhook URL is required');
      return;
    }
    if (selectedEvents.length === 0) {
      setFormError('Select at least one event');
      return;
    }

    try {
      const res = await createWebhook.mutateAsync({ url: url.trim(), events: selectedEvents });
      setNewSecret(res.data?.secret || null);
      setUrl('');
      setSelectedEvents(['message.received']);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create webhook');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this webhook? Delivery will stop immediately.')) {
      deleteWebhook.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Logs</h1>
            <p className="font-body text-body-md text-muted mt-xs">
              Every event Meta sends us, plus outbound webhook deliveries to your endpoints
            </p>
          </div>
          {tab === 'webhooks' && (
            <button
              onClick={() => { setShowCreate(true); setFormError(''); setNewSecret(null); }}
              className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Webhook</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-xs mb-lg border-b border-hairline">
          <button
            onClick={() => setTab('meta')}
            className={`px-md py-sm font-body text-button border-b-2 transition ${tab === 'meta' ? 'border-primary text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            Meta Event Logs
          </button>
          <button
            onClick={() => setTab('webhooks')}
            className={`px-md py-sm font-body text-button border-b-2 transition ${tab === 'webhooks' ? 'border-primary text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            Webhooks & Delivery Logs
          </button>
        </div>

        {tab === 'meta' && (
          <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
            <div className="p-md border-b border-hairline flex items-center justify-between flex-wrap gap-sm">
              <div>
                <h2 className="font-display text-display-sm text-ink flex items-center gap-xs">
                  <Activity className="w-4 h-4 text-primary" /> Meta Event Logs
                </h2>
                <p className="font-body text-body-sm text-muted mt-xxs">
                  Message delivery status, template status/quality updates, phone number quality updates, and every other event Meta delivers to your webhook &mdash; auto-refreshes every 15s
                </p>
              </div>
              <select
                value={metaEventFilter}
                onChange={(e) => setMetaEventFilter(e.target.value)}
                className="bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm h-9 focus:outline-none focus:border-2 focus:border-primary transition"
              >
                {META_EVENT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {metaEventsLoading ? (
              <div className="p-md space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-hairline-soft rounded animate-pulse" />
                ))}
              </div>
            ) : metaEvents.length === 0 ? (
              <div className="text-center py-lg text-muted font-body text-body-md">
                No Meta events recorded yet. Once your WhatsApp number is connected and subscribed, incoming messages, delivery statuses, and template/quality updates will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-canvas-soft">
                    <tr>
                      <th className="px-md py-sm text-left font-body text-title-sm text-muted">Event</th>
                      <th className="px-md py-sm text-left font-body text-title-sm text-muted">Entity</th>
                      <th className="px-md py-sm text-left font-body text-title-sm text-muted">Phone Number ID</th>
                      <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                      <th className="px-md py-sm text-left font-body text-title-sm text-muted">Received</th>
                      <th className="px-md py-sm"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {metaEvents.map((log) => (
                      <MetaEventRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'webhooks' && (
        <>
        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden mb-lg">
          <div className="p-md border-b border-hairline">
            <h2 className="font-display text-display-sm text-ink">Webhook Endpoints</h2>
          </div>
          {webhooksLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">
              No webhooks configured. Add one to receive real-time events.
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {webhooks.map((w) => (
                <div key={w.id} className="px-md py-sm flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-body text-body-strong text-ink truncate">{w.url}</p>
                    <div className="flex flex-wrap gap-xs mt-xs">
                      {w.events.map((ev) => (
                        <span key={ev} className="font-body text-caption bg-hairline-soft text-body px-sm py-xxs rounded">{ev}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-xs flex-shrink-0 ml-md">
                    <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${w.isActive ? 'bg-success/10 text-success' : 'bg-hairline-soft text-muted'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => testWebhook.mutate(w.id)}
                      disabled={testWebhook.isPending}
                      title="Send test event"
                      className="p-xs hover:bg-hairline-soft rounded-md transition disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-muted" />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      title="Delete webhook"
                      className="p-xs hover:bg-red-50 rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4 text-muted hover:text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          <div className="p-md border-b border-hairline">
            <h2 className="font-display text-display-sm text-ink">Delivery Logs</h2>
          </div>
          {logsLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">
              No webhook deliveries yet. Trigger a test event or wait for real activity.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-canvas-soft">
                  <tr>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Event</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Webhook</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Attempts</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-soft">
                      <td className="px-md py-sm font-body text-body-sm text-ink">{log.eventType}</td>
                      <td className="px-md py-sm font-body text-body-sm text-body truncate max-w-xs">{log.webhookUrl || log.webhookId}</td>
                      <td className="px-md py-sm"><StatusBadge status={log.responseStatus} /></td>
                      <td className="px-md py-sm font-body text-body-sm text-body">{log.attemptCount}</td>
                      <td className="px-md py-sm font-body text-body-sm text-body">
                        {new Date(log.attemptedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Add Webhook</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {newSecret ? (
              <div>
                <div className="mb-md p-md bg-success/10 border border-success/20 rounded-lg">
                  <p className="font-body text-body-md text-success mb-xs">Webhook created successfully!</p>
                  <p className="font-body text-body-sm text-muted">
                    Save this signing secret now &mdash; it won&apos;t be shown again. Use it to verify the
                    <code className="mx-xxs px-xs py-xxs bg-hairline-soft rounded">X-Webhook-Signature</code>
                    header on incoming deliveries.
                  </p>
                </div>
                <code className="block w-full bg-canvas-soft border border-hairline rounded-md p-md font-body text-body-sm text-ink break-all mb-md">
                  {newSecret}
                </code>
                <div className="flex justify-end">
                  <button
                    onClick={() => { setShowCreate(false); setNewSecret(null); }}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-md">
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Endpoint URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/webhooks/whatsapp"
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Events</label>
                  <div className="space-y-xs">
                    {EVENT_OPTIONS.map((ev) => (
                      <label key={ev} className="flex items-center space-x-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(ev)}
                          onChange={() => toggleEvent(ev)}
                          className="w-4 h-4 rounded border border-hairline-strong text-primary"
                        />
                        <span className="font-body text-body-sm text-ink">{ev}</span>
                      </label>
                    ))}
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
                    disabled={createWebhook.isPending}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                  >
                    {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
