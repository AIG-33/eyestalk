'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';

type Tab = 'reports' | 'chat';

export default function ModerationPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const [tab, setTab] = useState<Tab>('reports');

  if (!current?.id) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>{t('moderation')}</h1>
        <p style={{ color: 'var(--text-tertiary)' }}>No venue selected.</p>
      </div>
    );
  }

  const isRu = t('moderation') === 'Модерация';

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{t('moderation')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <button
          onClick={() => setTab('reports')}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: tab === 'reports' ? 'var(--accent-primary)' : 'transparent',
            color: tab === 'reports' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🛡️ {isRu ? 'Жалобы' : 'Reports'}
        </button>
        <button
          onClick={() => setTab('chat')}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: tab === 'chat' ? 'var(--accent-primary)' : 'transparent',
            color: tab === 'chat' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          💬 {isRu ? 'Общий чат' : 'General Chat'}
        </button>
      </div>

      {tab === 'reports' ? (
        <ReportsSection venueId={current.id} />
      ) : (
        <ChatSection venueId={current.id} venueName={current.name} />
      )}
    </div>
  );
}

/* ─── Reports Section ─── */

function ReportsSection({ venueId }: { venueId: string }) {
  const t = useTranslations('dashboard');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(nickname), reported:profiles!reported_user_id(nickname)')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })
      .limit(50);

    setReports(data || []);
    setLoading(false);
  }, [venueId]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  if (loading) {
    return <p style={{ color: 'var(--text-tertiary)' }}>Loading...</p>;
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    reviewed: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    dismissed: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <>
      <p className="mb-6 max-w-2xl" style={{ color: 'var(--text-tertiary)' }}>
        Review reports submitted by guests about inappropriate behavior, spam, or other violations at your venue.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Resolved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Dismissed</span>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
          <p className="text-4xl mb-4">🛡️</p>
          <p className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>All clear!</p>
          <p className="max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            No reports have been filed at your venue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl p-4 flex items-start gap-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[report.status] || ''}`}>
                    {report.status}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{report.reason}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>From:</span> {report.reporter?.nickname || 'Unknown'}
                  {' → '}
                  <span style={{ color: 'var(--text-tertiary)' }}>User:</span> {report.reported?.nickname || 'Unknown'}
                </p>
                {report.description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{report.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
                {report.status === 'pending' && (
                  <div className="flex gap-1">
                    <ReportAction reportId={report.id} action="resolved" label="Resolve" color="green" onDone={loadReports} />
                    <ReportAction reportId={report.id} action="dismissed" label="Dismiss" color="gray" onDone={loadReports} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ReportAction({
  reportId, action, label, color, onDone,
}: {
  reportId: string; action: string; label: string; color: string; onDone: () => void;
}) {
  const handleAction = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('reports').update({ status: action, resolved_by: user?.id }).eq('id', reportId);
    onDone();
  };
  const cls = color === 'green' ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:bg-gray-500/10';
  return (
    <button onClick={handleAction} className={`text-xs px-2 py-1 rounded ${cls} transition-colors`}>{label}</button>
  );
}

/* ─── Chat Section ─── */

interface ChatMsg {
  id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
  sender?: { nickname: string } | { nickname: string }[];
}

function ChatSection({ venueId, venueName }: { venueId: string; venueName: string }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const isRu = venueName ? true : true; // always show; lang detected elsewhere

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch(`/api/v1/venue-chat/${venueId}`);
        if (!res.ok) throw new Error('Failed to init chat');
        const data = await res.json();
        if (cancelled) return;
        setChatId(data.chatId);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      } catch (err: any) {
        if (!cancelled) setInitError(err.message);
      }
    }

    void init();
    return () => { cancelled = true; };
  }, [venueId]);

  useEffect(() => {
    if (!chatId) return;

    async function loadMessages() {
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, type, created_at, sender:profiles!sender_id(nickname)')
        .eq('chat_id', chatId!)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);

      setMessages((data as unknown as ChatMsg[]) || []);
    }

    void loadMessages();

    const supabase = createClient();
    const channel = supabase
      .channel(`venue-chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        () => { void loadMessages(); },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !chatId || !userId) return;
    setSending(true);

    const supabase = createClient();
    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: userId,
      content: text.trim(),
      type: 'text',
    });

    setText('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (initError) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <p style={{ color: 'var(--accent-error)' }}>{initError}</p>
      </div>
    );
  }

  if (!chatId) {
    return <p style={{ color: 'var(--text-tertiary)' }}>Loading chat...</p>;
  }

  const getSenderName = (msg: ChatMsg) => {
    if (Array.isArray(msg.sender)) return msg.sender[0]?.nickname || '???';
    return msg.sender?.nickname || '???';
  };

  const isOwn = (msg: ChatMsg) => msg.sender_id === userId;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', height: 'calc(100vh - 240px)', minHeight: 400 }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <span className="text-xl">💬</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            General Chat
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {messages.length} messages
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(124,111,247,0.1)', color: 'var(--accent-light)' }}>
          ⭐ {venueName}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollBehavior: 'smooth' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <span className="text-4xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const own = isOwn(msg);
          return (
            <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[70%] rounded-2xl px-4 py-2.5"
                style={{
                  backgroundColor: own ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  borderBottomRightRadius: own ? 4 : undefined,
                  borderBottomLeftRadius: own ? undefined : 4,
                }}
              >
                {own ? (
                  <p className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    ⭐ {venueName}
                  </p>
                ) : (
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent-light)' }}>
                    {getSenderName(msg)}
                  </p>
                )}
                <p className="text-sm leading-relaxed" style={{ color: own ? '#fff' : 'var(--text-primary)' }}>
                  {msg.content}
                </p>
                <p className="text-[10px] mt-1 text-right" style={{ color: own ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-3 px-5 py-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(124,111,247,0.1)' }}>
          <span className="text-xs">⭐</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>{venueName}</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none text-sm rounded-xl px-4 py-2.5 focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            maxHeight: 120,
          }}
        />
        <button
          onClick={() => void handleSend()}
          disabled={!text.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-30"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
