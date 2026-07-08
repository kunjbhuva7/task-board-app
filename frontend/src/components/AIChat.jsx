import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, Zap, Mic, MicOff, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [listening, setListening] = useState(false);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

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

  // Voice input (Web Speech API)
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice not supported in this browser');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi primary, also understands English
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      // Auto-send after voice
      setTimeout(() => sendMessage(transcript), 300);
    };
    recognition.onerror = () => { setListening(false); };
    recognition.onend = () => { setListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <>
      {/* Floating AI button */}
      {!open && (
        <button onClick={() => setOpen(true)} className="ai-fab" title="Helios AI">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l1.41-1.41"/>
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="ai-panel">
          {/* Header */}
          <div className="ai-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73l1.41-1.41"/>
              </svg>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Helios AI</span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => { setMessages([]); api.delete('/ai/history').catch(() => {}); }} className="ai-header-btn" title="New Chat"><Plus size={15} /></button>
              <button onClick={clearHistory} className="ai-header-btn" title="Clear all"><Trash2 size={15} /></button>
              <button onClick={() => setOpen(false)} className="ai-header-btn" title="Close"><X size={17} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"/>
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                </div>
                <p className="ai-typewriter">Hi, I'm Helios AI — your smart assistant. Ask me anything or just speak!</p>
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
            <button onClick={toggleVoice} className={`ai-mic-btn ${listening ? 'active' : ''}`} title="Voice input">
              {listening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Type or speak..." disabled={loading} className="ai-input" />
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
