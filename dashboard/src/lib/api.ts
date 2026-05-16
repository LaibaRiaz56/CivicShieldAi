const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function req(path: string, opts?: RequestInit) {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
    });
    return r.json();
  } catch {
    return null;
  }
}

export const api = {
  incidents: {
    list:   () => req('/api/incidents'),
    get:    (id: string) => req(`/api/incidents/${id}`),
    status: (id: string, status: string) =>
      req(`/api/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  agents: {
    trace:  (id: string) => req(`/api/agents/trace/${id}`),
    traces: ()           => req('/api/agents/traces'),
  },
  whatif: (id: string) => req(`/api/whatif/${id}`),
  resources:  () => req('/api/resources'),
  alerts:     () => req('/api/alerts'),
  chat: (message: string, role = 'operator') =>
    req('/api/chat', { method: 'POST', body: JSON.stringify({ message, role }) }),
  reports: {
    submit: (body: FormData) =>
      fetch(`${API_URL}/api/reports`, { method: 'POST', body }).then(r => r.json()),
  },
};

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface Incident {
  id: string;
  status: string;
  crisis_type: string;
  confidence: number;
  severity_level: SeverityLevel;
  severity_score: number;
  location: string;
  lat?: number;
  lon?: number;
  report_text?: string;
  ticket_id?: string;
  actions_count?: number;
  citizens_alerted?: number;
  retraction_reason?: string;
  created_at: string;
  allocated_resources?: string;
}

export function severityColor(level?: string) {
  switch (level) {
    case 'CRITICAL': return '#ff3d3d';
    case 'HIGH':     return '#ff8c00';
    case 'MODERATE': return '#ffd700';
    case 'LOW':      return '#00e676';
    default:         return '#8899b4';
  }
}

export function crisisLabel(type: string) {
  const labels: Record<string, string> = {
    urban_flooding:        '🌊 Urban Flooding',
    transformer_explosion: '⚡ Transformer Explosion',
    electrical_fire:       '🔥 Electrical Fire',
    smoke_fire:            '🌫️ Smoke/Fire',
    road_accident:         '🚗 Road Accident',
    heatwave:              '🌡️ Heatwave',
    infrastructure_failure:'🏗️ Infrastructure Failure',
    crowd_emergency:       '👥 Crowd Emergency',
    gas_leak:              '☢️ Gas Leak',
    building_collapse:     '🏚️ Building Collapse',
  };
  return labels[type] || type?.replace(/_/g, ' ');
}
