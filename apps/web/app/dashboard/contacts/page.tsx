'use client';

import { useState } from 'react';
import { Plus, Search, Upload, Download, MoreVertical, Tag, Trash2, Edit } from 'lucide-react';

const mockContacts = [
  { id: '1', name: 'John Doe', phone: '+1 234 567 8901', email: 'john@example.com', tags: ['Customer', 'VIP'], optedIn: true, lastMessage: '2 hours ago' },
  { id: '2', name: 'Sarah Smith', phone: '+1 234 567 8902', email: 'sarah@example.com', tags: ['Lead'], optedIn: true, lastMessage: '1 day ago' },
  { id: '3', name: 'Mike Johnson', phone: '+1 234 567 8903', email: 'mike@example.com', tags: ['Customer'], optedIn: true, lastMessage: '3 days ago' },
  { id: '4', name: 'Emily Brown', phone: '+1 234 567 8904', email: 'emily@example.com', tags: [], optedIn: false, lastMessage: '5 days ago' },
  { id: '5', name: 'David Wilson', phone: '+1 234 567 8905', email: 'david@example.com', tags: ['Lead', 'New'], optedIn: true, lastMessage: '1 week ago' },
];

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Contacts</h1>
            <p className="font-body text-body-md text-muted mt-xs">Manage your customer contacts</p>
          </div>
          <div className="flex space-x-sm">
            <button onClick={() => setShowImport(true)} className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill flex items-center space-x-xs hover:bg-hairline-soft transition">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill flex items-center space-x-xs hover:bg-hairline-soft transition">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition">
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          <div className="p-md border-b border-hairline flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-sm top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-xl pr-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
              />
            </div>
            <div className="flex space-x-sm">
              <button className="px-md py-sm border border-hairline rounded-md font-body text-caption text-muted hover:bg-hairline-soft transition">Filter</button>
              <button className="px-md py-sm border border-hairline rounded-md font-body text-caption text-muted hover:bg-hairline-soft transition">Segments</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-canvas-soft">
                <tr>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Name</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Phone</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Email</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Tags</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Last Message</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {mockContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-canvas-soft">
                    <td className="px-md py-sm">
                      <div className="font-body text-body-strong text-ink">{contact.name}</div>
                    </td>
                    <td className="px-md py-sm font-body text-body-sm text-body">{contact.phone}</td>
                    <td className="px-md py-sm font-body text-body-sm text-body">{contact.email}</td>
                    <td className="px-md py-sm">
                      <div className="flex flex-wrap gap-xs">
                        {contact.tags.map((tag, i) => (
                          <span key={i} className="bg-surface-strong text-ink text-caption-uppercase px-sm py-xxs rounded-pill font-medium">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-md py-sm">
                      <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${contact.optedIn ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {contact.optedIn ? 'Opted In' : 'Opted Out'}
                      </span>
                    </td>
                    <td className="px-md py-sm font-body text-body-sm text-muted">{contact.lastMessage}</td>
                    <td className="px-md py-sm">
                      <div className="flex items-center space-x-xs">
                        <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Tag className="w-4 h-4 text-muted" /></button>
                        <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Edit className="w-4 h-4 text-muted" /></button>
                        <button className="p-xs hover:bg-hairline-soft rounded-md transition"><Trash2 className="w-4 h-4 text-muted" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showImport && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card border border-hairline rounded-xl p-xl w-full max-w-md shadow-soft">
              <h2 className="font-display text-display-sm text-ink mb-md">Import Contacts</h2>
              <div className="border-2 border-dashed border-hairline-strong rounded-lg p-xl text-center mb-md">
                <Upload className="w-12 h-12 text-muted mx-auto mb-sm" />
                <p className="font-body text-body-md text-body">Drag and drop a CSV file here</p>
                <p className="font-body text-caption text-muted">or click to browse</p>
              </div>
              <div className="font-body text-caption text-muted mb-md">
                <p className="font-body text-body-strong">Required columns:</p>
                <p>phone (required), name, email, language, tags</p>
              </div>
              <div className="flex justify-end space-x-sm">
                <button onClick={() => setShowImport(false)} className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill hover:bg-hairline-soft transition">Cancel</button>
                <button className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition">Import</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}