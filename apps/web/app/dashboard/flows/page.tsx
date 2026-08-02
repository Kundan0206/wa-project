'use client';

import { useState } from 'react';
import { Plus, Play, Pause, BarChart2, Trash2, X, GripVertical, MessageSquare, Tag, Clock, Square } from 'lucide-react';
import {
  useFlows, useCreateFlow, useActivateFlow, useDeactivateFlow, useDeleteFlow,
  useFlowAnalytics, usePhoneNumbers
} from '../../../lib/hooks';

const triggerLabels: Record<string, string> = {
  first_message: 'First Message',
  keyword_match: 'Keyword Match',
  any_message: 'Any Message',
};

type StepType = 'send_text' | 'add_tag' | 'delay' | 'end';

interface Step {
  id: string;
  type: StepType;
  data: Record<string, any>;
}

const stepMeta: Record<StepType, { label: string; icon: any }> = {
  send_text: { label: 'Send Message', icon: MessageSquare },
  add_tag: { label: 'Add Tag', icon: Tag },
  delay: { label: 'Wait', icon: Clock },
  end: { label: 'End Flow', icon: Square },
};

function newStep(type: StepType): Step {
  const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const defaults: Record<StepType, Record<string, any>> = {
    send_text: { text: '' },
    add_tag: { tag: '' },
    delay: { seconds: 5 },
    end: {},
  };
  return { id, type, data: defaults[type] };
}

const emptyForm = {
  name: '',
  phoneNumberId: '',
  triggerType: 'any_message' as 'any_message' | 'first_message' | 'keyword_match',
  triggerValue: '',
};

