/**
 * AI Wrapper — Central layer for all AI calls.
 * Implements in-memory caching, TTL, cooldown, and dev mock mode.
 */

// ── Simple string hash (djb2) ──────────────────────────────────────────────────
function hashKey(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return 'ai_' + (hash >>> 0).toString(36);
}

// ── In-memory cache ─────────────────────────────────────────────────────────────
interface CacheEntry {
  result: string;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

// TTL defaults (ms)
const TTL_MAP: Record<string, number> = {
  weekly_report: 24 * 60 * 60 * 1000,     // 24h
  daily_insight: 6 * 60 * 60 * 1000,       // 6h
  post_checkin: 6 * 60 * 60 * 1000,        // 6h
  coach_chat: 60 * 60 * 1000,              // 1h
  nutrition_estimate: 30 * 60 * 1000,       // 30m
  nutrition_plan: 6 * 60 * 60 * 1000,       // 6h
  memory_extraction: 60 * 60 * 1000,        // 1h
};

// ── Mock responses (dev mode) ───────────────────────────────────────────────────
const MOCK_RESPONSES: Record<string, string> = {
  weekly_report: JSON.stringify({
    weekLabel: 'KW 12',
    introSentence: 'Solide Woche mit klarem Aufwaertstrend bei deinem Score.',
    coachObservations: [
      'Dein Schlaf-Durchschnitt lag bei 7.2h — das ist eine gute Basis.',
      'Protein bei 85% des Ziels — nah dran, aber noch Luft.',
      'Bewegung an 4/7 Tagen — Konsistenz stimmt.',
    ],
    scoreSummary: { avg: 62, trend: 3, bestDay: 'Mi · 71', weakestDay: 'Mo · 48', explanation: 'Mittwoch nach gutem Schlaf und Training am stärksten.' },
    strongestPillar: { name: 'Bewegung', score: 68, explanation: 'Konsistentes Training an 4 Tagen.' },
    weakestPillar: { name: 'Regeneration', score: 52, explanation: 'Schlafqualität schwankt — Bildschirmzeit am Abend.' },
    patterns: ['Schlaf verschlechtert sich Mitte der Woche', 'Training am Morgen bringt bessere Scores'],
    bottleneck: 'Abendliche Bildschirmzeit drückt deinen Schlaf — das bremst alles andere.',
    weeklyWin: '4 Trainingstage und Protein-Durchschnitt über 80% — starke Basis.',
    nextWeekFocus: ['Bildschirm ab 21 Uhr aus', '30g Protein zum Frühstück täglich', 'Mittwoch als Recovery-Tag nutzen'],
    closingNote: 'Du baust echte Routinen auf. Das ist der Unterschied.',
  }),
  post_checkin: 'Ich habe heute etwas bemerkt: Dein Schlaf war solide und das Energielevel zeigt es. Nutze die gute Form für eine kurze Trainingseinheit — selbst 20 Minuten machen heute den Unterschied.',
  coach_chat: 'Basierend auf deinen Daten sehe ich zwei Dinge: Erstens, dein Protein war die letzten Tage konstant gut. Zweitens, der Schlaf schwankt. Mein Vorschlag: Heute Abend Bildschirm ab 21 Uhr aus und morgen früh mit 30g Protein starten.',
  daily_insight: 'Dein Protein war heute stark verteilt — das unterstützt deinen Stoffwechsel optimal.',
  nutrition_estimate: JSON.stringify({ estimatedGrams: 25, estimatedCalories: 350, level: 'gut', explanation: 'Gute Proteinquelle.' }),
  nutrition_plan: JSON.stringify({ meals: [] }),
  memory_extraction: '[]',
};

// ── Dev mode check ──────────────────────────────────────────────────────────────
function isDevMockMode(): boolean {
  try {
    return import.meta.env.DEV === true || import.meta.env.VITE_AI_MOCK === 'true';
  } catch {
    return false;
  }
}

// ── Cache key builder ───────────────────────────────────────────────────────────
export function buildCacheKey(intent: string, context: object): string {
  // Create a stable representation: sort keys
  const stable = JSON.stringify(context, Object.keys(context).sort());
  return hashKey(intent + ':' + stable);
}

// ── Check in-memory cache ───────────────────────────────────────────────────────
export function getCached(cacheKey: string, ttlMs: number): string | null {
  const entry = memoryCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    memoryCache.delete(cacheKey);
    return null;
  }
  return entry.result;
}

// ── Store in cache ──────────────────────────────────────────────────────────────
export function setCache(cacheKey: string, result: string): void {
  memoryCache.set(cacheKey, { result, timestamp: Date.now() });
  // Evict old entries if cache grows too large (max 100)
  if (memoryCache.size > 100) {
    const oldest = [...memoryCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 20; i++) memoryCache.delete(oldest[i][0]);
  }
}

// ── Clear cache (for testing / manual refresh) ──────────────────────────────────
export function clearAICache(): void {
  memoryCache.clear();
}

// ── Main entry point ────────────────────────────────────────────────────────────
export interface CallAIOptions {
  /** Override TTL in ms */
  ttl?: number;
  /** Mock response to return in dev mode */
  mockResponse?: string;
  /** Skip cache for this call */
  skipCache?: boolean;
  /** User ID for Supabase cache (optional) */
  userId?: string;
}

/**
 * Central AI call wrapper.
 * - Checks in-memory cache first.
 * - In dev/mock mode returns mock immediately.
 * - Calls `fetchFn` only when needed.
 * - Caches result after successful call.
 *
 * @param intent - e.g. 'weekly_report', 'coach_chat', 'post_checkin'
 * @param context - the context object (used to build cache key)
 * @param fetchFn - the actual async function that calls the AI API
 * @param options - optional TTL override, mock override, etc.
 */
export async function callAI(
  intent: string,
  context: object,
  fetchFn: () => Promise<string>,
  options?: CallAIOptions,
): Promise<string> {
  const ttl = options?.ttl ?? TTL_MAP[intent] ?? 60 * 60 * 1000;
  const cacheKey = buildCacheKey(intent, context);

  // 1. Check in-memory cache
  if (!options?.skipCache) {
    const cached = getCached(cacheKey, ttl);
    if (cached !== null) {
      return cached;
    }
  }

  // 2. Dev mock mode
  if (isDevMockMode()) {
    const mock = options?.mockResponse ?? MOCK_RESPONSES[intent] ?? 'Mock-Antwort für ' + intent;
    setCache(cacheKey, mock);
    return mock;
  }

  // 3. Actual API call
  const result = await fetchFn();
  setCache(cacheKey, result);
  return result;
}

/**
 * Convenience: wrap a Supabase function invoke with caching.
 */
export async function callAIWithSupabase(
  intent: string,
  context: object,
  supabaseInvoke: () => Promise<{ data: any; error: any }>,
  extractResult: (data: any) => string,
  options?: CallAIOptions,
): Promise<string> {
  return callAI(
    intent,
    context,
    async () => {
      const { data, error } = await supabaseInvoke();
      if (error) throw new Error(error.message || 'AI-Fehler');
      if (data?.error) throw new Error(data.error);
      return extractResult(data);
    },
    options,
  );
}
