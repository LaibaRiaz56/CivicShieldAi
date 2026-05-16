// Simulated traffic service for Pakistani roads
// In production, this would call HERE Maps, TomTom, or Google Maps Traffic APIs

const ISLAMABAD_ROADS = [
  { id: 'ISB-01', name: 'Islamabad Expressway', normal_speed: 80, sectors: ['E-11','D-12','F-10'] },
  { id: 'ISB-02', name: 'Kashmir Highway', normal_speed: 70, sectors: ['G-10','G-9','G-8','F-7'] },
  { id: 'ISB-03', name: 'IJP Road (Rawalpindi)', normal_speed: 60, sectors: ['G-11','H-11','I-10'] },
  { id: 'ISB-04', name: 'Murree Road', normal_speed: 60, sectors: ['F-6','G-6','H-8'] },
  { id: 'ISB-05', name: 'Srinagar Highway', normal_speed: 90, sectors: ['E-8','F-8','G-9'] },
  { id: 'ISB-06', name: 'Margalla Road', normal_speed: 50, sectors: ['F-6','F-7','G-6'] },
  { id: 'ISB-07', name: 'Zero Point - G-9', normal_speed: 40, sectors: ['G-5','G-6','G-7','G-8','G-9'] },
  { id: 'ISB-08', name: 'Peshawar Road', normal_speed: 70, sectors: ['G-11','G-12','H-12'] },
];

// Simulate real-time traffic with dynamic congestion
function getTrafficConditions(affectedSectors = []) {
  return ISLAMABAD_ROADS.map(road => {
    const isAffected = affectedSectors.some(s => road.sectors.includes(s));
    const congestionFactor = isAffected ? 0.2 + Math.random() * 0.3 : 0.7 + Math.random() * 0.3;
    const current_speed = Math.round(road.normal_speed * congestionFactor);
    const congestion_pct = Math.round((1 - congestionFactor) * 100);
    
    return {
      ...road,
      current_speed_kmh: current_speed,
      congestion_pct,
      status: congestion_pct > 70 ? 'SEVERE' : congestion_pct > 40 ? 'MODERATE' : 'NORMAL',
      is_blocked: congestion_pct > 85,
      incident_nearby: isAffected,
    };
  });
}

function getTrafficAnomaly(sector) {
  const roads = getTrafficConditions([sector]);
  const anomalies = roads.filter(r => r.incident_nearby && r.congestion_pct > 40);
  return {
    anomaly_detected: anomalies.length > 0,
    affected_roads: anomalies.map(r => r.name),
    max_congestion_pct: anomalies.reduce((max, r) => Math.max(max, r.congestion_pct), 0),
    source: 'simulated_traffic',
  };
}

module.exports = { getTrafficConditions, getTrafficAnomaly };
