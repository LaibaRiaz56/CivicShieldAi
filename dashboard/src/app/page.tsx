'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';
import Sidebar from '../components/Sidebar';
import { api, Incident, severityColor, crisisLabel } from '../lib/api';

const S: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', minHeight: '100vh', background: '#080c14' },
  main:         { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar:       { padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', background: 'rgba(8,12,20,0.9)' },
  body:         { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', overflowY: 'auto' },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' },
  statCard:     { background: 'rgba(13,20,33,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px 20px', backdropFilter: 'blur(20px)', transition: 'border-color 0.2s' },
  midRow:       { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', flex: 1, minHeight: 460 },
  card:         { background: 'rgba(13,20,33,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', backdropFilter: 'blur(20px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cardHead:     { padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:    { fontSize: '13px', fontWeight: 700, color: '#e8f0fe', display: 'flex', alignItems: 'center', gap: '8px' },
  cardBody:     { flex: 1, overflow: 'hidden' },
  bottomRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: 280 },
};

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [trace, setTrace] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [time, setTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const data = await api.incidents.list();
    if (data?.incidents) setIncidents(data.incidents);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour12: false }));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const selectIncident = async (inc: Incident) => {
    setSelected(inc);
    const td = await api.agents.trace(inc.id);
    setTrace(td?.steps || []);
  };

  const active   = incidents.filter(i => i.status === 'active');
  const critical = incidents.filter(i => i.severity_level === 'CRITICAL' && i.status === 'active');
  const alerted  = incidents.reduce((s, i) => s + (i.citizens_alerted || 0), 0);
  const avgConf  = incidents.length ? Math.round(incidents.reduce((s, i) => s + (i.confidence || 0), 0) / incidents.length * 100) : 0;

  const initMap = () => {
    setMapReady(true);
    setTimeout(() => {
      const L = (window as any).L;
      if (!L || !(document.getElementById('cs-map'))) return;
      if ((window as any)._csMap) return;
      const map = L.map('cs-map', { center: [33.6844, 73.0479], zoom: 11 });
      (window as any)._csMap = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const cssHack = document.createElement('style');
      cssHack.textContent = `.leaflet-container{background:#080c14!important}.leaflet-control-attribution{background:rgba(8,12,20,0.8)!important;color:#4a5568!important;font-size:9px!important}.leaflet-control-zoom a{background:#0d1421!important;color:#00a8ff!important;border:1px solid rgba(255,255,255,0.08)!important}`;
      document.head.appendChild(cssHack);

      // Add markers
      incidents.forEach(inc => addMarker(L, map, inc, () => selectIncident(inc)));
    }, 500);
  };

  const updateMapMarkers = () => {
    const L = (window as any).L;
    const map = (window as any)._csMap;
    if (!L || !map) return;
    if ((window as any)._csMarkers) {
      (window as any)._csMarkers.forEach((m: any) => m.remove());
    }
    (window as any)._csMarkers = [];
    incidents.forEach(inc => {
      const m = addMarker(L, map, inc, () => selectIncident(inc));
      if (m) (window as any)._csMarkers.push(m);
    });
  };

  useEffect(() => { if (mapReady && incidents.length) updateMapMarkers(); }, [incidents, mapReady]);

  return (
    <>
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onLoad={initMap} strategy="afterInteractive" />
      <div style={S.page}>
        <Sidebar />
        <main style={S.main}>
          {/* Top bar */}
          <div style={S.topbar}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#e8f0fe' }}>Crisis Intelligence Dashboard</h1>
              <p style={{ fontSize: '12px', color: '#8899b4', marginTop: 2 }}>Real-time monitoring · Islamabad & Pakistan</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#00a8ff', fontVariantNumeric: 'tabular-nums' }}>{time || '--:--:--'}</div>
                <div style={{ fontSize: '10px', color: '#4a5568' }}>PKT · UTC+5</div>
              </div>
              <button className="btn btn-primary" onClick={load} style={{ fontSize: '12px', padding: '8px 16px' }}>
                {refreshing ? '⟳ Refreshing...' : '↻ Refresh'}
              </button>
            </div>
          </div>

          <div style={S.body}>
            {/* Stats Row */}
            <div style={S.statsRow}>
              {[
                { label: 'Active Incidents', value: active.length, icon: '🚨', color: active.length > 0 ? '#ff3d3d' : '#00e676', sub: `${incidents.length} total` },
                { label: 'Critical Alerts', value: critical.length, icon: '⚠️', color: '#ff3d3d', sub: 'Immediate action needed' },
                { label: 'Citizens Alerted', value: alerted.toLocaleString(), icon: '📢', color: '#00a8ff', sub: 'via SMS & push' },
                { label: 'Avg Confidence', value: `${avgConf}%`, icon: '🎯', color: '#00e676', sub: 'AI detection accuracy' },
              ].map(({ label, value, icon, color, sub }) => (
                <div key={label} style={{ ...S.statCard, borderColor: `${color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '12px', color: '#8899b4', marginTop: '6px', fontWeight: 500 }}>{label}</div>
                      <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '3px' }}>{sub}</div>
                    </div>
                    <div style={{ fontSize: '28px', opacity: 0.7 }}>{icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map + Incident List */}
            <div style={S.midRow}>
              {/* Map */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <span style={S.cardTitle}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' }} />
                    Live Incident Map
                  </span>
                  <span style={{ fontSize: '11px', color: '#4a5568' }}>OpenStreetMap · Leaflet</span>
                </div>
                <div style={{ ...S.cardBody, position: 'relative' }}>
                  <div id="cs-map" style={{ width: '100%', height: '100%', minHeight: '380px' }} />
                  {!mapReady && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,12,20,0.8)' }}>
                      <div style={{ color: '#8899b4', fontSize: '13px' }}>Loading map...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Incident List */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <span style={S.cardTitle}>🚨 Active Incidents</span>
                  <span style={{ fontSize: '11px', background: 'rgba(255,61,61,0.15)', color: '#ff3d3d', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{active.length}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                  {incidents.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4a5568' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
                      <div style={{ fontSize: '13px' }}>No incidents — loading...</div>
                    </div>
                  ) : incidents.map(inc => (
                    <IncidentRow key={inc.id} inc={inc} isSelected={selected?.id === inc.id} onSelect={() => selectIncident(inc)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Trace + What-If */}
            <div style={S.bottomRow}>
              {/* Agent Reasoning Trace */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <span style={S.cardTitle}>🤖 Agent Reasoning Trace</span>
                  {selected && <span style={{ fontSize: '11px', color: '#4a5568' }}>{selected.ticket_id || selected.id.slice(0, 8)}</span>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                  {!selected ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#4a5568' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>👆</div>
                      <div style={{ fontSize: '12px' }}>Select an incident to view agent reasoning</div>
                    </div>
                  ) : trace.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#4a5568', fontSize: '12px' }}>Loading trace...</div>
                  ) : trace.map((step: any) => (
                    <AgentStep key={step.step} step={step} />
                  ))}
                </div>
              </div>

              {/* Incident Detail */}
              <div style={S.card}>
                <div style={S.cardHead}>
                  <span style={S.cardTitle}>📋 Incident Detail</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
                  {!selected ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#4a5568' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📍</div>
                      <div style={{ fontSize: '12px' }}>Select an incident to see details</div>
                    </div>
                  ) : <IncidentDetail inc={selected} />}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function addMarker(L: any, map: any, inc: Incident, onClick: () => void) {
  if (!inc.lat || !inc.lon) return null;
  const color = severityColor(inc.severity_level);
  const emoji = { urban_flooding: '🌊', transformer_explosion: '⚡', electrical_fire: '🔥', smoke_fire: '🌫️', road_accident: '🚗', heatwave: '🌡️' }[inc.crisis_type] || '⚠️';
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:36px">
      ${inc.status === 'active' ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:pr 1.5s ease-out infinite"></div>` : ''}
      <div style="position:absolute;inset:4px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 12px ${color}60">${emoji}</div>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
  const style = document.createElement('style');
  style.textContent = `@keyframes pr{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.5);opacity:0}}`;
  document.head.appendChild(style);
  return L.marker([inc.lat, inc.lon], { icon }).addTo(map).on('click', onClick)
    .bindTooltip(`<b style="color:${color}">${crisisLabel(inc.crisis_type)}</b><br><span style="color:#8899b4;font-size:11px">${inc.location}</span>`, { className: 'cs-tt' });
}

function IncidentRow({ inc, isSelected, onSelect }: { inc: Incident; isSelected: boolean; onSelect: () => void }) {
  const color = severityColor(inc.severity_level);
  return (
    <div onClick={onSelect} style={{
      padding: '10px 12px', borderRadius: '10px', marginBottom: '6px', cursor: 'pointer',
      background: isSelected ? `${color}10` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isSelected ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8f0fe', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {crisisLabel(inc.crisis_type)}
          </div>
          <div style={{ fontSize: '11px', color: '#8899b4' }}>{inc.location}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', marginLeft: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color, background: `${color}18`, padding: '1px 7px', borderRadius: 20, border: `1px solid ${color}33` }}>
            {inc.severity_level}
          </span>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>{Math.round((inc.confidence || 0) * 100)}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <StatusPill status={inc.status} />
        {inc.ticket_id && <span style={{ fontSize: '10px', color: '#4a5568', fontFamily: 'monospace' }}>{inc.ticket_id}</span>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active:    ['#00e676', 'ACTIVE'],
    contained: ['#ffd700', 'CONTAINED'],
    resolved:  ['#8899b4', 'RESOLVED'],
    retracted: ['#4a5568', 'RETRACTED'],
    processing:['#00a8ff', 'PROCESSING'],
  };
  const [color, label] = map[status] || ['#8899b4', status?.toUpperCase()];
  return (
    <span style={{ fontSize: '9px', color, background: `${color}18`, padding: '1px 6px', borderRadius: 10, fontWeight: 700, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function AgentStep({ step }: { step: any }) {
  const colors = ['#00a8ff', '#00e5ff', '#00e676', '#ffd700', '#ff8c00', '#ff3d3d', '#b040fb', '#00e676'];
  const c = colors[(step.step - 1) % colors.length];
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${c}22`, border: `1.5px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: c }}>{step.step}</div>
        {step.step < 8 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: '4px', minHeight: '16px' }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#e8f0fe', marginBottom: '3px' }}>{step.agent}</div>
        <div style={{ fontSize: '10px', color: '#8899b4', lineHeight: 1.5 }}>
          {step.result?.reasoning?.slice(0, 120)}{step.result?.reasoning?.length > 120 ? '...' : ''}
        </div>
        {step.result?.crisis_type && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: c, background: `${c}10`, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
            {step.result.crisis_type} · {Math.round((step.result.confidence || 0) * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}

function IncidentDetail({ inc }: { inc: Incident }) {
  const color = severityColor(inc.severity_level);
  const resources = (() => { try { return JSON.parse(inc.allocated_resources || '[]'); } catch { return []; } })();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ padding: '12px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8f0fe', marginBottom: '6px' }}>{crisisLabel(inc.crisis_type)}</div>
        <div style={{ fontSize: '12px', color: '#8899b4' }}>{inc.location}</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color, background: `${color}18`, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{inc.severity_level}</span>
          <span style={{ fontSize: '10px', color: '#00a8ff', background: 'rgba(0,168,255,0.12)', padding: '2px 8px', borderRadius: 20 }}>{Math.round((inc.confidence || 0) * 100)}% confidence</span>
        </div>
      </div>

      {inc.report_text && (
        <div>
          <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 700, marginBottom: '5px', letterSpacing: '0.5px' }}>CITIZEN REPORT</div>
          <div style={{ fontSize: '12px', color: '#8899b4', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px', borderLeft: '2px solid rgba(0,168,255,0.3)' }}>
            "{inc.report_text}"
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: '#4a5568', fontWeight: 700, marginBottom: '5px', letterSpacing: '0.5px' }}>DEPLOYED RESOURCES</div>
          {resources.map((r: any) => (
            <div key={r.id} style={{ fontSize: '11px', color: '#8899b4', padding: '5px 8px', background: 'rgba(0,168,255,0.05)', borderRadius: '6px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#00a8ff' }}>●</span> {r.name || r.id}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          ['Actions Taken', inc.actions_count || 0],
          ['Citizens Alerted', (inc.citizens_alerted || 0).toLocaleString()],
        ].map(([label, val]) => (
          <div key={label as string} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#00a8ff' }}>{val}</div>
            <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {inc.retraction_reason && (
        <div style={{ fontSize: '11px', color: '#8899b4', background: 'rgba(100,100,100,0.08)', border: '1px solid rgba(100,100,100,0.2)', borderRadius: '8px', padding: '8px 10px' }}>
          <span style={{ color: '#ffd700', fontWeight: 700 }}>⚠ Retracted: </span>{inc.retraction_reason}
        </div>
      )}
    </div>
  );
}
