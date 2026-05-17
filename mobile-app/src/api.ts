import { Platform } from 'react-native';

// ─── Backend URL ──────────────────────────────────────────────────────────────
const BACKEND_IP = '10.156.19.80';
const BACKEND_PORT = '4000';

export const API_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;

// ─── Fetch Helper ────────────────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000,
  retries = 2,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();

      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timer);

      return response;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 1000 * (attempt + 1)),
      );
    }
  }

  throw new Error('Max retries exceeded');
}

// ─── API Service ─────────────────────────────────────────────────────────────
export const api = {
  // GET Request
  async get(path: string, timeoutMs = 10000): Promise<any> {
    try {
      const response = await fetchWithRetry(
        `${API_URL}${path}`,
        {},
        timeoutMs,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.warn(`[API GET ERROR] ${path}`, error.message);

      return null;
    }
  },

  // POST Request
  async post(
    path: string,
    body: any,
    isFormData = false,
  ): Promise<any> {
    try {
      const response = await fetchWithRetry(
        `${API_URL}${path}`,
        {
          method: 'POST',
          headers: isFormData
            ? undefined
            : {
              'Content-Type': 'application/json',
            },
          body: isFormData ? body : JSON.stringify(body),
        },
        20000,
      );

      return await response.json();
    } catch (error: any) {
      console.warn(`[API POST ERROR] ${path}`, error.message);

      return {
        error: error.message,
      };
    }
  },

  // Upload Audio
  async uploadAudio(audioUri: string): Promise<any> {
    try {
      const formData = new FormData();

      const filename =
        audioUri.split('/').pop() || 'voice.m4a';

      formData.append(
        'audio',
        {
          uri: audioUri,
          name: filename,
          type: 'audio/m4a',
        } as any,
      );

      const response = await fetchWithRetry(
        `${API_URL}/api/reports/transcribe`,
        {
          method: 'POST',
          body: formData,
        },
        30000,
      );

      return await response.json();
    } catch (error: any) {
      console.warn('[UPLOAD AUDIO ERROR]', error.message);

      return {
        error: error.message,
      };
    }
  },

  // Poll AI Result
  async pollResult(
    reportId: string,
    maxAttempts = 40,
    intervalMs = 2000,
  ): Promise<any> {
    console.log('[POLL STARTED]', reportId);

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve =>
        setTimeout(resolve, i === 0 ? 2000 : intervalMs),
      );

      const result = await this.get(
        `/api/reports/${reportId}/result`,
      );

      console.log('[POLL RESULT]', result);

      if (!result) {
        continue;
      }

      // Still processing
      if (result.status === 'processing') {
        console.log('[PROCESSING]');
        continue;
      }

      // Success
      if (
        result.status === 'completed' ||
        result.status === 'active'
      ) {
        console.log('[INCIDENT RECEIVED]');
        return result;
      }
    }

    return {
      status: 'timeout',
    };
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type SeverityLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW';

export interface Incident {
  id: string;
  status: string;
  crisis_type: string;
  confidence: number;
  severity_level: SeverityLevel;
  location: string;
  report_text?: string;
  ticket_id?: string;
  citizens_alerted?: number;
  actions_count?: number;
  lat?: number;
  lon?: number;
  created_at: string;
}

// ─── UI Colors ───────────────────────────────────────────────────────────────
export const COLORS = {
  bg: '#050B16',

  card: '#101826',

  card2: '#172033',

  border: 'rgba(255,255,255,0.10)',

  text: '#FFFFFF',

  muted: '#D1D5DB',

  faint: '#94A3B8',

  blue: '#00B2FF',

  cyan: '#00E5FF',

  green: '#00FF88',

  red: '#FF4D4D',

  orange: '#FFA726',

  purple: '#BB86FC',
};