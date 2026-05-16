'use client';
import { useEffect, useRef } from 'react';
import type { Incident } from '../lib/api';
import { severityColor, crisisLabel } from '../lib/api';

interface Props { incidents: Incident[]; selected?: string; onSelect?: (id: string) => void; }

export default function IncidentMap({ incidents, selected, onSelect }: Props) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    mapRef.current = L.map(containerRef.current, {
      center: [33.6844, 73.0479],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles',
    }).addTo(mapRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    incidents.forEach(inc => {
      if (!inc.lat || !inc.lon) return;
      const color = severityColor(inc.severity_level);
      const isSelected = inc.id === selected;

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:${isSelected ? 48 : 36}px;height:${isSelected ? 48 : 36}px">
            ${inc.status === 'active' ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:pulse-ring 1.5s ease-out infinite;opacity:0.6"></div>` : ''}
            <div style="
              position:absolute;inset:4px;border-radius:50%;
              background:${color}22;border:2px solid ${color};
              display:flex;align-items:center;justify-content:center;
              font-size:${isSelected ? 18 : 14}px;
              box-shadow:0 0 ${isSelected ? 20 : 10}px ${color}60;
            ">${getCrisisEmoji(inc.crisis_type)}</div>
          </div>`,
        iconSize: [isSelected ? 48 : 36, isSelected ? 48 : 36],
        iconAnchor: [isSelected ? 24 : 18, isSelected ? 24 : 18],
      });

      const marker = L.marker([inc.lat, inc.lon], { icon })
        .addTo(mapRef.current)
        .on('click', () => onSelect?.(inc.id));

      marker.bindTooltip(`
        <div style="background:#0d1421;border:1px solid ${color}44;border-radius:8px;padding:8px 12px;color:#e8f0fe;min-width:180px">
          <div style="color:${color};font-weight:700;font-size:12px">${crisisLabel(inc.crisis_type)}</div>
          <div style="font-size:11px;margin-top:4px;color:#8899b4">${inc.location}</div>
          <div style="font-size:11px;margin-top:2px">${inc.severity_level} · ${Math.round((inc.confidence || 0) * 100)}%</div>
        </div>`, { permanent: false, className: 'cs-tooltip' });

      markersRef.current.push(marker);
    });
  }, [incidents, selected]);

  return (
    <>
      <style>{`
        .cs-tooltip .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .leaflet-container { background: #080c14 !important; font-family: Inter, sans-serif; }
        .leaflet-control-attribution { background: rgba(8,12,20,0.8) !important; color: #4a5568 !important; font-size: 9px !important; }
        .leaflet-control-zoom a { background: #0d1421 !important; color: #00a8ff !important; border: 1px solid rgba(255,255,255,0.08) !important; }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.5);opacity:0} }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }} />
    </>
  );
}

function getCrisisEmoji(type: string) {
  const e: Record<string, string> = {
    urban_flooding: '🌊', transformer_explosion: '⚡', electrical_fire: '🔥',
    smoke_fire: '🌫️', road_accident: '🚗', heatwave: '🌡️',
    infrastructure_failure: '🏗️', heatwave_emergency: '☀️',
  };
  return e[type] || '⚠️';
}
