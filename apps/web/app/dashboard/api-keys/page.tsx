'use client';

import { useState } from 'react';
import { Plus, Trash2, X, Key } from 'lucide-react';
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '../../../lib/hooks';

const SCOPE_OPTIONS = ['messages:send', 'messages:read', 'contacts:read', 'contacts:write', 'templates:read'];

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['messages:send', 'messages:read']);
  const [formError, setFormError] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data: keysRes, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();

  const keys = keysRes?.data || [];

  const toggleScope = (scope: string) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Key name is required');
      return;
    }

    try {
      const res = await createKey.mutateAsync({ name: name.trim(), scopes });
      setNewKey(res.data?.key || null);
      setName('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create API key');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete API key "${name}"? Anything using it will stop working immediately.`)) {
      deleteKey.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">API Keys</h1>
            <p className="font-body text-body-md text-muted mt-xs">Programmatic access to send messages and read data</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setFormError(''); setNewKey(null); }}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Key</span>
          </button>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-14 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">No API keys yet</div>
          ) : (
            <div className="divide-y divide-hairline">
              {keys.map((key) => (
                <div key={key.id} className="px-md py-sm flex items-center justify-between">
                  <div className="flex items-center space-x-sm min-w-0">
                    <Key className="w-4 h-4 text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-body text-body-strong text-ink">{key.name}</p>
                      <p className="font-body text-caption text-muted-soft">
                        {key.prefix}&hellip;
                        {key.lastUsedAt ? ` · last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : ' · never used'}
                        {key.expiresAt && ` · expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                      </p>
                      <div className="flex flex-wrap gap-xs mt-xs">
                        {key.scopes.map((scope) => (
                          <span key={scope} className="font-body text-caption bg-hairline-soft text-body px-sm py-xxs rounded">{scope}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id, key.name)}
                    title="Delete key"
                    className="p-xs hover:bg-red-50 rounded-md transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-muted hover:text-error" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Create API Key</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {newKey ? (
              <div>
                <div className="mb-md p-md bg-success/10 border border-success/20 rounded-lg">
                  <p className="font-body text-body-md text-success mb-xs">Key created successfully!</p>
                  <p className="font-body text-body-sm text-muted">
                    Copy this now &mdash; it won&apos;t be shown again.
                  </p>
                </div>
                <code className="block w-full bg-canvas-soft border border-hairline rounded-md p-md font-body text-body-sm text-ink break-all mb-md">
                  {newKey}
                </code>
                <div className="flex justify-end">
                  <button
                    onClick={() => { setShowCreate(false); setNewKey(null); }}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-md">
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Production integration"
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Scopes</label>
                  <div className="space-y-xs">
                    {SCOPE_OPTIONS.map((scope) => (
                      <label key={scope} className="flex items-center space-x-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope)}
                          onChange={() => toggleScope(scope)}
                          className="w-4 h-4 rounded border border-hairline-strong text-primary"
                        />
                        <span className="font-body text-body-sm text-ink">{scope}</span>
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
                    disabled={createKey.isPending}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                  >
                    {createKey.isPending ? 'Creating...' : 'Create Key'}
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
