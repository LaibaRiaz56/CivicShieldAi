'use client';
import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../lib/api';

interface Msg { role: 'user' | 'assistant'; content: string; time: string; }

const QUICK = [
  'Is it safe to travel to G-10?',
  'Which roads are currently blocked?',
  'Nearest hospital to F-8?',
  'What should I do during a transformer fire?',
  'Active incidents in Islamabad?',
  'How many citizens alerted today?',
];

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'assistant',
    content: 'سلام! I am CivicShield AI — your emergency response assistant.\n\nI can help you with:\n• Real-time crisis information\n• Safety guidance\n• Nearest hospitals & emergency numbers\n• Road closures & alternate routes\n• Active incident status\n\nHow can I help you today?',
    time: now(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'citizen' | 'operator'>('citizen');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: msg, time: now() }]);
    setLoading(true);
    const data = await api.chat(msg, role);
    setMsgs(prev => [...prev, {
      role: 'assistant',
      content: data?.reply || 'I apologize, I could not process your request. Please try again.',
      time: now(),
    }]);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#e8f0fe' }}>💬 AI Emergency Assistant</h1>
            <p style={{ fontSize: '12px', color: '#8899b4', marginTop: 2 }}>Powered by Groq · llama-3.3-70b-versatile</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['citizen', 'operator'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: '7px 16px', borderRadius: '8px', border: `1px solid ${role === r ? 'rgba(0,168,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: role === r ? 'rgba(0,168,255,0.12)' : 'transparent',
                color: role === r ? '#00a8ff' : '#8899b4', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
                {r === 'citizen' ? '👤 Citizen' : '🎖️ Operator'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => send(q)} style={{
              padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(0,168,255,0.2)',
              background: 'rgba(0,168,255,0.06)', color: '#8899b4', fontSize: '11px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
            }} onMouseOver={e => { (e.target as any).style.color = '#00a8ff'; (e.target as any).style.borderColor = 'rgba(0,168,255,0.5)'; }}
               onMouseOut={e => { (e.target as any).style.color = '#8899b4'; (e.target as any).style.borderColor = 'rgba(0,168,255,0.2)'; }}>
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', animation: 'slide-up 0.3s ease' }}>
              {m.role === 'assistant' && (
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #00a8ff, #0044cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, boxShadow: '0 0 12px rgba(0,168,255,0.3)' }}>🛡️</div>
              )}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, rgba(0,168,255,0.2), rgba(0,68,204,0.2))' : 'rgba(13,20,33,0.9)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(0,168,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  fontSize: '13px', color: '#e8f0fe', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>{m.content}</div>
                <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '4px', textAlign: m.role === 'user' ? 'right' : 'left' }}>{m.time}</div>
              </div>
              {m.role === 'user' && (
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  {role === 'operator' ? '🎖️' : '👤'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #00a8ff, #0044cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🛡️</div>
              <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(13,20,33,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a8ff', animation: `blink 1s ${i * 0.3}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Type your emergency query... (Roman Urdu, Urdu, English)"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '12px 16px', color: '#e8f0fe', fontSize: '13px', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { (e.target as any).style.borderColor = 'rgba(0,168,255,0.4)'; }}
              onBlur={e => { (e.target as any).style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #00a8ff, #0044cc)', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!input.trim() || loading) ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(0,168,255,0.3)', transition: 'all 0.2s',
            }}>Send →</button>
          </div>
          <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '8px', textAlign: 'center' }}>
            Groq · llama-3.3-70b · Multilingual · Urdu · Roman Urdu · English
          </div>
        </div>
      </main>
      <style>{`@keyframes slide-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes blink{0%,100%{opacity:0.2}50%{opacity:1}}`}</style>
    </div>
  );
}

function now() { return new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' }); }
