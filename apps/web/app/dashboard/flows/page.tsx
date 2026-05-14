'use client';

import { useState } from 'react';
import { Plus, Search, Play, Pause, BarChart2, MoreVertical } from 'lucide-react';
import { useFlows, useActivateFlow, useDeactivateFlow, useDeleteFlow } from '../../../lib/hooks';

const triggerLabels: Record<string, string> = {
  first_message: 'First Message',
  keyword_match: 'Keyword Match',
  button_click: 'Button Click',
  any_message: 'Any Message',
  opt_in: 'Opt In'
};

export default function FlowsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: flowsRes, isLoading } = useFlows();
  const activateFlow = useActivateFlow();
  const deactivateFlow = useDeactivateFlow();
  const deleteFlow = useDeleteFlow();

  const flows = flowsRes?.data || [];
  const filtered = searchTerm
    ? flows.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : flows;

  return (
    <div className="p-section min-h-screen bg-canvas">
      <div className="max-w-content mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h1 className="font-display text-display-md text-ink">Chatbots</h1>
            <p className="font-body text-body-md text-muted mt-xs">Automate conversations with flow builders</p>
          </div>
          <button className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill flex items-center space-x-xs hover:bg-primary-active transition">
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-lg text-muted font-body text-body-md">No flows created yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-section">
            {filtered.map((flow) => (
              <div key={flow.id} className="bg-surface-card border border-hairline rounded-xl p-md hover:shadow-soft transition">
                <div className="flex items-start justify-between mb-md">
                  <div>
                    <h3 className="font-body text-title-md text-ink">{flow.name}</h3>
                    <div className="flex items-center space-x-sm mt-xs">
                      <span className="bg-surface-strong text-ink text-caption px-sm py-xxs rounded">
                        {triggerLabels[flow.triggerType] || flow.triggerType}
                      </span>
                      {flow.triggerValue && (
                        <span className="font-body text-caption text-muted">"{flow.triggerValue}"</span>
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
                  <div className="font-body text-body-sm font-medium">{(flow as any).phone_numbers?.displayNumber || 'N/A'}</div>
                </div>

                <div className="flex items-center justify-between pt-md border-t border-hairline">
                  <button className="flex items-center space-x-xs font-body text-body-sm text-muted hover:text-ink transition">
                    <BarChart2 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                  <div className="flex space-x-xs">
                    <button
                      onClick={() => flow.isActive ? deactivateFlow.mutate(flow.id) : activateFlow.mutate(flow.id)}
                      className="p-xs hover:bg-hairline-soft rounded-md transition"
                    >
                      {flow.isActive ? <Pause className="w-4 h-4 text-muted" /> : <Play className="w-4 h-4 text-muted" />}
                    </button>
                    <button onClick={() => deleteFlow.mutate(flow.id)} className="p-xs hover:bg-hairline-soft rounded-md transition">
                      <MoreVertical className="w-4 h-4 text-muted" />
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
              { step: '2', title: 'Build Flow', desc: 'Add nodes and actions' },
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
    </div>
  );
}
