'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { api, Incident, severityColor, crisisLabel } from '../../lib/api';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.incidents.list().then(d => { if (d?.incidents) setIncidents(d.incidents); });
  }, []);

  const filtered = incidents.filter(inc => {
    const matchFilter = filter === 'all' || inc.status === filter || inc.severity_level === filter;
    const matchSearch = !search || inc.location.toLowerCase().includes(search.toLowerCase()) || inc.crisis_type.includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#e8f0fe' }}>All Incidents</h1>
          <p style={{ fontSize: '12px', color: '#8899b4', marginTop: 2 }}>Complete incident registry with AI analysis</p>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search location or type..." style={{
            flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '8px 12px', color: '#e8f0fe', fontSize: '13px', outline: 'none',
          }} />
          {['all', 'active', 'contained', 'resolved', 'retracted', 'CRITICAL', 'HIGH', 'MODERATE'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 14px', borderRadius: '8px', border: `1px solid ${filter === f ? 'rgba(0,168,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: filter === f ? 'rgba(0,168,255,0.12)' : 'transparent',
              color: filter === f ? '#00a8ff' : '#8899b4', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            }}>{f.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            {filtered.map(inc => <IncidentCard key={inc.id} inc={inc} />)}
            {filtered.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#4a5568' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div>No incidents match your filter</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function IncidentCard({ inc }: { inc: Incident }) {
  const [trace, setTrace] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const color = severityColor(inc.severity_level);

  const toggle = async () => {
    if (!expanded && trace.length === 0) {
      const td = await api.agents.trace(inc.id);
      setTrace(td?.steps || []);
    }
    setExpanded(!expanded);
  };

  const resources = (() => { try { return JSON.parse(inc.allocated_resources || '[]'); } catch { return []; } })();

  return (
    <div style={{
      background: 'rgba(13,20,33,0.85)', border: `1px solid ${expanded ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '14px', overflow: 'hidden', backdropFilter: 'blur(20px)', transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div onClick={toggle} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {getCrisisEmoji(inc.crisis_type)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8f0fe' }}>{crisisLabel(inc.crisis_type)}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}33` }}>{inc.severity_level}</span>
            <StatusBadge status={inc.status} />
          </div>
          <div style={{ fontSize: '12px', color: '#8899b4', marginTop: '3px' }}>📍 {inc.location}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color }}>{Math.round((inc.confidence || 0) * 100)}%</div>
          <div style={{ fontSize: '10px', color: '#4a5568' }}>confidence</div>
        </div>
        <div style={{ fontSize: '18px', color: '#4a5568', marginLeft: '8px', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {[
          ['🎫', inc.ticket_id || '—'],
          ['⚡', `${inc.actions_count || 0} actions`],
          ['📢', `${(inc.citizens_alerted || 0).toLocaleString()} alerted`],
          ['📅', new Date(inc.created_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })],
        ].map(([icon, val]) => (
          <span key={val as string} style={{ fontSize: '11px', color: '#8899b4' }}>{icon} {val}</span>
        ))}
      </div>

      {/* Expanded: Report + Resources + Trace */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            {inc.report_text && (
              <>
                <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>CITIZEN REPORT</div>
                <div style={{ fontSize: '12px', color: '#8899b4', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '14px', borderLeft: '2px solid rgba(0,168,255,0.3)', paddingLeft: '10px' }}>
                  "{inc.report_text}"
                </div>
              </>
            )}
            {resources.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>RESOURCES DEPLOYED</div>
                {resources.map((r: any) => (
                  <div key={r.id} style={{ fontSize: '11px', color: '#8899b4', padding: '5px 8px', background: 'rgba(0,168,255,0.05)', borderRadius: '6px', marginBottom: '4px' }}>
                    🚑 {r.name || r.id} — {r.type}
                  </div>
                ))}
              </>
            )}
            {inc.retraction_reason && (
              <div style={{ fontSize: '11px', color: '#8899b4', background: 'rgba(100,100,100,0.08)', border: '1px solid rgba(100,100,100,0.2)', borderRadius: '8px', padding: '8px' }}>
                ⚠ <strong style={{ color: '#ffd700' }}>Retracted:</strong> {inc.retraction_reason}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>AGENT PIPELINE ({trace.length}/8 steps)</div>
            {trace.map((step: any) => (
              <div key={step.step} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,168,255,0.15)', border: '1px solid rgba(0,168,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#00a8ff', fontWeight: 700, flexShrink: 0 }}>{step.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#e8f0fe' }}>{step.agent}</div>
                  <div style={{ fontSize: '10px', color: '#4a5568' }}>{step.result?.reasoning?.slice(0, 80)}...</div>
                </div>
              </div>
            ))}
            {trace.length === 0 && <div style={{ fontSize: '12px', color: '#4a5568' }}>No trace available</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = { active: '#00e676', contained: '#ffd700', resolved: '#8899b4', retracted: '#4a5568', processing: '#00a8ff' };
  const c = m[status] || '#8899b4';
  return <span style={{ fontSize: '9px', color: c, background: `${c}18`, padding: '2px 7px', borderRadius: 10, fontWeight: 700, border: `1px solid ${c}30` }}>{status?.toUpperCase()}</span>;
}

function getCrisisEmoji(type: string) {
  return ({ urban_flooding: '🌊', transformer_explosion: '⚡', electrical_fire: '🔥', smoke_fire: '🌫️', road_accident: '🚗', heatwave: '🌡️' } as any)[type] || '⚠️';
}
