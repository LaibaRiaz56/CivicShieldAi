'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { api, Incident, severityColor, crisisLabel } from '../../lib/api';

export default function SimulatePage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.incidents.list().then(d => {
      const active = (d?.incidents || []).filter((i: Incident) => i.status !== 'retracted');
      setIncidents(active);
      if (active.length) setSelected(active[0].id);
    });
  }, []);

  const run = async () => {
    if (!selected) return;
    setLoading(true);
    const data = await api.whatif(selected);
    setResult(data?.outcome || null);
    setLoading(false);
  };

  const inc = incidents.find(i => i.id === selected);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#e8f0fe' }}>🔮 What-If Simulation Engine</h1>
          <p style={{ fontSize: '12px', color: '#8899b4', marginTop: 2 }}>Model outcomes of delayed vs proactive emergency response</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
            <select value={selected} onChange={e => setSelected(e.target.value)} style={{
              flex: 1, background: 'rgba(13,20,33,0.9)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '10px 14px', color: '#e8f0fe', fontSize: '13px', outline: 'none',
            }}>
              {incidents.map(i => <option key={i.id} value={i.id}>{crisisLabel(i.crisis_type)} — {i.location}</option>)}
            </select>
            <button onClick={run} disabled={!selected || loading} style={{
              padding: '10px 28px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #b040fb, #6020cc)', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(176,64,251,0.3)', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? '⟳ Simulating...' : '🔮 Run Simulation'}
            </button>
          </div>

          {/* Selected incident info */}
          {inc && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', background: 'rgba(13,20,33,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: '11px', color: '#4a5568' }}>Crisis:</span> <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8f0fe' }}>{crisisLabel(inc.crisis_type)}</span></div>
              <div><span style={{ fontSize: '11px', color: '#4a5568' }}>Location:</span> <span style={{ fontSize: '13px', color: '#8899b4' }}>{inc.location}</span></div>
              <div><span style={{ fontSize: '11px', color: '#4a5568' }}>Severity:</span> <span style={{ fontSize: '13px', fontWeight: 700, color: severityColor(inc.severity_level) }}>{inc.severity_level}</span></div>
              <div><span style={{ fontSize: '11px', color: '#4a5568' }}>Confidence:</span> <span style={{ fontSize: '13px', color: '#00a8ff' }}>{Math.round((inc.confidence || 0) * 100)}%</span></div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ animation: 'slide-up 0.4s ease' }}>
              {/* What-If Statements */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e8f0fe', marginBottom: '12px' }}>⚠️ Predicted Consequences</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(result.what_if_statements || []).map((stmt: string, i: number) => (
                    <div key={i} style={{
                      padding: '12px 16px', borderRadius: '10px',
                      background: i === 0 ? 'rgba(255,61,61,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${i === 0 ? 'rgba(255,61,61,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{i === 0 ? '🚨' : i === 1 ? '✅' : '⏰'}</span>
                      <span style={{ fontSize: '13px', color: i === 0 ? '#ff8c00' : '#8899b4', lineHeight: 1.5 }}>{stmt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Scenario Comparison */}
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e8f0fe', marginBottom: '12px' }}>📊 Scenario Comparison</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { data: result.scenario_no_action,         color: '#ff3d3d', icon: '❌' },
                  { data: result.scenario_with_intervention, color: '#00e676', icon: '✅' },
                  { data: result.scenario_delayed,           color: '#ffd700', icon: '⏰' },
                ].map(({ data, color, icon }) => data && (
                  <ScenarioCard key={data.label} data={data} color={color} icon={icon} />
                ))}
              </div>

              {/* Key Metrics */}
              {result.key_metrics && (
                <>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e8f0fe', marginBottom: '12px' }}>📈 Response Effectiveness</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {[
                      ['Lives Protected', result.key_metrics.lives_protected, '#ff3d3d', '❤️'],
                      ['Response Efficiency', `${result.key_metrics.response_efficiency_pct}%`, '#00a8ff', '⚡'],
                      ['Resource Utilization', `${result.key_metrics.resource_utilization_pct}%`, '#00e676', '🚑'],
                      ['Cost Savings (PKR)', (result.key_metrics.cost_savings_pkr || 0).toLocaleString(), '#ffd700', '💰'],
                    ].map(([label, val, color, icon]) => (
                      <div key={label as string} style={{ padding: '14px', background: 'rgba(13,20,33,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: color as string }}>{val}</div>
                        <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '4px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Summary */}
              <div style={{ padding: '16px 20px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: 700, marginBottom: '6px' }}>AI SIMULATION SUMMARY</div>
                <div style={{ fontSize: '13px', color: '#e8f0fe', lineHeight: 1.7 }}>{result.improvement_summary}</div>
                {result.containment_probability_pct && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#8899b4' }}>Containment Probability:</span>
                    <ContainmentBar pct={result.containment_probability_pct} />
                  </div>
                )}
              </div>
            </div>
          )}

          {!result && !loading && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#4a5568' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#8899b4', marginBottom: '8px' }}>What-If Simulation Engine</div>
              <div style={{ fontSize: '13px' }}>Select an incident and click "Run Simulation" to model outcomes</div>
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function ScenarioCard({ data, color, icon }: { data: any; color: string; icon: string }) {
  return (
    <div style={{ padding: '16px', background: 'rgba(13,20,33,0.85)', border: `1px solid ${color}25`, borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color }}>{data.label}</span>
      </div>
      {Object.entries(data).filter(([k]) => k !== 'label').map(([key, val]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: '#4a5568' }}>{key.replace(/_/g, ' ')}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#e8f0fe' }}>{typeof val === 'number' ? (key.includes('pkr') ? val.toLocaleString() : val) : String(val)}</span>
        </div>
      ))}
    </div>
  );
}

function ContainmentBar({ pct }: { pct: number }) {
  return (
    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #00a8ff, #00e676)', borderRadius: '4px', transition: 'width 1s ease' }} />
    </div>
  );
}
