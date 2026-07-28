/**
 * First-Touch-Kanal-Attribution für den Reset-Funnel.
 *
 * Beim ERSTEN Seitenaufruf mit einem Herkunftssignal (UTM-Parameter, ?ref=...
 * oder externer Referrer) wird die Quelle in localStorage persistiert.
 * First-Touch gewinnt: Ein späterer Direktbesuch oder ein zweiter Kanal
 * überschreibt die ursprüngliche Quelle NICHT. Haltbarkeit: 90 Tage.
 *
 * Datenschutz: Es werden AUSSCHLIESSLICH die vier UTM-Werte, der ref-Wert und
 * der Referrer-HOSTNAME gespeichert — niemals volle URLs, Query-Strings oder
 * sonstige personenbezogene Daten.
 */

const STORAGE_KEY = 'reset_attribution';
const TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 Tage
const MAX_LEN = 80;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ref?: string;
  referrer_host?: string;
  ts: string; // ISO timestamp des First-Touch
}

/** Whitelist-Sanitizer: nur harmlose Token-Zeichen, hart gekappt. */
function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().slice(0, MAX_LEN).replace(/[^\w.\-:/ ]/g, '');
  return v || undefined;
}

/** Liest den gespeicherten First-Touch. null bei fehlend/kaputt/abgelaufen. */
export function readAttribution(now: number = Date.now()): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'string') return null;
    const ts = Date.parse(parsed.ts);
    if (Number.isNaN(ts) || now - ts > TTL_MS) return null;
    return parsed as Attribution;
  } catch {
    return null;
  }
}

/**
 * Baut aus URL-Query + Referrer ein Attribution-Objekt — oder null, wenn kein
 * Signal vorliegt (Direktbesuch). Pure Funktion, testbar ohne DOM.
 */
export function extractAttribution(
  search: string,
  referrer: string,
  ownHost: string,
  now: number = Date.now(),
): Attribution | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = new URLSearchParams();
  }

  const att: Attribution = { ts: new Date(now).toISOString() };
  const utmSource = clean(params.get('utm_source'));
  const utmMedium = clean(params.get('utm_medium'));
  const utmCampaign = clean(params.get('utm_campaign'));
  const utmContent = clean(params.get('utm_content'));
  const ref = clean(params.get('ref'));

  if (utmSource) att.utm_source = utmSource;
  if (utmMedium) att.utm_medium = utmMedium;
  if (utmCampaign) att.utm_campaign = utmCampaign;
  if (utmContent) att.utm_content = utmContent;
  if (ref) att.ref = ref;

  // Letzte Instanz: externer Referrer — NUR der Hostname, nie die volle URL.
  if (!utmSource && !ref && referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (host && host !== ownHost) att.referrer_host = clean(host);
    } catch {
      /* kaputter Referrer → ignorieren */
    }
  }

  const hasSignal = att.utm_source || att.ref || att.referrer_host;
  return hasSignal ? att : null;
}

/**
 * First-Touch-Regel als pure Funktion: eine vorhandene, gültige Attribution
 * gewinnt IMMER; nur wenn nichts (Gültiges) gespeichert ist, zählt der neue Touch.
 */
export function resolveFirstTouch(
  stored: Attribution | null,
  incoming: Attribution | null,
): Attribution | null {
  return stored ?? incoming;
}

/**
 * Einstiegspunkt — einmal beim App-Start aufrufen. Fängt UTM/ref/Referrer ein
 * und persistiert sie, sofern noch kein gültiger First-Touch vorliegt.
 * Ein Direktbesuch ohne Signal speichert NICHTS (blockiert also keinen
 * späteren attributierten Besuch).
 */
export function captureAttribution(): Attribution | null {
  try {
    const stored = readAttribution();
    const incoming = extractAttribution(
      window.location.search,
      document.referrer || '',
      window.location.hostname,
    );
    const winner = resolveFirstTouch(stored, incoming);
    if (winner && winner !== stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(winner));
    }
    return winner;
  } catch {
    return null;
  }
}

/**
 * Kompakter source-Wert für reset_subscribers.source.
 *   'ig:reel-42'      ← utm_source:utm_content
 *   'ig:sommer-promo' ← utm_source:utm_campaign (wenn kein utm_content)
 *   'ig'              ← nur utm_source
 *   'ref:linkinbio'   ← ?ref=linkinbio
 *   'referrer:tiktok.com' ← nur externer Referrer
 *   null              ← kein Signal (Aufrufer fällt auf 'reset_webapp' zurück)
 */
export function buildSourceValue(att: Attribution | null): string | null {
  if (!att) return null;
  if (att.utm_source) {
    const detail = att.utm_content || att.utm_campaign;
    return detail ? `${att.utm_source}:${detail}` : att.utm_source;
  }
  if (att.ref) return `ref:${att.ref}`;
  if (att.referrer_host) return `referrer:${att.referrer_host}`;
  return null;
}

/** Bequemer Getter für den Lead-Insert: gespeicherter First-Touch → source. */
export function getResetSource(): string | null {
  return buildSourceValue(readAttribution());
}
