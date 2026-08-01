'use client';

import { useState } from 'react';
import { Plus, Trash2, X, User } from 'lucide-react';
import { useTeamMembers, useInviteMember, useRemoveMember } from '../../../lib/hooks';
import { useAuthStore } from '../../../lib/store';

const roleColors: Record<string, string> = {
  owner: 'bg-primary/10 text-primary',
  admin: 'bg-gradient-lavender/20 text-body-strong',
  agent: 'bg-success/10 text-success',
  viewer: 'bg-hairline-soft text-muted',
};

export default function TeamPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'agent' as 'admin' | 'agent' | 'viewer' });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: membersRes, isLoading } = useTeamMembers();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  const members = membersRes?.data || [];
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.email.trim() || !form.name.trim()) {
      setFormError('Name and email are required');
      return;
    }

    try {
      await inviteMember.mutateAsync(form);
      setSuccessMessage(`Invite sent to ${form.email}`);
      setForm({ email: '', name: '', role: 'agent' });
      setTimeout(() => { setShowInvite(false); setSuccessMessage(''); }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to invite member');
    }
  };

  const handleRemove = (id: string, name: string) => {
    if (confirm(`Remove ${name} from the team? They will lose access immediately.`)) {
      removeMember.mutate(id);
    }
  };

  if (!isOwnerOrAdmin) {
    return (
      <div className="p-section min-h-screen bg-canvas">
        <div className="max-w-content mx-auto text-center py-section text-muted font-body text-body-md">
          Only owners and admins can manage team members.
        </div>
      </div>
    );
  }

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Team</h1>
            <p className="font-body text-body-md text-muted mt-xs">Manage who has access to this workspace</p>
          </div>
          <button
            onClick={() => { setShowInvite(true); setFormError(''); setSuccessMessage(''); }}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-md space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-hairline-soft rounded animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-md">No team members yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-canvas-soft">
                <tr>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Name</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Email</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Role</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Status</th>
                  <th className="px-md py-sm text-left font-body text-title-sm text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-canvas-soft">
                    <td className="px-md py-sm">
                      <div className="flex items-center space-x-sm">
                        <div className="w-8 h-8 bg-surface-strong rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted" />
                        </div>
                        <span className="font-body text-body-strong text-ink">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-md py-sm font-body text-body-sm text-body">{member.email}</td>
                    <td className="px-md py-sm">
                      <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${roleColors[member.role] || roleColors.viewer}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-md py-sm">
                      <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${member.isActive ? 'bg-success/10 text-success' : 'bg-hairline-soft text-muted'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-md py-sm">
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(member.id, member.name)}
                          title="Remove member"
                          className="p-xs hover:bg-red-50 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4 text-muted hover:text-error" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-md border border-hairline shadow-soft">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Invite Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {successMessage ? (
              <div className="p-md bg-success/10 border border-success/20 rounded-lg font-body text-body-md text-success">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-md">
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {formError && (
                  <p className="font-body text-body-sm text-error">{formError}</p>
                )}

                <div className="flex justify-end space-x-sm pt-md border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="px-md py-sm border border-hairline-strong rounded-pill font-body text-button text-ink hover:bg-hairline-soft transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMember.isPending}
                    className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                  >
                    {inviteMember.isPending ? 'Sending...' : 'Send Invite'}
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
