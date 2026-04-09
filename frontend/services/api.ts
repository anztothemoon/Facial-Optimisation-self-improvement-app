/**
 * API client — set EXPO_PUBLIC_API_URL in .env
 */
import { getApiBaseUrl } from './apiBase';

const BASE = getApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 45_000;

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  if (signal) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      controller.abort();
    });
    return controller.signal;
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function fetchHealth() {
  const res = await fetch(`${BASE}/health`, {
    signal: withTimeout(undefined, 10_000),
  });
  if (!res.ok) throw new Error('Health check failed');
  return res.json() as Promise<{ ok: boolean }>;
}

export type FaceMetricKey =
  | 'jawline'
  | 'cheekbones'
  | 'chin'
  | 'symmetry'
  | 'eyes'
  | 'skin'
  | 'nose'
  | 'lips'
  | 'facialThirds'
  | 'facialHarmony';

export type FaceAnalysisResponse = {
  overallScore: number;
  label: 'Weak' | 'Average' | 'Strong' | 'Elite';
  metrics: Array<{ key: FaceMetricKey; label: string; score: number }>;
  priorityImprovementAreas: string[];
  maxPotential: number;
  timelineWeeks: number;
};

export type FaceAnalysisMeta = {
  schemaVersion: number;
  disclaimer: string;
  hasPhotoInput: boolean;
  provider: string;
};

/** Matches backend `buildDetailedPreview` / faceAnalysisHandler.js */
export type DetailedPreviewStrength = {
  key: string;
  label: string;
  score: number;
};

export type DetailedPreviewMetricRow = {
  key: string;
  label: string;
  score: number;
  band: 'develop' | 'solid' | 'strong';
};

export type DetailedPreview = {
  headline: string;
  summary: string;
  strengths: DetailedPreviewStrength[];
  improvementFocus: Array<{ rank: number; area: string }>;
  trajectory: {
    estimatedMaxScore: number;
    suggestedTimelineWeeks: number;
  };
  metricTable: DetailedPreviewMetricRow[];
  input: {
    hasPhotoUrl: boolean;
    note: string;
  };
};

export type FaceAnalysisResult = {
  analysis: FaceAnalysisResponse;
  meta?: FaceAnalysisMeta;
  detailedPreview?: DetailedPreview;
};

export async function fetchFaceAnalysis(
  idToken: string,
  payload: {
    photoUrl?: string;
    goals?: string[];
  }
): Promise<FaceAnalysisResult> {
  const res = await fetch(`${BASE}/api/analysis/face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
    signal: withTimeout(undefined, DEFAULT_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('Face analysis request failed');
  const json = (await res.json()) as {
    analysis: FaceAnalysisResponse;
    meta?: FaceAnalysisMeta;
    detailedPreview?: DetailedPreview;
  };
  return {
    analysis: json.analysis,
    meta: json.meta,
    detailedPreview: json.detailedPreview,
  };
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function fetchChatCoach(
  idToken: string,
  message: string,
  history: ChatMessage[] = []
): Promise<{ reply: string; provider?: string; warning?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  };
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, history }),
    signal: withTimeout(undefined, DEFAULT_TIMEOUT_MS),
  });
  let json: {
    reply?: string;
    error?: string;
    provider?: string;
    warning?: string;
  } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const serverMsg =
      typeof json.error === 'string' ? json.error : '';
    if (res.status === 503) {
      throw new Error(
        serverMsg ||
          'API is not configured: set FIREBASE_SERVICE_ACCOUNT_JSON on the backend and restart the server.'
      );
    }
    if (res.status === 401) {
      throw new Error(serverMsg || 'Session expired. Sign out and sign in again.');
    }
    if (res.status === 429) {
      throw new Error(serverMsg || 'Too many requests. Wait a minute and try again.');
    }
    throw new Error(serverMsg || `Chat request failed (${res.status})`);
  }
  if (!json.reply) {
    throw new Error('Empty reply');
  }
  return { reply: json.reply, provider: json.provider, warning: json.warning };
}
