import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      api.get('/ai/history').then(r => {
        if (r.data.length) setMessages(r.data.map(m => ({ role: m.role, content: m.content })));
      }).catch(() => {});
      api.get('/ai/suggestions').then(r => setSuggestions(r.data || [])).catch(() => {});
    }
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: text.trim(), history: messages.slice(-10) });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }]);
      if (res.data.actionResult?.success) {
        toast.success(res.data.message);
        // Refresh suggestions
        api.get('/ai/suggestions').then(r => setSuggestions(r.data || [])).catch(() => {});
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await api.delete('/ai/history').catch(() => {});
    setMessages([]);
    toast.success('Chat cleared');
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

  return (
    <>
      {/* Floating AI button */}
      {!open && (
        <button onClick={() => setOpen(true)} className="ai-fab" title="Helios AI">
          <Sparkles size={22} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="ai-panel">
          {/* Header */}
          <div className="ai-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#8B5CF6" />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Helios AI</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 999 }}>Beta</span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={clearHistory} className="ai-header-btn" title="Clear chat"><Trash2 size={15} /></button>
              <button onClick={() => setOpen(false)} className="ai-header-btn" title="Close"><X size={17} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Sparkles size={32} color="#8B5CF6" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.3rem' }}>Hi! I'm Helios AI</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                  Ask me anything in Hindi or English. I can add expenses, log meals, create tasks, and more!
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <div className="ai-msg-bubble">{m.content}</div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-msg-bubble ai-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length < 3 && (
            <div className="ai-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)} className="ai-suggestion-chip">
                  <Zap size={12} /> {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-input-area">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Type a message..." disabled={loading} className="ai-input" />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="ai-send-btn">
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
