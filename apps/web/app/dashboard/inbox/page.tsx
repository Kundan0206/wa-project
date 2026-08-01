'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Search, Send, User, Tag, ExternalLink, Paperclip, Smile, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations, useConversationMessages, useSendMessage, useResolveConversation, useUpdateConversationLabels } from '../../../lib/hooks';
import { useAuthStore } from '../../../lib/store';
import { getSocket, disconnectSocket } from '../../../lib/socket';
import type { Message } from '@wa/shared';

const filters = ['All', 'Open', 'Pending', 'Resolved'];

export default function InboxPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const { data: convRes, isLoading } = useConversations();
  const sendMessage = useSendMessage();
  const resolveConversation = useResolveConversation();
  const updateLabels = useUpdateConversationLabels();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [showLabelEditor, setShowLabelEditor] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = convRes?.data || [];
  const selected = conversations.find((c) => c.id === selectedId) || null;

  const filtered = conversations
    .filter((c) => activeFilter === 'All' || c.status.toLowerCase() === activeFilter.toLowerCase())
    .filter((c) => {
      if (!searchTerm.trim()) return true;
      const name = (c as any).contacts?.name || (c as any).contacts?.phone || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const { data: historyRes, isLoading: historyLoading } = useConversationMessages(selectedId || '', { limit: '100' });
  const history = useMemo(() => historyRes?.data || [], [historyRes]);

  // Reset live-received messages whenever the selected conversation changes,
  // so messages from a previously open thread don't bleed into the next one.
  useEffect(() => {
    setLiveMessages([]);
  }, [selectedId]);

  useEffect(() => {
    if (filtered.length > 0 && !selectedId) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  // Kept in a ref (not state) so the listener effect below can read the
  // currently-open conversation without needing selectedId as a dependency -
  // that would otherwise force the socket to disconnect/reconnect on every
  // conversation switch and risk missing events during the reconnect gap.
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // The backend only broadcasts a new message to the
  // tenant:{id}:conversation:{id} room, which a client must explicitly join -
  // it is not auto-joined on connect. Without this, no per-conversation
  // event ever reaches this client, no matter what listeners are attached.
  useEffect(() => {
    if (!token || !selectedId) return;
    const socket = getSocket(token);
    socket.emit('join_conversation', selectedId);
    return () => {
      socket.emit('leave_conversation', selectedId);
    };
  }, [token, selectedId]);

  // Connects once per mount and stays connected across conversation
  // switches - only the room membership (above) changes per selection.
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.on('new_message', (msg: Message) => {
      if (msg.conversationId === selectedIdRef.current) {
        setLiveMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
      // Keep the conversation list (last message preview, unread count) fresh
      // regardless of which thread is currently open.
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    // Broadcast tenant-wide (unlike new_message, which requires having
    // joined that specific conversation's room) - this is what makes a
    // brand-new conversation (e.g. a contact's first-ever message) show up
    // in the sidebar without the client ever having joined it.
    socket.on('conversation_update', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('message_status_updated', () => {
      if (selectedIdRef.current) {
        queryClient.invalidateQueries({ queryKey: ['conversations', selectedIdRef.current, 'messages'] });
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('conversation_update');
      socket.off('message_status_updated');
      disconnectSocket();
    };
  }, [token, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, history]);

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

  // De-duplicate in case a message arrives live before the history query
  // refetches and includes it too.
  const allMessages = useMemo(() => {
    const seen = new Set(history.map((m) => m.id));
    return [...history, ...liveMessages.filter((m) => !seen.has(m.id))];
  }, [history, liveMessages]);

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <div className="w-80 border-r border-hairline bg-surface-card flex flex-col">
        <div className="p-md border-b border-hairline">
          <h1 className="font-display text-display-sm mb-md text-ink">Inbox</h1>
          <div className="relative">
            <Search className="absolute left-sm top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="flex items-center space-x-sm relative">
                {selected.status !== 'resolved' && (
                  <button onClick={handleResolve} className="p-sm hover:bg-hairline-soft rounded-lg font-body text-body-sm text-success">Resolve</button>
                )}
                <button
                  onClick={() => setShowLabelEditor((v) => !v)}
                  title="Labels"
                  className="p-sm hover:bg-hairline-soft rounded-lg"
                >
                  <Tag className="w-5 h-5 text-muted" />
                </button>
                {(selected.assignedTo || (selected as any).contacts?.id) && (
                  <Link
                    href={`/dashboard/contacts?search=${encodeURIComponent((selected as any).contacts?.phone || '')}`}
                    title="View contact"
                    className="p-sm hover:bg-hairline-soft rounded-lg block"
                  >
                    <ExternalLink className="w-5 h-5 text-muted" />
                  </Link>
                )}

                {showLabelEditor && (
                  <div className="absolute right-0 top-full mt-xs w-64 bg-surface-card border border-hairline rounded-lg shadow-soft z-20 p-md">
                    <div className="flex items-center justify-between mb-sm">
                      <span className="font-body text-caption text-muted">Labels</span>
                      <button onClick={() => setShowLabelEditor(false)}><X className="w-4 h-4 text-muted" /></button>
                    </div>
                    <div className="flex flex-wrap gap-xs mb-sm">
                      {(selected.labels || []).map((label) => (
                        <span key={label} className="flex items-center gap-xxs bg-hairline-soft text-body text-caption px-sm py-xxs rounded-pill">
                          {label}
                          <button
                            onClick={() => updateLabels.mutate({ conversationId: selected.id, labels: (selected.labels || []).filter((l) => l !== label) })}
                            className="hover:text-error"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {(selected.labels || []).length === 0 && (
                        <span className="font-body text-caption text-muted-soft">No labels yet</span>
                      )}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const label = newLabel.trim();
                        if (!label) return;
                        const current = selected.labels || [];
                        if (!current.includes(label)) {
                          updateLabels.mutate({ conversationId: selected.id, labels: [...current, label] });
                        }
                        setNewLabel('');
                      }}
                      className="flex space-x-xs"
                    >
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Add label..."
                        className="flex-1 bg-canvas-soft border border-hairline-strong rounded-md font-body text-body-sm text-ink px-sm py-xs h-8 focus:outline-none focus:border-2 focus:border-primary transition"
                      />
                      <button type="submit" className="px-sm py-xs bg-primary text-on-primary rounded-md font-body text-caption">Add</button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {historyLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-md w-48 h-12 bg-hairline-soft rounded-xl animate-pulse" />
                  </div>
                ))
              ) : allMessages.length === 0 ? (
                <div className="text-center text-muted font-body text-body-sm py-lg">
                  No messages yet. Send a message to start the conversation.
                </div>
              ) : allMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md px-md py-sm rounded-xl ${
                    msg.direction === 'outbound' ? 'bg-primary text-on-primary' : 'bg-canvas-soft text-ink'
                  }`}>
                    <p className="font-body text-body-md whitespace-pre-wrap break-words">
                      {msg.type === 'template' ? '[Template message]' : msg.content}
                    </p>
                    <div className={`font-body text-caption mt-xs ${msg.direction === 'outbound' ? 'text-on-dark-soft' : 'text-muted-soft'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === 'outbound' && msg.status && (
                        <span className="ml-xs capitalize">&middot; {msg.status}</span>
                      )}
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
