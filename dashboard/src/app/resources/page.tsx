'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../lib/api';

const TYPE_ICONS: Record<string, string> = {
  rescue_boat: '⛵', ambulance: '🚑', fire_brigade: '🚒',
  police: '👮', utility_team: '🔧', medical_team: '🏥', rescue_team: '🦺',
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.resources().then(d => { if (d?.resources) setResources(d.resources); }); }, []);

  const types = ['all', ...Array.from(new Set(resources.map(r => r.type)))];
  const filtered = filter === 'all' ? resources : resources.filter(r => r.type === filter);
  const available = resources.filter(r => r.status === 'available').length;
  const deployed = resources.filter(r => r.status === 'deployed').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#e8f0fe' }}>🚑 Emergency Resources</h1>
            <p style={{ fontSize: '12px', color: '#8899b4', marginTop: 2 }}>Real-time status of all deployed emergency units</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <StatChip label="Available" val={available} color="#00e676" />
            <StatChip label="Deployed" val={deployed} color="#ff8c00" />
            <StatChip label="Total" val={resources.length} color="#00a8ff" />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '6px 14px', borderRadius: '8px', border: `1px solid ${filter === t ? 'rgba(0,168,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: filter === t ? 'rgba(0,168,255,0.12)' : 'transparent',
              color: filter === t ? '#00a8ff' : '#8899b4', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {TYPE_ICONS[t] || '📦'} {t.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {filtered.map(r => <ResourceCard key={r.id} r={r} />)}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResourceCard({ r }: { r: any }) {
  const statusColor = r.status === 'available' ? '#00e676' : r.status === 'deployed' ? '#ff8c00' : '#4a5568';
  return (
    <div style={{ background: 'rgba(13,20,33,0.85)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: '14px', padding: '16px', backdropFilter: 'blur(20px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>{TYPE_ICONS[r.type] || '📦'}</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8f0fe' }}>{r.name}</div>
            <div style={{ fontSize: '11px', color: '#8899b4' }}>{r.agency}</div>
          </div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: statusColor, background: `${statusColor}18`, padding: '3px 8px', borderRadius: 20, border: `1px solid ${statusColor}30` }}>
          {r.status?.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#8899b4', marginBottom: '8px' }}>📍 {r.base_location}</div>
      <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '8px' }}>👥 Capacity: {r.capacity} | ID: {r.id}</div>
      {r.equipment && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {r.equipment.slice(0, 4).map((eq: string) => (
            <span key={eq} style={{ fontSize: '10px', color: '#00a8ff', background: 'rgba(0,168,255,0.08)', padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(0,168,255,0.15)' }}>{eq}</span>
          ))}
          {r.equipment.length > 4 && <span style={{ fontSize: '10px', color: '#4a5568' }}>+{r.equipment.length - 4}</span>}
        </div>
      )}
      {r.eta_to_g10 && <div style={{ fontSize: '11px', color: '#ffd700', marginTop: '8px' }}>⏱ ETA to G-10: {r.eta_to_g10} min</div>}
    </div>
  );
}

function StatChip({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 16px', background: `${color}10`, border: `1px solid ${color}25`, borderRadius: '10px' }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: '10px', color: '#8899b4' }}>{label}</div>
    </div>
  );
}
