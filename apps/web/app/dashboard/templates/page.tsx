'use client';

import { useState } from 'react';
import { Plus, Search, Eye, Trash2, X } from 'lucide-react';
import { useTemplates, useDeleteTemplate, useCreateTemplate } from '../../../lib/hooks';

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

const emptyForm = {
  name: '',
  category: 'utility' as 'marketing' | 'utility' | 'authentication',
  language: 'en_US',
  headerText: '',
  bodyText: '',
  footerText: ''
};

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const { data: templatesRes, isLoading } = useTemplates(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const deleteTemplate = useDeleteTemplate();
  const createTemplate = useCreateTemplate();

  const templates = templatesRes?.data || [];

  const filtered = searchTerm
    ? templates.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : templates;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const name = form.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!name) {
      setFormError('Template name is required');
      return;
    }
    if (!form.bodyText.trim()) {
      setFormError('Body text is required');
      return;
    }

    const components: any[] = [];
    if (form.headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: form.headerText.trim() });
    }
    components.push({ type: 'BODY', text: form.bodyText.trim() });
    if (form.footerText.trim()) {
      components.push({ type: 'FOOTER', text: form.footerText.trim() });
    }

    try {
      await createTemplate.mutateAsync({
        name,
        category: form.category,
        language: form.language,
        components
      });
      setShowCreate(false);
      setForm(emptyForm);
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
            onClick={() => { setShowCreate(true); setFormError(''); }}
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
                    <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[template.status] || statusColors.PENDING}`}>
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
                      <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Eye className="w-4 h-4 text-muted" /></button>
                      <button
                        onClick={() => deleteTemplate.mutate(template.id)}
                        className="p-xs hover:bg-hairline-soft rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4 text-muted" />
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
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Create Template</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-md">
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
                    onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
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

              <div>
                <label className="font-body text-caption text-muted mb-xs block">Header (optional)</label>
                <input
                  type="text"
                  value={form.headerText}
                  onChange={(e) => setForm({ ...form, headerText: e.target.value })}
                  placeholder="Order Update"
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
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
                  disabled={createTemplate.isPending}
                  className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                >
                  {createTemplate.isPending ? 'Submitting...' : 'Submit to Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
