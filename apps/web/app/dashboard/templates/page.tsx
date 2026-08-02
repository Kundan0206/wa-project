'use client';

import { useMemo, useState } from 'react';
import {
  Plus, Search, Eye, Trash2, X, Smartphone, RefreshCw, Copy, Check,
  AlertCircle, BarChart3, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import {
  useTemplates, useDeleteTemplate, useCreateTemplate, useSyncTemplate, useTemplateAnalytics,
  usePhoneNumbers, useSyncTemplatesFromMeta
} from '../../../lib/hooks';
import type { Template } from '@wa/shared';

const statusColors: Record<string, string> = {
  approved: 'bg-success/10 text-success',
  pending: 'bg-gradient-peach/20 text-body-strong',
  rejected: 'bg-error/10 text-error',
  paused: 'bg-hairline-soft text-muted',
  disabled: 'bg-hairline-soft text-muted'
};

const statusIcons: Record<string, any> = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
  paused: AlertCircle,
  disabled: AlertCircle
};

const categoryColors: Record<string, string> = {
  marketing: 'bg-gradient-lavender/20 text-body-strong',
  utility: 'bg-primary/10 text-primary',
  authentication: 'bg-gradient-peach/20 text-body-strong'
};

const qualityStyles: Record<string, { color: string; label: string }> = {
  GREEN: { color: 'bg-success/10 text-success', label: 'High quality' },
  YELLOW: { color: 'bg-gradient-peach/20 text-body-strong', label: 'Medium quality' },
  RED: { color: 'bg-error/10 text-error', label: 'Low quality' },
  UNKNOWN: { color: 'bg-hairline-soft text-muted', label: 'Quality unrated' }
};

// Renders a template's components into the plain-text lines a WhatsApp
// message would actually show, for both the card preview and detail modal -
// avoids showing raw component-type chips with no sense of the real content.
function renderTemplateText(components: any[] = []): { header?: string; body?: string; footer?: string; buttons: any[] } {
  const header = components.find((c) => c.type === 'HEADER');
  const body = components.find((c) => c.type === 'BODY');
  const footer = components.find((c) => c.type === 'FOOTER');
  const buttonsComp = components.find((c) => c.type === 'BUTTONS');

  return {
    header: header?.text,
    body: body?.text || (body?.add_security_recommendation ? 'Your verification code is {{1}}. For your security, do not share this code.' : undefined),
    footer: footer?.text || (footer?.code_expiration_minutes ? `This code expires in ${footer.code_expiration_minutes} minutes.` : undefined),
    buttons: buttonsComp?.buttons || []
  };
}

function CopyableName({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(name);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title="Copy template name"
      className="p-xxs hover:bg-hairline-soft rounded transition"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-soft" />}
    </button>
  );
}

type Category = 'marketing' | 'utility' | 'authentication';
type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';

interface ButtonDraft {
  id: string;
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
  example?: string; // sample value for dynamic URL {{1}} or copy code
}