export default function FlowsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [steps, setSteps] = useState<Step[]>([newStep('send_text')]);
  const [formError, setFormError] = useState('');
  const [analyticsFlow, setAnalyticsFlow] = useState<{ id: string; name: string } | null>(null);

  const { data: flowsRes, isLoading } = useFlows();
  const { data: phoneRes } = usePhoneNumbers();
  const createFlow = useCreateFlow();
  const activateFlow = useActivateFlow();
  const deactivateFlow = useDeactivateFlow();
  const deleteFlow = useDeleteFlow();

  const flows = flowsRes?.data || [];
  const phoneNumbers = phoneRes?.data || [];

  const addStep = (type: StepType) => setSteps((prev) => [...prev, newStep(type)]);
  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));
  const updateStepData = (id: string, data: Record<string, any>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, data: { ...s.data, ...data } } : s)));
  const moveStep = (index: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSteps([newStep('send_text')]);
    setFormError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Flow name is required');
      return;
    }
    if (!form.phoneNumberId) {
      setFormError('Select a phone number');
      return;
    }
    if (form.triggerType === 'keyword_match' && !form.triggerValue.trim()) {
      setFormError('Enter the keyword to match');
      return;
    }
    if (steps.length === 0) {
      setFormError('Add at least one step');
      return;
    }
    if (steps.some((s) => s.type === 'send_text' && !s.data.text?.trim())) {
      setFormError('Every "Send Message" step needs message text');
      return;
    }
    if (steps.some((s) => s.type === 'add_tag' && !s.data.tag?.trim())) {
      setFormError('Every "Add Tag" step needs a tag name');
      return;
    }

    // A linear chain: each step's edge points to the next step in order.
    const nodes = steps.map((s) => ({ id: s.id, type: s.type, position: { x: 0, y: 0 }, data: s.data }));
    const edges = steps.slice(0, -1).map((s, i) => ({
      id: `edge_${s.id}_${steps[i + 1].id}`,
      source: s.id,
      target: steps[i + 1].id,
    }));

    try {
      await createFlow.mutateAsync({
        name: form.name.trim(),
        phone_number_id: form.phoneNumberId,
        trigger_type: form.triggerType,
        trigger_value: form.triggerType === 'keyword_match' ? form.triggerValue.trim() : undefined,
        nodes,
        edges,
      });
      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create flow');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete flow "${name}"? This cannot be undone.`)) {
      deleteFlow.mutate(id);
    }
  };

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Chatbots</h1>
            <p className="font-body text-body-md text-muted mt-xs">Automate conversations with flow builders</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Flow</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-section">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-card border border-hairline rounded-xl p-md animate-pulse">
                <div className="h-5 w-32 bg-hairline-soft rounded mb-3" />
                <div className="h-4 w-24 bg-hairline-soft rounded mb-3" />
                <div className="h-8 w-full bg-hairline-soft rounded" />
              </div>
            ))}
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-lg text-muted font-body text-body-md">No flows created yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-section">
            {flows.map((flow) => (
              <div key={flow.id} className="bg-surface-card border border-hairline rounded-xl p-md hover:shadow-soft transition">
                <div className="flex items-start justify-between mb-md">
                  <div>
                    <h3 className="font-body text-title-md text-ink">{flow.name}</h3>
                    <div className="flex items-center space-x-sm mt-xs">
                      <span className="bg-surface-strong text-ink text-caption px-sm py-xxs rounded">
                        {triggerLabels[flow.triggerType] || flow.triggerType}
                      </span>
                      {flow.triggerValue && (
                        <span className="font-body text-caption text-muted">&quot;{flow.triggerValue}&quot;</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-xs">
                    {flow.isActive ? (
                      <span className="w-2 h-2 bg-success rounded-full" />
                    ) : (
                      <span className="w-2 h-2 bg-muted-soft rounded-full" />
                    )}
                    <span className={`font-body text-caption ${flow.isActive ? 'text-success' : 'text-muted'}`}>
                      {flow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mb-md">
                  <div className="font-body text-caption text-muted">Phone Number</div>
                  <div className="font-body text-body-sm font-medium">{(flow as any).phoneNumbers?.displayNumber || 'N/A'}</div>
                </div>

                <div className="flex items-center justify-between pt-md border-t border-hairline">
                  <button
                    onClick={() => setAnalyticsFlow({ id: flow.id, name: flow.name })}
                    className="flex items-center space-x-xs font-body text-body-sm text-muted hover:text-ink transition"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                  <div className="flex space-x-xs">
                    <button
                      onClick={() => flow.isActive ? deactivateFlow.mutate(flow.id) : activateFlow.mutate(flow.id)}
                      title={flow.isActive ? 'Deactivate' : 'Activate'}
                      className="p-xs hover:bg-hairline-soft rounded-md transition"
                    >
                      {flow.isActive ? <Pause className="w-4 h-4 text-muted" /> : <Play className="w-4 h-4 text-muted" />}
                    </button>
                    <button
                      onClick={() => handleDelete(flow.id, flow.name)}
                      title="Delete flow"
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

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-lg">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
            {[
              { step: '1', title: 'Choose Trigger', desc: 'Set when the flow starts' },
              { step: '2', title: 'Build Flow', desc: 'Add steps and actions' },
              { step: '3', title: 'Connect to Number', desc: 'Select a phone number' },
              { step: '4', title: 'Activate', desc: 'Go live instantly' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-gradient-sky/20 rounded-full flex items-center justify-center mx-auto mb-sm">
                  <span className="font-body text-title-md text-body-strong">{item.step}</span>
                </div>
                <h3 className="font-body text-title-sm mb-xs">{item.title}</h3>
                <p className="font-body text-body-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50 p-md">
          <div className="bg-surface-card rounded-xl p-xl w-full max-w-2xl border border-hairline shadow-soft max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-display-sm text-ink">Create Flow</h2>
              <button onClick={() => setShowCreate(false)} className="p-xs hover:bg-hairline-soft rounded">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-lg">
              <div className="space-y-md">
                <div>
                  <label className="font-body text-caption text-muted mb-xs block">Flow Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Welcome Message"
                    className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <label className="font-body text-caption text-muted mb-xs block">Phone Number</label>
                    <select
                      value={form.phoneNumberId}
                      onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                      className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                    >
                      <option value="">Select a number</option>
                      {phoneNumbers.map((p) => (
                        <option key={p.id} value={p.id}>{p.displayNumber || p.displayName || p.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-body text-caption text-muted mb-xs block">Trigger</label>
                    <select
                      value={form.triggerType}
                      onChange={(e) => setForm({ ...form, triggerType: e.target.value as typeof form.triggerType })}
                      className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                    >
                      <option value="any_message">Any Message</option>
                      <option value="first_message">First Message</option>
                      <option value="keyword_match">Keyword Match</option>
                    </select>
                  </div>
                </div>

                {form.triggerType === 'keyword_match' && (
                  <div>
                    <label className="font-body text-caption text-muted mb-xs block">Keyword</label>
                    <input
                      type="text"
                      value={form.triggerValue}
                      onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
                      placeholder="hello"
                      className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                    />
                    <p className="font-body text-caption text-muted-soft mt-xxs">Fires when an incoming message contains this word (case-insensitive)</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-sm">
                  <label className="font-body text-caption text-muted">Steps</label>
                  <div className="flex space-x-xs">
                    {(Object.keys(stepMeta) as StepType[]).map((type) => {
                      const Icon = stepMeta[type].icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addStep(type)}
                          title={`Add ${stepMeta[type].label}`}
                          className="p-xs border border-hairline-strong rounded-md hover:bg-hairline-soft transition"
                        >
                          <Icon className="w-4 h-4 text-muted" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-sm">
                  {steps.map((step, i) => {
                    const Icon = stepMeta[step.type].icon;
                    return (
                      <div key={step.id} className="border border-hairline rounded-lg p-md">
                        <div className="flex items-center justify-between mb-sm">
                          <div className="flex items-center space-x-xs">
                            <GripVertical className="w-4 h-4 text-muted-soft" />
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-body text-body-strong text-ink">{i + 1}. {stepMeta[step.type].label}</span>
                          </div>
                          <div className="flex items-center space-x-xxs">
                            <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-xxs hover:bg-hairline-soft rounded disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="p-xxs hover:bg-hairline-soft rounded disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => removeStep(step.id)} className="p-xxs hover:bg-red-50 rounded"><X className="w-4 h-4 text-muted hover:text-error" /></button>
                          </div>
                        </div>

                        {step.type === 'send_text' && (
                          <textarea
                            value={step.data.text || ''}
                            onChange={(e) => updateStepData(step.id, { text: e.target.value })}
                            rows={2}
                            placeholder="Hi! Thanks for reaching out."
                            className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs focus:outline-none focus:border-2 focus:border-primary transition resize-y"
                          />
                        )}
                        {step.type === 'add_tag' && (
                          <input
                            type="text"
                            value={step.data.tag || ''}
                            onChange={(e) => updateStepData(step.id, { tag: e.target.value })}
                            placeholder="new-lead"
                            className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                          />
                        )}
                        {step.type === 'delay' && (
                          <div className="flex items-center space-x-xs">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={step.data.seconds ?? 5}
                              onChange={(e) => updateStepData(step.id, { seconds: parseInt(e.target.value) || 1 })}
                              className="w-24 bg-surface-card border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-9 focus:outline-none focus:border-2 focus:border-primary transition"
                            />
                            <span className="font-body text-body-sm text-muted">seconds</span>
                          </div>
                        )}
                        {step.type === 'end' && (
                          <p className="font-body text-caption text-muted-soft">Stops the flow here.</p>
                        )}
                      </div>
                    );
                  })}
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
                  disabled={createFlow.isPending}
                  className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill hover:bg-primary-active transition disabled:opacity-50"
                >
                  {createFlow.isPending ? 'Creating...' : 'Create Flow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {analyticsFlow && (
        <FlowAnalyticsModal flowId={analyticsFlow.id} flowName={analyticsFlow.name} onClose={() => setAnalyticsFlow(null)} />
      )}
    </div>
  );
}

function FlowAnalyticsModal({ flowId, flowName, onClose }: { flowId: string; flowName: string; onClose: () => void }) {
  const { data, isLoading } = useFlowAnalytics(flowId);
  const analytics = data?.data;

  return (
    <div className="fixed inset-0 bg-canvas-deep/50 flex items-center justify-center z-50 p-md">
      <div className="bg-surface-card rounded-xl p-xl w-full max-w-lg border border-hairline shadow-soft max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-display-sm text-ink">{flowName}</h2>
          <button onClick={onClose} className="p-xs hover:bg-hairline-soft rounded">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-hairline-soft rounded animate-pulse" />
            ))}
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-3 gap-md mb-lg">
              <div className="p-md bg-canvas-soft rounded-lg">
                <div className="font-body text-caption text-muted">Total Sessions</div>
                <div className="font-display text-display-sm text-ink">{analytics.totalSessions.toLocaleString()}</div>
              </div>
              <div className="p-md bg-canvas-soft rounded-lg">
                <div className="font-body text-caption text-muted">Completed</div>
                <div className="font-display text-display-sm text-ink">{analytics.completed.toLocaleString()}</div>
                <div className="font-body text-caption text-muted-soft">{analytics.completionRate}%</div>
              </div>
              <div className="p-md bg-canvas-soft rounded-lg">
                <div className="font-body text-caption text-muted">Failed</div>
                <div className={`font-display text-display-sm ${analytics.failed > 0 ? 'text-error' : 'text-ink'}`}>{analytics.failed.toLocaleString()}</div>
              </div>
            </div>

            {analytics.totalSessions === 0 ? (
              <p className="font-body text-body-md text-muted text-center py-lg">
                No sessions yet &mdash; this flow hasn&apos;t matched an incoming message. Double-check the trigger and that the phone number connected to this flow is the same one receiving messages.
              </p>
            ) : (
              <div>
                <h3 className="font-body text-title-sm text-ink mb-sm">Recent Runs</h3>
                <div className="space-y-xs">
                  {analytics.recentSessions.map((s) => (
                    <div key={s.id} className="border border-hairline rounded-lg p-sm">
                      <div className="flex items-center justify-between">
                        <span className={`text-caption-uppercase px-sm py-xxs rounded-pill ${
                          s.status === 'completed' ? 'bg-success/10 text-success' :
                          s.status === 'failed' ? 'bg-error/10 text-error' :
                          'bg-hairline-soft text-muted'
                        }`}>
                          {s.status}
                        </span>
                        <span className="font-body text-caption text-muted-soft">{new Date(s.startedAt).toLocaleString()}</span>
                      </div>
                      {s.errorMessage && (
                        <p className="font-body text-caption text-error mt-xs">{s.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="font-body text-body-md text-muted text-center py-lg">No sessions yet</p>
        )}
      </div>
    </div>
  );
}
