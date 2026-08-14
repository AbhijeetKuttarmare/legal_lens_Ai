import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { askQuestion, getChatHistory } from '../api';
import type { ChatMessage } from '../types';
import { ChatIcon } from '../../icons';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
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
    } catch {
      setError('Could not get an answer. Please try again.');
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
            {m.content}
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