function newButton(type: ButtonType): ButtonDraft {
  return { id: `btn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type, text: '' };
}

// Matches {{1}}, {{2}}, ... in order of first appearance, de-duplicated.
function extractVariables(text: string): number[] {
  const found = new Set<number>();
  const re = /\{\{\s*(\d+)\s*\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) found.add(parseInt(m[1], 10));
  return Array.from(found).sort((a, b) => a - b);
}

const BUTTON_LABELS: Record<ButtonType, string> = {
  QUICK_REPLY: 'Quick Reply',
  URL: 'Website URL',
  PHONE_NUMBER: 'Call Phone Number',
  COPY_CODE: 'Copy Offer Code',
};

const emptyForm = {
  name: '',
  category: 'utility' as Category,
  language: 'en_US',
  headerText: '',
  headerExample: '',
  bodyText: '',
  bodyExamples: {} as Record<number, string>,
  footerText: '',
  buttons: [] as ButtonDraft[],
  // Authentication-category specific
  addSecurityRecommendation: true,
  codeExpiryMinutes: '',
};

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [viewTemplate, setViewTemplate] = useState<Template | null>(null);
  const { data: templatesRes, isLoading } = useTemplates(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const deleteTemplate = useDeleteTemplate();
  const createTemplate = useCreateTemplate();
  const syncTemplate = useSyncTemplate();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [analyticsTemplate, setAnalyticsTemplate] = useState<Template | null>(null);

  const { data: phoneNumbersRes } = usePhoneNumbers();
  const phoneNumbers = phoneNumbersRes?.data || [];
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const syncFromMeta = useSyncTemplatesFromMeta();
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSyncFromMeta = async () => {
    if (!selectedPhoneId) return;
    setSyncResult(null);
    try {
      const res = await syncFromMeta.mutateAsync(selectedPhoneId);
      const { total, created, updated } = res.data || { total: 0, created: 0, updated: 0 };
      setSyncResult(`Synced ${total} template${total === 1 ? '' : 's'} from Meta — ${created} new, ${updated} updated.`);
    } catch (err: any) {
      setSyncResult(err.message || 'Failed to sync templates from Meta');
    }
  };

  const templates = templatesRes?.data || [];

  const filtered = searchTerm
    ? templates.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : templates;

  const isAuth = form.category === 'authentication';
  const headerVars = useMemo(() => extractVariables(form.headerText), [form.headerText]);
  const bodyVars = useMemo(() => extractVariables(form.bodyText), [form.bodyText]);

  const addButton = (type: ButtonType) => {
    // WhatsApp allows at most one URL and one PHONE_NUMBER button, but
    // multiple QUICK_REPLY buttons (up to 3 total non-quick-reply+quick-reply
    // combined, up to 10 quick replies alone in newer template specs). Keep
    // it simple and correct for the common case: block duplicate URL/PHONE.
    if ((type === 'URL' || type === 'PHONE_NUMBER') && form.buttons.some((b) => b.type === type)) return;
    if (type === 'COPY_CODE' && form.buttons.some((b) => b.type === 'COPY_CODE')) return;
    setForm((f) => ({ ...f, buttons: [...f.buttons, newButton(type)] }));
  };
  const updateButton = (id: string, patch: Partial<ButtonDraft>) => {
    setForm((f) => ({ ...f, buttons: f.buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  };
  const removeButton = (id: string) => {
    setForm((f) => ({ ...f, buttons: f.buttons.filter((b) => b.id !== id) }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const name = form.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!name) {
      setFormError('Template name is required');
      return;
    }

    if (!isAuth && !form.bodyText.trim()) {
      setFormError('Body text is required');
      return;
    }

    // Meta requires a sample value for every {{n}} placeholder used, in both
    // the header and body, so the reviewer can see real-looking content.
    if (headerVars.length > 0 && !form.headerExample.trim()) {
      setFormError('Provide an example value for the header variable');
      return;
    }
    for (const n of bodyVars) {
      if (!form.bodyExamples[n]?.trim()) {
        setFormError(`Provide an example value for body variable {{${n}}}`);
        return;
      }
    }

    if (form.buttons.some((b) => !b.text.trim())) {
      setFormError('Every button needs a label');
      return;
    }
    if (form.buttons.some((b) => b.type === 'URL' && !b.url?.trim())) {
      setFormError('The website button needs a URL');
      return;
    }
    if (form.buttons.some((b) => b.type === 'PHONE_NUMBER' && !b.phoneNumber?.trim())) {
      setFormError('The call button needs a phone number');
      return;
    }

    const components: any[] = [];

    if (isAuth) {
      // Authentication templates use a fixed Meta-generated body ("Your
      // verification code is {{1}}") and can't have custom header/footer
      // text - only an optional security recommendation and code-expiry
      // footer, and an OTP-type button.
      components.push({ type: 'BODY', add_security_recommendation: form.addSecurityRecommendation });
      if (form.codeExpiryMinutes.trim()) {
        components.push({ type: 'FOOTER', code_expiration_minutes: parseInt(form.codeExpiryMinutes, 10) });
      }
      components.push({
        type: 'BUTTONS',
        buttons: [{ type: 'OTP', otp_type: 'COPY_CODE', text: form.buttons[0]?.text || 'Copy Code' }],
      });
    } else {
      if (form.headerText.trim()) {
        const headerComponent: any = { type: 'HEADER', format: 'TEXT', text: form.headerText.trim() };
        if (headerVars.length > 0) {
          headerComponent.example = { header_text: [form.headerExample.trim()] };
        }
        components.push(headerComponent);
      }

      const bodyComponent: any = { type: 'BODY', text: form.bodyText.trim() };
      if (bodyVars.length > 0) {
        bodyComponent.example = { body_text: [bodyVars.map((n) => form.bodyExamples[n]?.trim() || '')] };
      }
      components.push(bodyComponent);

      if (form.footerText.trim()) {
        components.push({ type: 'FOOTER', text: form.footerText.trim() });
      }

      if (form.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: form.buttons.map((b) => {
            if (b.type === 'URL') {
              const btn: any = { type: 'URL', text: b.text.trim(), url: b.url?.trim() };
              if (b.url?.includes('{{1}}') && b.example?.trim()) btn.example = [b.example.trim()];
              return btn;
            }
            if (b.type === 'PHONE_NUMBER') {
              return { type: 'PHONE_NUMBER', text: b.text.trim(), phone_number: b.phoneNumber?.trim() };
            }
            if (b.type === 'COPY_CODE') {
              return { type: 'COPY_CODE', example: b.example?.trim() || 'COUPON123' };
            }
            return { type: 'QUICK_REPLY', text: b.text.trim() };
          }),
        });
      }
    }

    try {
      await createTemplate.mutateAsync({
        name,
        category: form.category,
        language: form.language,
        components
      });
      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create template');
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Templates</h1>
            <p className="font-body text-body-md text-muted mt-xs">Create and manage WhatsApp message templates</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-md mb-lg">
          <div className="flex items-center flex-wrap gap-sm">
            <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-body text-body-sm text-ink flex-shrink-0">Sync templates from Meta for</span>
            <select
              value={selectedPhoneId}
              onChange={(e) => { setSelectedPhoneId(e.target.value); setSyncResult(null); }}
              className="bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm h-9 min-w-[14rem] focus:outline-none focus:border-2 focus:border-primary transition"
            >
              <option value="">Select a connected number...</option>
              {phoneNumbers.map((p) => (
                <option key={p.id} value={p.id}>{p.displayName} &middot; {p.displayNumber}</option>
              ))}
            </select>
            <button
              onClick={handleSyncFromMeta}
              disabled={!selectedPhoneId || syncFromMeta.isPending}
              className="flex items-center gap-xs bg-primary text-on-primary font-body text-button h-9 px-lg rounded-pill hover:bg-primary-active transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncFromMeta.isPending ? 'animate-spin' : ''}`} />
              {syncFromMeta.isPending ? 'Syncing...' : 'Sync All Templates'}
            </button>
            {phoneNumbers.length === 0 && (
              <span className="font-body text-caption text-muted-soft">No connected numbers yet &mdash; connect one on the WhatsApp page first</span>
            )}
          </div>
          {syncResult && (
            <p className={`font-body text-body-sm mt-sm ${syncFromMeta.isError ? 'text-error' : 'text-success'}`}>{syncResult}</p>
          )}
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          <div className="p-md border-b border-hairline flex items-center justify-between flex-wrap gap-sm">
            <div className="relative w-64">
              <Search className="absolute left-sm top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-xl pr-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
            <div className="flex space-x-sm">
                  {['all', 'approved', 'pending', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-md py-xs rounded-lg font-body text-caption-uppercase ${statusFilter === status ? 'bg-primary text-on-primary' : 'border border-hairline-strong text-ink hover:bg-hairline-soft'}`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">
              {searchTerm || statusFilter !== 'all' ? 'No templates match your filters' : 'No templates yet — create one, or sync from Meta if templates already exist there'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-canvas-soft">
                  <tr>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Name</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Preview</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Category</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Language</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Quality</th>
                    <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                    <th className="px-md py-sm text-right font-body text-title-sm text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.map((template) => {
                    const rendered = renderTemplateText(template.components as any[]);
                    const StatusIcon = statusIcons[template.status] || Clock;
                    const quality = qualityStyles[template.qualityScore || ''] || null;
                    const previewLine = [rendered.header, rendered.body].filter(Boolean).join(' — ');

                    return (
                      <tr key={template.id} className="hover:bg-canvas-soft align-top">
                        <td className="px-md py-sm">
                          <div className="flex items-center gap-xxs">
                            <span className="font-body text-body-strong text-ink whitespace-nowrap">{template.name}</span>
                            <CopyableName name={template.name} />
                          </div>
                          {template.status === 'rejected' && template.rejectionReason && (
                            <div className="flex items-start gap-xxs font-body text-caption text-error mt-xxs max-w-xs">
                              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-xxs" />
                              <span className="line-clamp-2">{template.rejectionReason}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-md py-sm max-w-sm">
                          <p className="font-body text-body-sm text-body line-clamp-2">
                            {previewLine || <span className="text-muted-soft italic">No content</span>}
                          </p>
                        </td>
                        <td className="px-md py-sm">
                          <span className={`text-caption-uppercase px-sm py-xxs rounded-pill whitespace-nowrap ${categoryColors[template.category] || categoryColors.utility}`}>
                            {template.category}
                          </span>
                        </td>
                        <td className="px-md py-sm font-body text-body-sm text-muted-soft whitespace-nowrap">{template.language}</td>
                        <td className="px-md py-sm">
                          {quality ? (
                            <span className={`text-caption-uppercase px-sm py-xxs rounded-pill whitespace-nowrap ${quality.color}`} title={quality.label}>
                              {template.qualityScore}
                            </span>
                          ) : (
                            <span className="font-body text-caption text-muted-soft">&mdash;</span>
                          )}
                        </td>
                        <td className="px-md py-sm">
                          <span className={`inline-flex items-center gap-xxs text-caption-uppercase px-sm py-xxs rounded-pill whitespace-nowrap ${statusColors[template.status] || statusColors.pending}`}>
                            <StatusIcon className="w-3 h-3" /> {template.status}
                          </span>
                        </td>
                        <td className="px-md py-sm">
                          <div className="flex items-center justify-end space-x-xxs">
                            <button
                              onClick={() => setViewTemplate(template)}
                              title="View full details"
                              className="p-xs hover:bg-hairline-soft rounded-md transition"
                            >
                              <Eye className="w-4 h-4 text-muted" />
                            </button>
                            <button
                              onClick={() => setAnalyticsTemplate(template)}
                              title="View delivery analytics"
                              className="p-xs hover:bg-hairline-soft rounded-md transition"
                            >
                              <BarChart3 className="w-4 h-4 text-muted" />
                            </button>
                            <button
                              onClick={async () => {
                                setSyncingId(template.id);
                                try {
                                  await syncTemplate.mutateAsync(template.id);
                                } finally {
                                  setSyncingId(null);
                                }
                              }}
                              disabled={syncingId === template.id}
                              title="Re-check status from Meta"
                              className="p-xs hover:bg-hairline-soft rounded-md transition disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 text-muted ${syncingId === template.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete template "${template.name}"? This removes it from Meta permanently.`)) {
                                  deleteTemplate.mutate(template.id);
                                }
                              }}
                              title="Delete template"
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
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50 p-md">
          <div className="bg-surface-card rounded-xl w-full max-w-4xl border border-hairline shadow-soft max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-lg border-b border-hairline flex-shrink-0">
              <h2 className="font-display text-display-sm text-ink">Create Template</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              <form onSubmit={handleCreate} id="template-form" className="flex-1 overflow-y-auto p-lg space-y-lg">
                <div className="space-y-md">
                  <div>
                    <label className="font-body text-caption text-muted mb-xs block">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="order_confirmation"
                      className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                    />
                    <p className="font-body text-caption text-muted-soft mt-xxs">Lowercase letters, numbers, and underscores only</p>
                  </div>

                  <div className="grid grid-cols-2 gap-sm">
                    <div>
                      <label className="font-body text-caption text-muted mb-xs block">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                      >
                        <option value="utility">Utility</option>
                        <option value="marketing">Marketing</option>
                        <option value="authentication">Authentication</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-body text-caption text-muted mb-xs block">Language</label>
                      <select
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                      >
                        <option value="en_US">English (US)</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isAuth ? (
                  <div className="border border-hairline rounded-lg p-md bg-canvas-soft">
                    <p className="font-body text-body-sm text-body mb-md">
                      Authentication templates use Meta&apos;s fixed one-time-passcode wording
                      (&quot;Your verification code is {'{{1}}'}&quot;) &mdash; the body, header, and footer text
                      can&apos;t be customized. You can only add a security note and a code-expiry notice.
                    </p>

                    <label className="flex items-center space-x-sm cursor-pointer mb-md">
                      <input
                        type="checkbox"
                        checked={form.addSecurityRecommendation}
                        onChange={(e) => setForm({ ...form, addSecurityRecommendation: e.target.checked })}
                        className="w-4 h-4 rounded border border-hairline-strong text-primary"
                      />
                      <span className="font-body text-body-sm text-ink">Add &quot;Don&apos;t share this code&quot; security tip</span>
                    </label>

                    <div>
                      <label className="font-body text-caption text-muted mb-xs block">Code expiry (minutes, optional)</label>
                      <input
                        type="number"
                        min={1}
                        value={form.codeExpiryMinutes}
                        onChange={(e) => setForm({ ...form, codeExpiryMinutes: e.target.value })}
                        placeholder="10"
                        className="w-32 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                      />
                    </div>

                    <div className="mt-md">
                      <label className="font-body text-caption text-muted mb-xs block">Copy code button label</label>
                      <input
                        type="text"
                        value={form.buttons[0]?.text || ''}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          buttons: [{ ...(f.buttons[0] || newButton('COPY_CODE')), type: 'COPY_CODE', text: e.target.value }],
                        }))}
                        placeholder="Copy Code"
                        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="font-body text-caption text-muted mb-xs block">Header (optional)</label>
                      <input
                        type="text"
                        value={form.headerText}
                        onChange={(e) => setForm({ ...form, headerText: e.target.value })}
                        placeholder="Order Update"
                        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                      />
                      <p className="font-body text-caption text-muted-soft mt-xxs">
                        Text only for now &mdash; image/video/document headers aren&apos;t supported yet. One variable allowed, e.g. &quot;Hi {'{{1}}'}&quot;.
                      </p>
                      {headerVars.length > 0 && (
                        <div className="mt-sm">
                          <label className="font-body text-caption text-muted mb-xxs block">Example value for header {'{{1}}'}</label>
                          <input
                            type="text"
                            value={form.headerExample}
                            onChange={(e) => setForm({ ...form, headerExample: e.target.value })}
                            placeholder="Priya"
                            className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-body text-caption text-muted mb-xs block">Body</label>
                      <textarea
                        value={form.bodyText}
                        onChange={(e) => setForm({ ...form, bodyText: e.target.value })}
                        rows={4}
                        placeholder="Hi {{1}}, your order #{{2}} has shipped!"
                        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm focus:outline-none focus:border-2 focus:border-primary transition resize-y"
                      />
                      <p className="font-body text-caption text-muted-soft mt-xxs">Use {'{{1}}'}, {'{{2}}'}, etc. for variables</p>
                      {bodyVars.length > 0 && (
                        <div className="mt-sm space-y-xs">
                          <label className="font-body text-caption text-muted block">Example values (required for review)</label>
                          {bodyVars.map((n) => (
                            <input
                              key={n}
                              type="text"
                              value={form.bodyExamples[n] || ''}
                              onChange={(e) => setForm((f) => ({ ...f, bodyExamples: { ...f.bodyExamples, [n]: e.target.value } }))}
                              placeholder={`Example for {{${n}}}`}
                              className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-body text-caption text-muted mb-xs block">Footer (optional)</label>
                      <input
                        type="text"
                        value={form.footerText}
                        onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                        placeholder="Thank you for your business"
                        className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-sm">
                        <label className="font-body text-caption text-muted">Buttons (optional, up to 3)</label>
                        <div className="flex space-x-xs">
                          {(['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'COPY_CODE'] as ButtonType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => addButton(type)}
                              disabled={form.buttons.length >= 3}
                              className="px-sm py-xxs border border-hairline-strong rounded-md font-body text-caption text-ink hover:bg-hairline-soft transition disabled:opacity-40"
                            >
                              + {BUTTON_LABELS[type]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.buttons.length > 0 && (
                        <div className="space-y-sm">
                          {form.buttons.map((btn) => (
                            <div key={btn.id} className="border border-hairline rounded-lg p-sm">
                              <div className="flex items-center justify-between mb-xs">
                                <span className="font-body text-caption-uppercase text-muted">{BUTTON_LABELS[btn.type]}</span>
                                <button type="button" onClick={() => removeButton(btn.id)}>
                                  <X className="w-4 h-4 text-muted hover:text-error" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={btn.text}
                                onChange={(e) => updateButton(btn.id, { text: e.target.value })}
                                placeholder="Button label"
                                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition mb-xs"
                              />
                              {btn.type === 'URL' && (
                                <>
                                  <input
                                    type="text"
                                    value={btn.url || ''}
                                    onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                                    placeholder="https://example.com/orders/{{1}}"
                                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                                  />
                                  {btn.url?.includes('{{1}}') && (
                                    <input
                                      type="text"
                                      value={btn.example || ''}
                                      onChange={(e) => updateButton(btn.id, { example: e.target.value })}
                                      placeholder="Example value for {{1}} in the URL"
                                      className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition mt-xs"
                                    />
                                  )}
                                </>
                              )}
                              {btn.type === 'PHONE_NUMBER' && (
                                <input
                                  type="text"
                                  value={btn.phoneNumber || ''}
                                  onChange={(e) => updateButton(btn.id, { phoneNumber: e.target.value })}
                                  placeholder="+15551234567"
                                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                                />
                              )}
                              {btn.type === 'COPY_CODE' && (
                                <input
                                  type="text"
                                  value={btn.example || ''}
                                  onChange={(e) => updateButton(btn.id, { example: e.target.value })}
                                  placeholder="Example code, e.g. SAVE20"
                                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {formError && (
                  <p className="font-body text-body-sm text-error">{formError}</p>
                )}
              </form>

              <div className="w-72 flex-shrink-0 border-l border-hairline bg-canvas-soft p-lg overflow-y-auto hidden md:block">
                <div className="flex items-center space-x-xs mb-md">
                  <Smartphone className="w-4 h-4 text-muted" />
                  <span className="font-body text-caption-uppercase text-muted">Preview</span>
                </div>
                <TemplatePreview form={form} isAuth={isAuth} />
              </div>
            </div>

            <div className="flex justify-end space-x-sm p-lg border-t border-hairline flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="template-form"
                disabled={createTemplate.isPending}
                className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
              >
                {createTemplate.isPending ? 'Submitting...' : 'Submit to Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewTemplate && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50 p-md">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-xxs min-w-0">
                <h2 className="font-display text-display-sm text-ink truncate">{viewTemplate.name}</h2>
                <CopyableName name={viewTemplate.name} />
              </div>
              <button onClick={() => setViewTemplate(null)} className="p-xs hover:bg-hairline-soft rounded flex-shrink-0">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="flex items-center flex-wrap gap-sm mb-md">
              <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${categoryColors[viewTemplate.category] || categoryColors.utility}`}>
                {viewTemplate.category}
              </span>
              <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[viewTemplate.status] || statusColors.pending}`}>
                {viewTemplate.status}
              </span>
              {viewTemplate.qualityScore && qualityStyles[viewTemplate.qualityScore] && (
                <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${qualityStyles[viewTemplate.qualityScore].color}`}>
                  {qualityStyles[viewTemplate.qualityScore].label}
                </span>
              )}
              <span className="font-body text-caption text-muted">{viewTemplate.language}</span>
            </div>

            {viewTemplate.status === 'rejected' && viewTemplate.rejectionReason && (
              <div className="flex items-start gap-xs font-body text-body-sm text-error bg-error/10 p-md rounded-lg mb-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-xxs" />
                <div>
                  <p className="text-body-strong mb-xxs">Rejected by Meta</p>
                  <p>{viewTemplate.rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="bg-[#e5ddd5] rounded-lg p-md mb-md">
              <div className="bg-white rounded-md shadow-sm p-md">
                {(() => {
                  const rendered = renderTemplateText(viewTemplate.components as any[]);
                  return (
                    <>
                      {rendered.header && <p className="font-body text-body-strong text-ink mb-xs">{rendered.header}</p>}
                      <p className="font-body text-body-sm text-ink whitespace-pre-wrap mb-xs">{rendered.body}</p>
                      {rendered.footer && <p className="font-body text-caption text-muted-soft">{rendered.footer}</p>}
                      {rendered.buttons.length > 0 && (
                        <div className="border-t border-hairline-soft mt-sm pt-xs space-y-xxs">
                          {rendered.buttons.map((btn: any, i: number) => (
                            <div key={i} className="font-body text-body-sm text-primary text-center py-xs">
                              {btn.type === 'URL' && '🔗 '}
                              {btn.type === 'PHONE_NUMBER' && '📞 '}
                              {(btn.type === 'COPY_CODE' || btn.type === 'OTP') && '📋 '}
                              {btn.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-sm">
              <div className="font-body text-caption-uppercase text-muted">Raw components</div>
              {(viewTemplate.components || []).map((comp: any, i: number) => (
                <div key={i} className="border border-hairline rounded-lg p-md">
                  <div className="font-body text-caption-uppercase text-muted mb-xs">{comp.type}</div>
                  {comp.text && <p className="font-body text-body-sm text-ink whitespace-pre-wrap">{comp.text}</p>}
                  {comp.type === 'BODY' && comp.add_security_recommendation && (
                    <p className="font-body text-body-sm text-muted mt-xs">Includes security recommendation</p>
                  )}
                  {comp.type === 'FOOTER' && comp.code_expiration_minutes && (
                    <p className="font-body text-body-sm text-muted">Expires in {comp.code_expiration_minutes} minutes</p>
                  )}
                  {comp.buttons && (
                    <div className="flex flex-wrap gap-xs mt-xs">
                      {comp.buttons.map((btn: any, bi: number) => (
                        <span key={bi} className="font-body text-caption bg-hairline-soft text-body px-sm py-xxs rounded">
                          {btn.text} {btn.type === 'URL' && '(link)'} {btn.type === 'PHONE_NUMBER' && '(call)'} {btn.type === 'COPY_CODE' && '(copy code)'} {btn.type === 'OTP' && '(OTP)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-xs mt-lg pt-md border-t border-hairline">
              <button
                onClick={async () => {
                  setSyncingId(viewTemplate.id);
                  try {
                    const res = await syncTemplate.mutateAsync(viewTemplate.id);
                    if (res.data) setViewTemplate(res.data);
                  } finally {
                    setSyncingId(null);
                  }
                }}
                disabled={syncingId === viewTemplate.id}
                className="flex items-center gap-xs px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncingId === viewTemplate.id ? 'animate-spin' : ''}`} />
                {syncingId === viewTemplate.id ? 'Syncing...' : 'Re-check status from Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {analyticsTemplate && (
        <TemplateAnalyticsModal template={analyticsTemplate} onClose={() => setAnalyticsTemplate(null)} />
      )}
    </div>
  );
}

function TemplateAnalyticsModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const { data, isLoading } = useTemplateAnalytics(template.id);
  const analytics = data?.data;

  return (
    <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50 p-md">
      <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-display-sm text-ink">{template.name} &mdash; Analytics</h2>
          <button onClick={onClose} className="p-xs hover:bg-hairline-soft rounded">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>
        {isLoading ? (
          <div className="space-y-sm">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-hairline-soft rounded animate-pulse" />
            ))}
          </div>
        ) : !analytics ? (
          <p className="font-body text-body-md text-muted text-center py-lg">No analytics available yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-sm">
            <div className="border border-hairline rounded-lg p-md">
              <p className="font-body text-caption-uppercase text-muted mb-xxs">Sent</p>
              <p className="font-display text-display-sm text-ink">{analytics.sent}</p>
            </div>
            <div className="border border-hairline rounded-lg p-md">
              <p className="font-body text-caption-uppercase text-muted mb-xxs">Delivered</p>
              <p className="font-display text-display-sm text-ink">{analytics.delivered}</p>
              <p className="font-body text-caption text-muted-soft">{analytics.deliveryRate}%</p>
            </div>
            <div className="border border-hairline rounded-lg p-md">
              <p className="font-body text-caption-uppercase text-muted mb-xxs">Read</p>
              <p className="font-display text-display-sm text-ink">{analytics.read}</p>
              <p className="font-body text-caption text-muted-soft">{analytics.readRate}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function fillVariables(text: string, examples: Record<number, string>): string {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => examples[parseInt(n, 10)] || `{{${n}}}`);
}

function TemplatePreview({ form, isAuth }: { form: typeof emptyForm; isAuth: boolean }) {
  const headerPreview = form.headerText
    ? fillVariables(form.headerText, { 1: form.headerExample })
    : '';

  return (
    <div className="bg-[#e5ddd5] rounded-xl p-md">
      <div className="bg-white rounded-lg shadow-sm p-md max-w-full">
        {isAuth ? (
          <>
            <p className="font-body text-body-sm text-ink mb-xs">
              *123456* is your verification code. For your security, do not share this code.
            </p>
            {form.codeExpiryMinutes && (
              <p className="font-body text-caption text-muted mb-sm">This code expires in {form.codeExpiryMinutes} minutes.</p>
            )}
            <div className="border-t border-hairline-soft pt-xs mt-xs">
              <div className="font-body text-body-sm text-primary text-center py-xs">
                📋 {form.buttons[0]?.text || 'Copy Code'}
              </div>
            </div>
          </>
        ) : (
          <>
            {form.headerText && (
              <p className="font-body text-body-strong text-ink mb-xs">{headerPreview || form.headerText}</p>
            )}
            <p className="font-body text-body-sm text-ink whitespace-pre-wrap mb-xs">
              {form.bodyText ? fillVariables(form.bodyText, form.bodyExamples) : (
                <span className="text-muted-soft italic">Body text will appear here</span>
              )}
            </p>
            {form.footerText && (
              <p className="font-body text-caption text-muted-soft">{form.footerText}</p>
            )}
            {form.buttons.length > 0 && (
              <div className="border-t border-hairline-soft mt-sm pt-xs space-y-xxs">
                {form.buttons.map((btn) => (
                  <div key={btn.id} className="font-body text-body-sm text-primary text-center py-xs">
                    {btn.type === 'URL' && '🔗 '}
                    {btn.type === 'PHONE_NUMBER' && '📞 '}
                    {btn.type === 'COPY_CODE' && '📋 '}
                    {btn.text || '(button label)'}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
