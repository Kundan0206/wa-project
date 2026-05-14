'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Tag, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { useConversations, useSendMessage, useResolveConversation } from '../../../lib/hooks';
import { useAuthStore } from '../../../lib/store';
import { getSocket, disconnectSocket } from '../../../lib/socket';

const filters = ['All', 'Open', 'Pending', 'Resolved'];

export default function InboxPage() {
  const token = useAuthStore((s) => s.token);
  const { data: convRes, isLoading } = useConversations();
  const sendMessage = useSendMessage();
  const resolveConversation = useResolveConversation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = convRes?.data || [];
  const selected = conversations.find((c) => c.id === selectedId) || null;

  const filtered = activeFilter === 'All'
    ? conversations
    : conversations.filter((c) => c.status.toLowerCase() === activeFilter.toLowerCase());

  useEffect(() => {
    if (filtered.length > 0 && !selectedId) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.on('new_message', (msg: any) => {
      if (msg.conversation_id === selectedId) {
        setLiveMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('new_message');
      disconnectSocket();
    };
  }, [token, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedId) return;
    sendMessage.mutate(
      { conversationId: selectedId, message: message.trim() },
      { onSuccess: () => setMessage('') }
    );
  };

  const handleResolve = async () => {
    if (!selectedId) return;
    resolveConversation.mutate(selectedId);
  };

  const mockMessages: { id: string; direction: string; content: string; time: string }[] = [];
  const allMessages = [...mockMessages, ...liveMessages];

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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-md border-b border-hairline animate-pulse">
                <div className="flex items-center space-x-sm">
                  <div className="w-10 h-10 bg-hairline-soft rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-hairline-soft rounded" />
                    <div className="h-3 w-40 bg-hairline-soft rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-lg text-muted font-body text-body-sm">No conversations</div>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`p-md border-b border-hairline cursor-pointer hover:bg-canvas-soft ${selectedId === conv.id ? 'bg-canvas-soft' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-sm">
                    <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-muted" />
                    </div>
                    <div>
                      <div className="font-body text-body-strong text-ink">{(conv as any).contacts?.name || (conv as any).contacts?.phone || 'Unknown'}</div>
                      <div className="font-body text-caption text-muted truncate w-40">{conv.lastMessagePreview || 'No messages yet'}</div>
                    </div>
                  </div>
                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="bg-primary text-on-primary text-caption px-sm py-xxs rounded-pill font-medium">{conv.unreadCount}</span>
                  )}
                </div>
                <div className="font-body text-caption text-muted-soft mt-xs ml-13">
                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface-card">
        {selected ? (
          <>
            <div className="p-md border-b border-hairline flex items-center justify-between">
              <div className="flex items-center space-x-sm">
                <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted" />
                </div>
                <div>
                  <div className="font-body text-body-strong text-ink">{(selected as any).contacts?.name || 'Unknown'}</div>
                  <div className="font-body text-caption text-muted">{(selected as any).contacts?.phone || ''}</div>
                </div>
              </div>
              <div className="flex items-center space-x-sm">
                {selected.status !== 'resolved' && (
                  <button onClick={handleResolve} className="p-sm hover:bg-hairline-soft rounded-lg font-body text-body-sm text-success">Resolve</button>
                )}
                <button className="p-sm hover:bg-hairline-soft rounded-lg"><Tag className="w-5 h-5 text-muted" /></button>
                <button className="p-sm hover:bg-hairline-soft rounded-lg"><MoreVertical className="w-5 h-5 text-muted" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {allMessages.length === 0 && (
                <div className="text-center text-muted font-body text-body-sm py-lg">
                  No messages yet. Send a message to start the conversation.
                </div>
              )}
              {allMessages.map((msg) => (
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
              <div ref={messagesEndRef} />
            </div>

            <div className="p-md border-t border-hairline">
              <div className="flex items-center space-x-sm">
                <button className="p-sm hover:bg-hairline-soft rounded-lg"><Paperclip className="w-5 h-5 text-muted" /></button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition"
                />
                <button className="p-sm hover:bg-hairline-soft rounded-lg"><Smile className="w-5 h-5 text-muted" /></button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="bg-primary text-on-primary font-body text-button h-10 px-md rounded-pill flex items-center space-x-xs hover:bg-primary-active transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted font-body text-body-md">
            Select a conversation to view messages
          </div>
        )}
      </div>

      {selected && (
        <div className="w-72 border-l border-hairline bg-surface-card p-md hidden lg:block">
          <h3 className="font-body text-title-sm text-ink mb-md">Contact Details</h3>
          <div className="text-center mb-lg">
            <div className="w-16 h-16 bg-surface-strong rounded-full flex items-center justify-center mx-auto mb-sm">
              <User className="w-8 h-8 text-muted" />
            </div>
            <div className="font-body text-body-strong">{(selected as any).contacts?.name || 'Unknown'}</div>
            <div className="font-body text-caption text-muted">{(selected as any).contacts?.phone || ''}</div>
          </div>

          <div className="space-y-md">
            <div>
              <label className="font-body text-caption text-muted">Status</label>
              <p className="font-body text-body-sm text-body capitalize">{selected.status}</p>
            </div>
            <div>
              <label className="font-body text-caption text-muted">Assigned To</label>
              <p className="font-body text-body-sm text-body">{(selected as any).assigned_to_user?.name || 'Unassigned'}</p>
            </div>
            <div>
              <label className="font-body text-caption text-muted">Created</label>
              <p className="font-body text-body-sm text-body">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <label className="font-body text-caption text-muted">Last Interaction</label>
              <p className="font-body text-body-sm text-body">{selected.lastMessageAt ? new Date(selected.lastMessageAt).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
