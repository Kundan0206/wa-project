'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Upload, Download, Trash2, Edit, X, Users } from 'lucide-react';
import {
  useContacts, useDeleteContact, useCreateContact, useImportContacts, useUpdateContact
} from '../../../lib/hooks';
import type { Contact } from '@wa/shared';

function parseCsv(text: string): { phone: string; name?: string; email?: string }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const phoneIdx = header.indexOf('phone');
  const nameIdx = header.indexOf('name');
  const emailIdx = header.indexOf('email');

  if (phoneIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      phone: cols[phoneIdx] || '',
      name: nameIdx >= 0 ? cols[nameIdx] : undefined,
      email: emailIdx >= 0 ? cols[emailIdx] : undefined,
    };
  }).filter((c) => c.phone);
}

function downloadCsv(contacts: Contact[]) {
  const header = ['phone', 'name', 'email', 'opted_in'];
  const rows = contacts.map((c) => [c.phone, c.name || '', c.email || '', c.optedIn ? 'true' : 'false']);
  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const emptyAddForm = { phone: '', name: '', email: '', optedIn: true };

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addError, setAddError] = useState('');
  const [importPreview, setImportPreview] = useState<{ phone: string; name?: string; email?: string }[]>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contactsRes, isLoading } = useContacts(searchTerm ? { search: searchTerm } : undefined);
  const deleteContact = useDeleteContact();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const importContacts = useImportContacts();

  const contacts = contactsRes?.data || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result));
      if (parsed.length === 0) {
        setImportError('No valid rows found. Make sure the CSV has a "phone" column.');
        return;
      }
      setImportPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    try {
      const res = await importContacts.mutateAsync(importPreview);
      setImportError('');
      setImportPreview([]);
      setShowImport(false);
      alert(`Imported ${res.data?.imported ?? 0} new contacts`);
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addForm.phone.trim()) {
      setAddError('Phone number is required');
      return;
    }

    try {
      await createContact.mutateAsync({
        phone: addForm.phone.trim(),
        name: addForm.name.trim() || undefined,
        email: addForm.email.trim() || undefined,
        opted_in: addForm.optedIn,
      });
      setShowAdd(false);
      setAddForm(emptyAddForm);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add contact');
    }
  };

  const openEdit = (contact: Contact) => {
    setEditContact(contact);
    setEditForm({ name: contact.name || '', email: contact.email || '' });
  };

  const handleEditSave = async () => {
    if (!editContact) return;
    await updateContact.mutateAsync({ id: editContact.id, name: editForm.name, email: editForm.email });
    setEditContact(null);
  };

  const handleDelete = (id: string, label: string) => {
    if (confirm(`Delete contact "${label}"? This cannot be undone.`)) {
      deleteContact.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Contacts</h1>
            <p className="font-body text-body-md text-muted mt-xs">Manage your customer contacts</p>
          </div>
          <div className="flex space-x-sm">
            <button
              onClick={() => { setShowImport(true); setImportError(''); setImportPreview([]); }}
              className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill flex items-center space-x-xs hover:bg-hairline-soft transition"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={() => downloadCsv(contacts)}
              disabled={contacts.length === 0}
              className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill flex items-center space-x-xs hover:bg-hairline-soft transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => { setShowAdd(true); setAddError(''); }}
              className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
            >
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
              <Link
                href="/dashboard/segments"
                className="px-md py-sm border border-hairline rounded-md font-body text-caption text-muted hover:bg-hairline-soft transition flex items-center gap-xs"
              >
                <Users className="w-3.5 h-3.5" />
                Segments
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">No contacts found</div>
          ) : (
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
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-canvas-soft">
                      <td className="px-md py-sm">
                        <div className="font-body text-body-strong text-ink">{contact.name || 'Unknown'}</div>
                      </td>
                      <td className="px-md py-sm font-body text-body-sm text-body">{contact.phone}</td>
                      <td className="px-md py-sm font-body text-body-sm text-body">{contact.email || '-'}</td>
                      <td className="px-md py-sm">
                        <div className="flex flex-wrap gap-xs">
                          {(contact.tags || []).slice(0, 2).map((tag, i) => (
                            <span key={i} className="bg-surface-strong text-ink text-caption-uppercase px-sm py-xxs rounded-pill font-medium">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-md py-sm">
                        <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${contact.optedIn ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {contact.optedIn ? 'Opted In' : 'Opted Out'}
                        </span>
                      </td>
                      <td className="px-md py-sm font-body text-body-sm text-muted">
                        {contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-md py-sm">
                        <div className="flex items-center space-x-xs">
                          <button onClick={() => openEdit(contact)} title="Edit contact" className="p-xs hover:bg-hairline-soft rounded-md transition">
                            <Edit className="w-4 h-4 text-muted" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id, contact.name || contact.phone)}
                            title="Delete contact"
                            className="p-xs hover:bg-red-50 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4 text-muted hover:text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showImport && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card border border-hairline rounded-xl p-xl w-full max-w-md shadow-soft">
              <h2 className="font-display text-display-sm text-ink mb-md">Import Contacts</h2>

              {importPreview.length === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-hairline-strong rounded-lg p-xl text-center mb-md hover:bg-hairline-soft transition"
                  >
                    <Upload className="w-12 h-12 text-muted mx-auto mb-sm" />
                    <p className="font-body text-body-md text-body">Click to choose a CSV file</p>
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileSelect} className="hidden" />
                  <div className="font-body text-caption text-muted mb-md">
                    <p className="font-body text-body-strong">Required columns:</p>
                    <p>phone (required), name, email</p>
                  </div>
                  {importError && <p className="font-body text-body-sm text-error mb-md">{importError}</p>}
                  <div className="flex justify-end space-x-sm">
                    <button onClick={() => setShowImport(false)} className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill hover:bg-hairline-soft transition">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body text-body-sm text-muted mb-md">
                    Found {importPreview.length} contact{importPreview.length === 1 ? '' : 's'} to import.
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-hairline rounded-md mb-md">
                    {importPreview.slice(0, 20).map((c, i) => (
                      <div key={i} className="px-sm py-xs text-caption font-body text-body border-b border-hairline last:border-0">
                        {c.phone} {c.name ? `- ${c.name}` : ''}
                      </div>
                    ))}
                    {importPreview.length > 20 && (
                      <div className="px-sm py-xs text-caption font-body text-muted-soft">
                        + {importPreview.length - 20} more
                      </div>
                    )}
                  </div>
                  {importError && <p className="font-body text-body-sm text-error mb-md">{importError}</p>}
                  <div className="flex justify-end space-x-sm">
                    <button onClick={() => setImportPreview([])} className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill hover:bg-hairline-soft transition">Back</button>
                    <button
                      onClick={handleImportConfirm}
                      disabled={importContacts.isPending}
                      className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                    >
                      {importContacts.isPending ? 'Importing...' : `Import ${importPreview.length}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card border border-hairline rounded-xl p-xl w-full max-w-md shadow-soft">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-display text-display-sm text-ink">Add Contact</h2>
                <button onClick={() => setShowAdd(false)} className="p-xs hover:bg-hairline-soft rounded"><X className="w-5 h-5 text-muted" /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-md">
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Phone Number</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+15551234567"
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Name</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <label className="flex items-center space-x-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.optedIn}
                    onChange={(e) => setAddForm({ ...addForm, optedIn: e.target.checked })}
                    className="w-4 h-4 rounded border border-hairline-strong text-primary"
                  />
                  <span className="font-body text-body-sm text-ink">Opted in to receive messages</span>
                </label>
                {addError && <p className="font-body text-body-sm text-error">{addError}</p>}
                <div className="flex justify-end space-x-sm pt-md border-t border-hairline">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition">Cancel</button>
                  <button
                    type="submit"
                    disabled={createContact.isPending}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                  >
                    {createContact.isPending ? 'Adding...' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editContact && (
          <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
            <div className="bg-surface-card border border-hairline rounded-xl p-xl w-full max-w-md shadow-soft">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-display text-display-sm text-ink">Edit Contact</h2>
                <button onClick={() => setEditContact(null)} className="p-xs hover:bg-hairline-soft rounded"><X className="w-5 h-5 text-muted" /></button>
              </div>
              <div className="space-y-md">
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Phone Number</label>
                  <input
                    type="tel"
                    value={editContact.phone}
                    disabled
                    className="w-full bg-canvas-soft border border-hairline-strong rounded-md font-body text-body-md text-muted px-md py-sm h-11"
                  />
                </div>
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <div className="flex justify-end space-x-sm pt-md border-t border-hairline">
                  <button onClick={() => setEditContact(null)} className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition">Cancel</button>
                  <button
                    onClick={handleEditSave}
                    disabled={updateContact.isPending}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                  >
                    {updateContact.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
