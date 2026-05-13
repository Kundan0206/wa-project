'use client';

import { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

const mockTemplates = [
  { id: '1', name: 'order_shipped', category: 'UTILITY', language: 'en', status: 'APPROVED', components: ['HEADER', 'BODY', 'BUTTONS'], used: 1250 },
  { id: '2', name: 'welcome_message', category: 'MARKETING', language: 'en', status: 'APPROVED', components: ['HEADER', 'BODY'], used: 890 },
  { id: '3', name: 'otp_verification', category: 'AUTHENTICATION', language: 'en', status: 'APPROVED', components: ['BODY'], used: 3200 },
  { id: '4', name: 'flash_sale', category: 'MARKETING', language: 'en', status: 'PENDING', components: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'], used: 0 },
  { id: '5', name: 'product_update', category: 'UTILITY', language: 'en', status: 'REJECTED', components: ['HEADER', 'BODY'], used: 0, reason: 'Contains promotional content in header' },
];

const statusColors: Record<string, string> = {
  APPROVED: 'bg-success/10 text-success',
  PENDING: 'bg-gradient-peach/20 text-body-strong',
  REJECTED: 'bg-error/10 text-error',
  PAUSED: 'bg-hairline-soft text-muted'
};

const categoryColors: Record<string, string> = {
  MARKETING: 'bg-gradient-lavender/20 text-body-strong',
  UTILITY: 'bg-primary/10 text-primary',
  AUTHENTICATION: 'bg-gradient-peach/20 text-body-strong'
};

export default function TemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Templates</h1>
            <p className="font-body text-body-md text-muted mt-xs">Create and manage WhatsApp message templates</p>
          </div>
          <button className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition">
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
              {['all', 'APPROVED', 'PENDING', 'REJECTED'].map((status) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md p-md">
            {mockTemplates.map((template) => (
              <div key={template.id} className="border border-hairline rounded-xl p-md hover:shadow-soft transition">
                <div className="flex items-start justify-between mb-sm">
                  <div>
                    <h3 className="font-body text-title-sm text-ink">{template.name}</h3>
                    <div className="flex items-center space-x-sm mt-xs">
                      <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${categoryColors[template.category]}`}>
                        {template.category}
                      </span>
                      <span className="font-body text-caption text-muted-soft">{template.language}</span>
                    </div>
                  </div>
                  <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${statusColors[template.status]}`}>
                    {template.status}
                  </span>
                </div>

                <div className="mb-sm">
                  <div className="font-body text-caption text-muted mb-xs">Components</div>
                  <div className="flex flex-wrap gap-xs">
                    {template.components.map((comp, i) => (
                      <span key={i} className="font-body text-caption bg-hairline-soft text-body px-sm py-xxs rounded">{comp}</span>
                    ))}
                  </div>
                </div>

                {template.status === 'REJECTED' && template.reason && (
                  <div className="font-body text-caption text-error bg-error/10 p-sm rounded mb-sm">
                    {template.reason}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-body text-caption text-muted">{template.used} sends</span>
                  <div className="flex space-x-xs">
                    <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Eye className="w-4 h-4 text-muted" /></button>
                    <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Edit className="w-4 h-4 text-muted" /></button>
                    <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Trash2 className="w-4 h-4 text-muted" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}