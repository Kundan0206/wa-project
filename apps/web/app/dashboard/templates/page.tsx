'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Trash2, X, Smartphone } from 'lucide-react';
import { useTemplates, useDeleteTemplate, useCreateTemplate } from '../../../lib/hooks';
import type { Template } from '@wa/shared';

const statusColors: Record<string, string> = {
  approved: 'bg-success/10 text-success',
  pending: 'bg-gradient-peach/20 text-body-strong',
  rejected: 'bg-error/10 text-error',
  paused: 'bg-hairline-soft text-muted'
};

const categoryColors: Record<string, string> = {
  marketing: 'bg-gradient-lavender/20 text-body-strong',
  utility: 'bg-primary/10 text-primary',
  authentication: 'bg-gradient-peach/20 text-body-strong'
};

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

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          <div className="p-md border-b border-hairline flex items-center justify-between">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md p-md">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-hairline rounded-xl p-md animate-pulse">
                  <div className="h-5 w-32 bg-hairline-soft rounded mb-3" />
                  <div className="h-4 w-20 bg-hairline-soft rounded mb-3" />
                  <div className="h-8 w-full bg-hairline-soft rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">No templates found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md p-md">
              {filtered.map((template) => (
                <div key={template.id} className="border border-hairline rounded-xl p-md hover:shadow-soft transition">
                  <div className="flex items-start justify-between mb-sm">
                    <div>
                      <h3 className="font-body text-title-sm text-ink">{template.name}</h3>
                      <div className="flex items-center space-x-sm mt-xs">
                        <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${categoryColors[template.category] || categoryColors.utility}`}>
                          {template.category}
                        </span>
                        <span className="font-body text-caption text-muted-soft">{template.language}</span>
                      </div>
                    </div>
                    <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[template.status] || statusColors.pending}`}>
                      {template.status}
                    </span>
                  </div>

                  <div className="mb-sm">
                    <div className="font-body text-caption text-muted mb-xs">Components</div>
                    <div className="flex flex-wrap gap-xs">
                      {(template.components || []).map((comp: any, i: number) => (
                        <span key={i} className="font-body text-caption bg-hairline-soft text-body px-sm py-xxs rounded">{comp.type}</span>
                      ))}
                    </div>
                  </div>

                  {template.status === 'rejected' && template.rejectionReason && (
                    <div className="font-body text-caption text-error bg-error/10 p-sm rounded mb-sm">
                      {template.rejectionReason}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-body text-caption text-muted">{template.qualityScore ? `${template.qualityScore}/10` : 'N/A'}</span>
                    <div className="flex space-x-xs">
                      <button
                        onClick={() => setViewTemplate(template)}
                        title="View components"
                        className="p-xs hover:bg-hairline-soft rounded-md transition"
                      >
                        <Eye className="w-4 h-4 text-muted" />
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
                  </div>
                </div>
              ))}
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
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">{viewTemplate.name}</h2>
              <button onClick={() => setViewTemplate(null)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="flex items-center space-x-sm mb-md">
              <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${categoryColors[viewTemplate.category] || categoryColors.utility}`}>
                {viewTemplate.category}
              </span>
              <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[viewTemplate.status] || statusColors.pending}`}>
                {viewTemplate.status}
              </span>
              <span className="font-body text-caption text-muted">{viewTemplate.language}</span>
            </div>
            <div className="space-y-sm">
              {(viewTemplate.components || []).map((comp: any, i: number) => (
                <div key={i} className="border border-hairline rounded-lg p-md">
                  <div className="font-body text-caption-uppercase text-muted mb-xs">{comp.type}</div>
                  {comp.text && <p className="font-body text-body-md text-ink whitespace-pre-wrap">{comp.text}</p>}
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
            {viewTemplate.status === 'rejected' && viewTemplate.rejectionReason && (
              <div className="font-body text-caption text-error bg-error/10 p-sm rounded mt-md">
                Rejection reason: {viewTemplate.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}
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
