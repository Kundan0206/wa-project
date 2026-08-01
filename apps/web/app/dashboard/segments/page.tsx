'use client';

import { useState } from 'react';
import { Plus, Trash2, X, Users } from 'lucide-react';
import { useSegments, useCreateSegment, useDeleteSegment } from '../../../lib/hooks';

interface FilterRule {
  field: 'tag' | 'opted_in' | 'language';
  value: string;
}

const emptyRule: FilterRule = { field: 'tag', value: '' };

export default function SegmentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [rules, setRules] = useState<FilterRule[]>([{ ...emptyRule }]);
  const [formError, setFormError] = useState('');

  const { data: segmentsRes, isLoading } = useSegments();
  const createSegment = useCreateSegment();
  const deleteSegment = useDeleteSegment();

  const segments = segmentsRes?.data || [];

  const updateRule = (i: number, patch: Partial<FilterRule>) => {
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRule = () => setRules((prev) => [...prev, { ...emptyRule }]);
  const removeRule = (i: number) => setRules((prev) => prev.filter((_, idx) => idx !== i));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Segment name is required');
      return;
    }
    const validRules = rules.filter((r) => r.value.trim());
    if (validRules.length === 0) {
      setFormError('Add at least one filter rule');
      return;
    }

    try {
      await createSegment.mutateAsync({ name: name.trim(), filters: validRules });
      setShowCreate(false);
      setName('');
      setRules([{ ...emptyRule }]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create segment');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete segment "${name}"?`)) {
      deleteSegment.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Segments</h1>
            <p className="font-body text-body-md text-muted mt-xs">Group contacts to target with campaigns</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setFormError(''); }}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Segment</span>
          </button>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">No segments created yet</div>
          ) : (
            <div className="divide-y divide-hairline">
              {segments.map((segment) => (
                <div key={segment.id} className="px-md py-sm flex items-center justify-between">
                  <div className="flex items-center space-x-sm">
                    <div className="w-8 h-8 bg-surface-strong rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted" />
                    </div>
                    <div>
                      <p className="font-body text-body-strong text-ink">{segment.name}</p>
                      <p className="font-body text-caption text-muted-soft">{segment.contactCount.toLocaleString()} contacts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(segment.id, segment.name)}
                    title="Delete segment"
                    className="p-xs hover:bg-red-50 rounded-md transition"
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
              <h2 className="font-display text-display-sm text-ink">Create Segment</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-md">
              <div>
                <label className="font-body text-caption text-muted mb-xs block">Segment Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Active Customers"
                  className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="font-body text-caption text-muted mb-xs block">Filter Rules</label>
                <div className="space-y-xs">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex items-center space-x-xs">
                      <select
                        value={rule.field}
                        onChange={(e) => updateRule(i, { field: e.target.value as FilterRule['field'] })}
                        className="bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                      >
                        <option value="tag">Tag</option>
                        <option value="opted_in">Opted In</option>
                        <option value="language">Language</option>
                      </select>
                      {rule.field === 'opted_in' ? (
                        <select
                          value={rule.value}
                          onChange={(e) => updateRule(i, { value: e.target.value })}
                          className="flex-1 bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                        >
                          <option value="">Select...</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(i, { value: e.target.value })}
                          placeholder={rule.field === 'tag' ? 'vip' : 'en'}
                          className="flex-1 bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                        />
                      )}
                      {rules.length > 1 && (
                        <button type="button" onClick={() => removeRule(i)} className="p-xs hover:bg-hairline-soft rounded">
                          <X className="w-4 h-4 text-muted" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRule}
                  className="font-body text-body-sm text-primary hover:underline mt-xs"
                >
                  + Add rule
                </button>
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
                  disabled={createSegment.isPending}
                  className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                >
                  {createSegment.isPending ? 'Creating...' : 'Create Segment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
