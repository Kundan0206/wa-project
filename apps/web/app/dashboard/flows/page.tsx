'use client';

import { useState } from 'react';
import { Plus, Search, Play, Pause, BarChart2, MoreVertical, MessageSquare } from 'lucide-react';

const mockFlows = [
  { id: '1', name: 'Welcome Bot', trigger: 'first_message', phoneNumber: '+1 555 0100', isActive: true, sessions: 234, completionRate: 78 },
  { id: '2', name: 'Order Status', trigger: 'keyword_match', keyword: 'order status', phoneNumber: '+1 555 0100', isActive: true, sessions: 156, completionRate: 85 },
  { id: '3', name: 'Support Handoff', trigger: 'any_message', phoneNumber: '+1 555 0101', isActive: false, sessions: 89, completionRate: 62 },
  { id: '4', name: 'Lead Qualification', trigger: 'button_click', buttonText: 'Get Quote', phoneNumber: '+1 555 0100', isActive: true, sessions: 312, completionRate: 71 },
];

const triggerLabels: Record<string, string> = {
  first_message: 'First Message',
  keyword_match: 'Keyword Match',
  button_click: 'Button Click',
  any_message: 'Any Message',
  opt_in: 'Opt In'
};

export default function FlowsPage() {
  const [searchTerm, setSearchTerm] = useState('');

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-section">
          {mockFlows.map((flow) => (
            <div key={flow.id} className="bg-surface-card border border-hairline rounded-xl p-md hover:shadow-soft transition">
              <div className="flex items-start justify-between mb-md">
                <div>
                  <h3 className="font-body text-title-md text-ink">{flow.name}</h3>
                  <div className="flex items-center space-x-sm mt-xs">
                    <span className="bg-surface-strong text-ink text-caption px-sm py-xxs rounded">{triggerLabels[flow.trigger]}</span>
                    {flow.keyword && (
                      <span className="font-body text-caption text-muted">"{flow.keyword}"</span>
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
                <div className="font-body text-body-sm font-medium">{flow.phoneNumber}</div>
              </div>

              <div className="grid grid-cols-2 gap-md mb-md">
                <div>
                  <div className="font-body text-caption text-muted">Sessions</div>
                  <div className="font-body text-title-md">{flow.sessions}</div>
                </div>
                <div>
                  <div className="font-body text-caption text-muted">Completion</div>
                  <div className="font-body text-title-md text-success">{flow.completionRate}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-md border-t border-hairline">
                <button className="flex items-center space-x-xs font-body text-body-sm text-muted hover:text-ink transition">
                  <BarChart2 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
                <div className="flex space-x-xs">
                  <button className="p-xs hover:bg-hairline-soft rounded-md transition">
                    {flow.isActive ? <Pause className="w-4 h-4 text-muted" /> : <Play className="w-4 h-4 text-muted" />}
                  </button>
                  <button className="p-xs hover:bg-hairline-soft rounded-md transition"><MoreVertical className="w-4 h-4 text-muted" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface-card border border-hairline rounded-xl p-lg">
          <h2 className="font-display text-display-sm text-ink mb-lg">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-sky/20 rounded-full flex items-center justify-center mx-auto mb-sm">
                <span className="font-body text-title-md text-body-strong">1</span>
              </div>
              <h3 className="font-body text-title-sm mb-xs">Choose Trigger</h3>
              <p className="font-body text-body-sm text-muted">Set when the flow starts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-mint/20 rounded-full flex items-center justify-center mx-auto mb-sm">
                <span className="font-body text-title-md text-body-strong">2</span>
              </div>
              <h3 className="font-body text-title-sm mb-xs">Build Flow</h3>
              <p className="font-body text-body-sm text-muted">Add nodes and actions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-lavender/20 rounded-full flex items-center justify-center mx-auto mb-sm">
                <span className="font-body text-title-md text-body-strong">3</span>
              </div>
              <h3 className="font-body text-title-sm mb-xs">Connect to Number</h3>
              <p className="font-body text-body-sm text-muted">Select a phone number</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-peach/20 rounded-full flex items-center justify-center mx-auto mb-sm">
                <span className="font-body text-title-md text-body-strong">4</span>
              </div>
              <h3 className="font-body text-title-sm mb-xs">Activate</h3>
              <p className="font-body text-body-sm text-muted">Go live instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}