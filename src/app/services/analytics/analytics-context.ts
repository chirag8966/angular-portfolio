/** Small, dependency-free helpers for the analytics journey. Every function is exception-safe. */

export type Params = Record<string, string | number | boolean | undefined>;

export function safeGet(store: 'session' | 'local', key: string): string | null {
  try { return (store === 'session' ? sessionStorage : localStorage).getItem(key); } catch { return null; }
}

export function safeSet(store: 'session' | 'local', key: string, value: string): void {
  try { (store === 'session' ? sessionStorage : localStorage).setItem(key, value); } catch { /* storage unavailable */ }
}

/** True when the visitor signals Do-Not-Track or Global Privacy Control. */
export function isOptedOut(): boolean {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    const w = window as Window & { doNotTrack?: string };
    return nav.doNotTrack === '1' || w.doNotTrack === '1' || nav.globalPrivacyControl === true;
  } catch { return false; }
}

export function deviceClass(): string {
  const w = window.innerWidth;
  return w < 576 ? 'mobile' : w < 992 ? 'tablet' : 'desktop';
}

export function viewportLabel(): string {
  return `${window.innerWidth}x${window.innerHeight}`;
}

export function truncate(value: string | null | undefined, max: number): string {
  const v = (value || '').replace(/\s+/g, ' ').trim();
  return v.length > max ? v.slice(0, max - 1) + '…' : v;
}

export function basename(url: string | undefined): string {
  if (!url) return '';
  try { return new URL(url, location.href).pathname.split('/').pop() || ''; } catch { return ''; }
}

export interface Journey {
  id: string;
  landingPath: string;
  firstSource: string;
  firstMedium: string;
  firstCampaign: string;
  referrerHost: string;
  visitor: 'new' | 'returning';
  landedAt: number;
}

function rand(): string {
  try {
    const a = new Uint32Array(2); crypto.getRandomValues(a);
    return a[0].toString(36) + a[1].toString(36);
  } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

/** Creates (or restores, for reloads in the same tab) the per-visit journey record. */
export function loadJourney(): Journey {
  const KEY = 'ga_journey';
  const saved = safeGet('session', KEY);
  if (saved) {
    try { const j = JSON.parse(saved) as Journey; if (j && j.id) return j; } catch { /* rebuild */ }
  }
  const q = new URLSearchParams(location.search);
  let refHost = '';
  try { refHost = document.referrer ? new URL(document.referrer).host : ''; } catch { /* ignore */ }
  if (refHost === location.host) refHost = '';
  const visited = safeGet('local', 'ga_visited') === '1';
  safeSet('local', 'ga_visited', '1');
  const journey: Journey = {
    id: rand(),
    landingPath: location.pathname || '/',
    firstSource: truncate(q.get('utm_source') || refHost || '(direct)', 60),
    firstMedium: truncate(q.get('utm_medium') || (refHost ? 'referral' : '(none)'), 40),
    firstCampaign: truncate(q.get('utm_campaign') || '', 60),
    referrerHost: refHost,
    visitor: visited ? 'returning' : 'new',
    landedAt: Date.now(),
  };
  safeSet('session', KEY, JSON.stringify(journey));
  return journey;
}

export function rate(metric: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB', v: number): 'good' | 'needs-improvement' | 'poor' {
  const t = { LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500], FCP: [1800, 3000], TTFB: [800, 1800] }[metric];
  return v <= t[0] ? 'good' : v <= t[1] ? 'needs-improvement' : 'poor';
}

/** Runs `fn` when the main thread is idle (falls back to a timeout). */
export function whenIdle(fn: () => void, timeout = 2000): void {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout }); else setTimeout(fn, 200);
}
