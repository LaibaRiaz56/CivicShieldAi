// Mock emergency resources dataset for Pakistani cities
const { v4: uuidv4 } = require('uuid');

const resources = [
  // ── Rescue Boats ─────────────────────────────────────────────────────────
  { id: 'RB-001', type: 'rescue_boat', name: 'Rescue Boat Alpha', agency: 'PDMA Punjab', base_location: 'Rawal Lake Depot', base_lat: 33.7200, base_lon: 73.1200, capacity: 12, status: 'available', equipment: ['life_jackets', 'rescue_rope', 'pump'], eta_to_g10: 8 },
  { id: 'RB-002', type: 'rescue_boat', name: 'Rescue Boat Bravo', agency: 'CDA Emergency', base_location: 'Simly Dam', base_lat: 33.7500, base_lon: 73.1500, capacity: 8, status: 'available', equipment: ['life_jackets', 'first_aid'], eta_to_g10: 18 },
  { id: 'RB-003', type: 'rescue_boat', name: 'Rescue Boat Charlie', agency: 'Rescue 1122', base_location: 'G-11 Depot', base_lat: 33.6712, base_lon: 72.9789, capacity: 10, status: 'available', equipment: ['life_jackets', 'rescue_rope', 'pump', 'floodlight'], eta_to_g10: 6 },

  // ── Ambulances ────────────────────────────────────────────────────────────
  { id: 'AMB-001', type: 'ambulance', name: 'Ambulance Unit 1', agency: 'Rescue 1122', base_location: 'G-9 Base', base_lat: 33.6851, base_lon: 73.0010, capacity: 2, status: 'available', equipment: ['AED', 'oxygen', 'stretcher'], eta_to_g10: 5 },
  { id: 'AMB-002', type: 'ambulance', name: 'Ambulance Unit 2', agency: 'Edhi Foundation', base_location: 'F-8 Station', base_lat: 33.7028, base_lon: 73.0436, capacity: 2, status: 'available', equipment: ['AED', 'oxygen', 'stretcher', 'ICU_mobile'], eta_to_g10: 11 },
  { id: 'AMB-003', type: 'ambulance', name: 'Ambulance Unit 3', agency: 'Rescue 1122', base_location: 'G-8 Base', base_lat: 33.6912, base_lon: 73.0085, capacity: 2, status: 'available', equipment: ['AED', 'oxygen', 'stretcher'], eta_to_g10: 7 },
  { id: 'AMB-004', type: 'ambulance', name: 'PIMS Response Unit', agency: 'PIMS Hospital', base_location: 'PIMS G-8', base_lat: 33.6950, base_lon: 73.0100, capacity: 4, status: 'available', equipment: ['ICU_mobile', 'ventilator', 'AED'], eta_to_g10: 9 },

  // ── Fire Brigades ─────────────────────────────────────────────────────────
  { id: 'FB-001', type: 'fire_brigade', name: 'Fire Brigade Alpha', agency: 'Islamabad Fire Brigade', base_location: 'G-7 Fire Station', base_lat: 33.6975, base_lon: 73.0225, capacity: 6, status: 'available', equipment: ['water_hose', 'foam', 'ladder', 'thermal_camera'], eta_to_g10: 10 },
  { id: 'FB-002', type: 'fire_brigade', name: 'Fire Brigade Bravo', agency: 'CDA Fire', base_location: 'I-9 Station', base_lat: 33.6634, base_lon: 72.9896, capacity: 6, status: 'available', equipment: ['water_hose', 'foam', 'ladder', 'pump', 'generator'], eta_to_g10: 14 },
  { id: 'FB-003', type: 'fire_brigade', name: 'HAZMAT Unit', agency: 'Capital Administration', base_location: 'H-8 Depot', base_lat: 33.6811, base_lon: 73.0041, capacity: 4, status: 'available', equipment: ['hazmat_suits', 'chemical_neutralizer', 'evacuation_gear'], eta_to_g10: 12 },

  // ── Police ────────────────────────────────────────────────────────────────
  { id: 'POL-001', type: 'police', name: 'G-10 Police Post', agency: 'Islamabad Police', base_location: 'G-10/4 Police Post', base_lat: 33.6800, base_lon: 72.9970, capacity: 8, status: 'available', equipment: ['traffic_cones', 'barriers', 'radio'], eta_to_g10: 2 },
  { id: 'POL-002', type: 'police', name: 'Traffic Police Unit', agency: 'Islamabad Traffic Police', base_location: 'Kashmir Highway Post', base_lat: 33.6850, base_lon: 73.0080, capacity: 4, status: 'available', equipment: ['traffic_cones', 'barriers', 'radio', 'megaphone'], eta_to_g10: 4 },

  // ── Utility Teams ─────────────────────────────────────────────────────────
  { id: 'UTIL-001', type: 'utility_team', name: 'IESCO Emergency Team', agency: 'IESCO', base_location: 'G-7 IESCO Office', base_lat: 33.6980, base_lon: 73.0230, capacity: 4, status: 'available', equipment: ['circuit_breakers', 'insulation_gear', 'generator', 'transformer_parts'], eta_to_g10: 15 },
  { id: 'UTIL-002', type: 'utility_team', name: 'CDA Water Emergency', agency: 'CDA Water Directorate', base_location: 'H-9 Water Works', base_lat: 33.6724, base_lon: 73.0155, capacity: 3, status: 'available', equipment: ['drainage_pumps', 'pipe_repair_kit', 'sump_pumps'], eta_to_g10: 18 },

  // ── Medical Teams ─────────────────────────────────────────────────────────
  { id: 'MED-001', type: 'medical_team', name: 'PIMS Rapid Response', agency: 'PIMS Hospital', base_location: 'PIMS G-8', base_lat: 33.6950, base_lon: 73.0100, capacity: 5, status: 'available', equipment: ['first_aid', 'IV_fluids', 'oxygen', 'trauma_kit'], eta_to_g10: 9 },
  { id: 'MED-002', type: 'medical_team', name: 'Heatwave Medical Unit', agency: 'Ministry of Health', base_location: 'F-10 Medical Camp', base_lat: 33.6980, base_lon: 72.9821, capacity: 8, status: 'available', equipment: ['cooling_mats', 'IV_fluids', 'ORS', 'oxygen'], eta_to_g10: 16 },
];

module.exports = resources;
