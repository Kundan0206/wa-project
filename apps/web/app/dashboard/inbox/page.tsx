'use client';

import { useState } from 'react';
import { Search, Send, User, Tag, MoreVertical, Paperclip, Smile } from 'lucide-react';

const mockConversations = [
  { id: '1', name: 'John Doe', phone: '+1 234 567 8901', lastMessage: 'Hi, I need help with my order', time: '2 min ago', unread: 2, status: 'open' },
  { id: '2', name: 'Sarah Smith', phone: '+1 234 567 8902', lastMessage: 'Thank you for your help!', time: '15 min ago', unread: 0, status: 'pending' },
  { id: '3', name: 'Mike Johnson', phone: '+1 234 567 8903', lastMessage: 'Is the product available?', time: '1 hour ago', unread: 1, status: 'open' },
  { id: '4', name: 'Emily Brown', phone: '+1 234 567 8904', lastMessage: 'When will it be delivered?', time: '2 hours ago', unread: 0, status: 'resolved' },
];

const mockMessages = [
  { id: '1', direction: 'inbound', content: 'Hi, I placed an order yesterday. Can you check the status?', time: '10:30 AM' },
  { id: '2', direction: 'outbound', content: 'Sure! Let me check that for you. Could you please share your order number?', time: '10:32 AM' },
  { id: '3', direction: 'inbound', content: 'It\'s ORD-12345', time: '10:33 AM' },
  { id: '4', direction: 'outbound', content: 'I found your order. It\'s currently being processed and will be shipped within 24 hours. You\'ll receive a tracking link once shipped.', time: '10:35 AM' },
];

const filters = ['All', 'Open', 'Pending', 'Resolved'];

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="w-80 border-r border-hairline bg-surface-card flex flex-col">
        <div className="p-md border-b border-hairline">
          <h1 className="font-display text-display-sm mb-md text-ink">Inbox</h1>
          <div className="relative">
            <Search className="absolute left-sm top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink pl-xl pr-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
            />
          </div>
        </div>

        <div className="flex space-x-xs p-sm border-b border-hairline overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-md py-xs rounded-pill text-caption whitespace-nowrap font-body transition ${
                activeFilter === filter ? 'bg-primary text-on-primary' : 'bg-surface-strong text-muted hover:text-ink'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {mockConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-md border-b border-hairline cursor-pointer hover:bg-canvas-soft ${selectedConversation.id === conv.id ? 'bg-canvas-soft' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-sm">
                  <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted" />
                  </div>
                  <div>
                    <div className="font-body text-body-strong text-ink">{conv.name}</div>
                    <div className="font-body text-caption text-muted truncate w-40">{conv.lastMessage}</div>
                  </div>
                </div>
                {conv.unread > 0 && (
                  <span className="bg-primary text-on-primary text-caption px-sm py-xxs rounded-pill font-medium">{conv.unread}</span>
                )}
              </div>
              <div className="font-body text-caption text-muted-soft mt-xs ml-13">{conv.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface-card">
        <div className="p-md border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-sm">
            <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted" />
            </div>
            <div>
              <div className="font-body text-body-strong text-ink">{selectedConversation.name}</div>
              <div className="font-body text-caption text-muted">{selectedConversation.phone}</div>
            </div>
          </div>
          <div className="flex items-center space-x-sm">
            <button className="p-sm hover:bg-hairline-soft rounded-lg"><Tag className="w-5 h-5 text-muted" /></button>
            <button className="p-sm hover:bg-hairline-soft rounded-lg"><MoreVertical className="w-5 h-5 text-muted" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-md space-y-md">
          {mockMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md px-md py-sm rounded-xl ${
                msg.direction === 'outbound' ? 'bg-primary text-on-primary' : 'bg-canvas-soft text-ink'
              }`}>
                <p className="font-body text-body-md">{msg.content}</p>
                <div className={`font-body text-caption mt-xs ${msg.direction === 'outbound' ? 'text-on-dark-soft' : 'text-muted-soft'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-md border-t border-hairline">
          <div className="flex items-center space-x-sm">
            <button className="p-sm hover:bg-hairline-soft rounded-lg"><Paperclip className="w-5 h-5 text-muted" /></button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
            />
            <button className="p-sm hover:bg-hairline-soft rounded-lg"><Smile className="w-5 h-5 text-muted" /></button>
            <button className="bg-primary text-on-primary font-body text-button h-10 px-md rounded-pill flex items-center space-x-xs hover:bg-primary-active transition">
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 border-l border-hairline bg-surface-card p-md">
        <h3 className="font-body text-title-sm text-ink mb-md">Contact Details</h3>
        <div className="text-center mb-lg">
          <div className="w-16 h-16 bg-surface-strong rounded-full flex items-center justify-center mx-auto mb-sm">
            <User className="w-8 h-8 text-muted" />
          </div>
          <div className="font-body text-body-strong">{selectedConversation.name}</div>
          <div className="font-body text-caption text-muted">{selectedConversation.phone}</div>
        </div>

        <div className="space-y-md">
          <div>
            <label className="font-body text-caption text-muted">Tags</label>
            <div className="flex flex-wrap gap-xs mt-xs">
              <span className="bg-surface-strong text-ink text-caption-uppercase px-sm py-xxs rounded-pill font-medium">Customer</span>
              <span className="bg-surface-strong text-ink text-caption-uppercase px-sm py-xxs rounded-pill font-medium">VIP</span>
            </div>
          </div>

          <div>
            <label className="font-body text-caption text-muted">Created</label>
            <p className="font-body text-body-sm text-body">Jan 15, 2024</p>
          </div>

          <div>
            <label className="font-body text-caption text-muted">Last Interaction</label>
            <p className="font-body text-body-sm text-body">{selectedConversation.time}</p>
          </div>
        </div>
      </div>
    </div>
  );
}