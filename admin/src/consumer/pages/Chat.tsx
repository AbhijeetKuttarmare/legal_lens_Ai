import { FormEvent, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ApiError, askQuestion, getChatHistory } from '../api';
import type { ChatMessage } from '../types';
import { ChatIcon } from '../../icons';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

function renderMessage(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) {
      listItems = [];
      listType = null;
      return;
    }
    const ListTag = listType;
    blocks.push(
      <ListTag key={blocks.length} className="cw-chat-list">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ListTag>,
    );
    listItems = [];
    listType = null;
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const bulletMatch = line.match(/^[-*]\s+(.*)/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/);
    if (bulletMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(bulletMatch[1]);
    } else if (numberedMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(numberedMatch[1]);
    } else {
      flushList();
      blocks.push(
        <p key={blocks.length} className="cw-chat-p">
          {renderInline(line, `p-${blocks.length}`)}
        </p>,
      );
    }
  }
  flushList();
  return blocks;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState(() => (location.state as { prefill?: string } | null)?.prefill || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getChatHistory(id).then(setMessages).catch(() => setError('Could not load chat history.'));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!id || !question.trim() || sending) return;
    const q = question.trim();
    setQuestion('');
    setSending(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: q, createdAt: new Date().toISOString() },
    ]);
    try {
      const { answer } = await askQuestion(id, q);
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-a`, role: 'assistant', content: answer, createdAt: new Date().toISOString() },
      ]);
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      setQuestion(q);
      setError(err instanceof ApiError ? err.message : 'Could not get an answer. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: 'var(--cw-dark-bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0', maxWidth: 700, margin: '0 auto', width: '100%' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--cw-dark-text-muted)', padding: '40px 20px' }}>
            <ChatIcon style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 10 }} />
            <div>Ask anything about this document — e.g. "Can I resign anytime?"</div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === 'assistant' ? 'cw-chat-bubble-rich' : undefined}
            style={{
              maxWidth: '82%',
              marginBottom: 12,
              padding: '12px 14px',
              borderRadius: 16,
              lineHeight: 1.5,
              fontSize: 14,
              ...(m.role === 'user'
                ? { background: 'var(--cw-gold-bright)', color: 'var(--cw-navy)', marginLeft: 'auto', borderBottomRightRadius: 4 }
                : { background: 'var(--cw-dark-surface-2)', color: 'var(--cw-dark-text)', border: '1px solid var(--cw-dark-border)', borderBottomLeftRadius: 4 }),
            }}
          >
            {m.role === 'assistant' ? renderMessage(m.content) : m.content}
          </div>
        ))}
        {error && <div className="cw-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSend}
        style={{ display: 'flex', gap: 8, padding: 14, maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}
      >
        <input
          className="cw-input-plain"
          style={{ marginBottom: 0 }}
          placeholder="Ask about this document..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="cw-btn cw-btn-gold" style={{ width: 'auto', padding: '0 20px' }} disabled={sending || !question.trim()}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
