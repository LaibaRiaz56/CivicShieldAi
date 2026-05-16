const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock_key';

let supabase;

// ─── Mock DB (used when Supabase is not configured) ───────────────────────────
const mockDB = {
  incidents: [],
  reports: [],
  agent_traces: [],
  resources: require('../utils/mockResources'),
  alerts: [],
};

const isMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'your_supabase_url_here';

if (!isMock) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// ─── Generic DB Wrapper ───────────────────────────────────────────────────────
const db = {
  async insert(table, data) {
    if (isMock) {
      if (!mockDB[table]) mockDB[table] = [];
      const row = { id: data.id || require('uuid').v4(), ...data, created_at: new Date().toISOString() };
      mockDB[table].push(row);
      return { data: [row], error: null };
    }
    return supabase.from(table).insert(data).select();
  },

  async select(table, filters = {}) {
    if (isMock) {
      let rows = mockDB[table] || [];
      Object.entries(filters).forEach(([k, v]) => {
        rows = rows.filter(r => r[k] === v);
      });
      return { data: rows, error: null };
    }
    let q = supabase.from(table).select('*');
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    return q;
  },

  async selectOne(table, id) {
    if (isMock) {
      const row = (mockDB[table] || []).find(r => r.id === id) || null;
      return { data: row, error: null };
    }
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    return { data, error };
  },

  async update(table, id, updates) {
    if (isMock) {
      const idx = (mockDB[table] || []).findIndex(r => r.id === id);
      if (idx !== -1) {
        mockDB[table][idx] = { ...mockDB[table][idx], ...updates, updated_at: new Date().toISOString() };
        return { data: [mockDB[table][idx]], error: null };
      }
      return { data: null, error: 'Not found' };
    }
    return supabase.from(table).update(updates).eq('id', id).select();
  },

  async getAll(table) {
    if (isMock) {
      return { data: mockDB[table] || [], error: null };
    }
    return supabase.from(table).select('*').order('created_at', { ascending: false });
  },

  mockDB, // expose for seeding
  isMock,
};

module.exports = db;
