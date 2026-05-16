import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_URL, COLORS, DEMO_INCIDENTS, Incident, severityColor, crisisEmoji } from '../api';

export default function MapScreen() {
  const [incidents, setIncidents] = useState(DEMO_INCIDENTS);
  const [loading, setLoading] = useState(true);
  const webRef = useRef<WebView>(null);

  const fetchIncidents = async () => {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${API_URL}/api/incidents`, { signal: ctrl.signal });
      const data = await res.json();
      if (data?.incidents?.length > 0) {
        setIncidents(data.incidents);
      }
    } catch {
      // Keep demo data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  // Refresh map markers when incidents change
  useEffect(() => {
    if (!loading && webRef.current) {
      const markersJson = JSON.stringify(
        incidents.map(i => ({
          lat: i.lat || 33.6844,
          lon: i.lon || 73.0479,
          label: crisisEmoji(i.crisis_type) + ' ' + (i.crisis_type || '').replace(/_/g, ' '),
          loc: i.location,
          sev: i.severity_level,
          status: i.status,
          color: severityColor(i.severity_level),
          ticket: i.ticket_id || '',
        }))
      );
      webRef.current?.injectJavaScript(`updateMarkers(${markersJson}); true;`);
    }
  }, [incidents, loading]);

  const mapHTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{height:100%;width:100%;background:#080c14}
    .leaflet-container{background:#080c14!important}
    .leaflet-control-attribution{background:rgba(8,12,20,0.8)!important;color:#4a5568!important;font-size:7px!important}
    .leaflet-control-zoom a{background:#0d1421!important;color:#00a8ff!important;border:1px solid rgba(255,255,255,0.1)!important}
    .leaflet-popup-content-wrapper{background:#0d1421!important;border:1px solid rgba(255,255,255,0.1)!important;color:#e8f0fe!important;border-radius:10px!important}
    .leaflet-popup-tip{background:#0d1421!important}
    @keyframes pulse{0%{transform:scale(1);opacity:0.9}100%{transform:scale(2.8);opacity:0}}
  </style>
</head>
<body>
<div id="map"></div>
<script>
const map = L.map('map',{center:[30.5,69.5],zoom:5,zoomControl:true,attributionControl:true});
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'© OSM © CartoDB',subdomains:'abcd',maxZoom:19}).addTo(map);

let markerLayer = L.layerGroup().addTo(map);

function makeIcon(color, emoji, active) {
  return L.divIcon({
    className:'',
    html: '<div style="position:relative;width:40px;height:40px">'
      + (active ? '<div style="position:absolute;inset:0;border-radius:50%;border:2px solid '+color+';animation:pulse 1.5s ease-out infinite"></div>' : '')
      + '<div style="position:absolute;inset:4px;border-radius:50%;background:'+color+'22;border:2px solid '+color+';display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 14px '+color+'60">'+emoji+'</div>'
    + '</div>',
    iconSize:[40,40], iconAnchor:[20,20]
  });
}

function updateMarkers(data) {
  markerLayer.clearLayers();
  data.forEach(function(inc) {
    if (!inc.lat || !inc.lon) return;
    var active = inc.status === 'active';
    var icon = makeIcon(inc.color, inc.label.split(' ')[0], active);
    var m = L.marker([inc.lat, inc.lon], {icon: icon}).addTo(markerLayer);
    m.bindPopup(
      '<div style="padding:4px;min-width:160px">'
      + '<div style="color:'+inc.color+';font-weight:800;font-size:13px">'+inc.label+'</div>'
      + '<div style="color:#8899b4;font-size:11px;margin-top:3px">📍 '+inc.loc+'</div>'
      + '<div style="margin-top:5px;display:flex;gap:6px;align-items:center">'
      + '<span style="background:'+inc.color+'22;border:1px solid '+inc.color+'44;border-radius:10px;padding:2px 7px;font-size:10px;color:'+inc.color+'">'+inc.sev+'</span>'
      + '<span style="font-size:10px;color:#4a5568">'+inc.status.toUpperCase()+'</span>'
      + (inc.ticket ? '<span style="font-size:10px;color:#4a5568">'+inc.ticket+'</span>' : '')
      + '</div>'
      + '</div>'
    );
  });
}

// Initial Pakistan overview markers
updateMarkers([
  {lat:33.6789,lon:72.9934,label:'🌊 Urban Flooding',loc:'G-10, Islamabad',sev:'HIGH',status:'active',color:'#ff8c00',ticket:'CS-18472'},
  {lat:33.7028,lon:73.0436,label:'⚡ Transformer Explosion',loc:'F-8, Islamabad',sev:'CRITICAL',status:'active',color:'#ff3d3d',ticket:'CS-29381'},
  {lat:31.6340,lon:74.1950,label:'🚗 Road Accident',loc:'Motorway M-2',sev:'MODERATE',status:'contained',color:'#ffd700',ticket:'CS-37194'},
  {lat:24.8607,lon:67.0011,label:'🌡️ Heatwave',loc:'Karachi',sev:'HIGH',status:'active',color:'#ff8c00',ticket:'CS-41827'},
]);
</script>
</body>
</html>`;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>🗺️ Live Incident Map</Text>
          <Text style={s.sub}>Pakistan · {incidents.filter(i=>i.status==='active').length} active incidents</Text>
        </View>
        <TouchableOpacity onPress={fetchIncidents} style={s.refreshBtn}>
          <Text style={{ color: COLORS.blue, fontSize: 12, fontWeight: '700' }}>⟳ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        {[['CRITICAL','#ff3d3d'],['HIGH','#ff8c00'],['MODERATE','#ffd700'],['LOW','#00e676']].map(([l,c]) => (
          <View key={l} style={s.legItem}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
            <Text style={{ color: COLORS.faint, fontSize: 9, fontWeight: '600' }}>{l}</Text>
          </View>
        ))}
      </View>

      <WebView
        ref={webRef}
        source={{ html: mapHTML }}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        javaScriptEnabled domStorageEnabled originWhitelist={['*']}
        onMessage={() => {}}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: 'rgba(8,12,20,0.95)' },
  title:      { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sub:        { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  refreshBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,168,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,168,255,0.3)' },
  legend:     { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  legItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
