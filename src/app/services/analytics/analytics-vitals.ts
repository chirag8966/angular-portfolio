import { rate } from './analytics-context';

type Name = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
export interface VitalReading { name: Name; value: number; rating: string; }

/** Collects Core Web Vitals with PerformanceObserver (no dependency). Browser only. */
export class WebVitals {
  private lcp = 0; private fcp = 0; private ttfb = -1; private inp = 0;
  private cls = 0; private sessionCls = 0; private sessionFirst = 0; private sessionLast = 0;
  private interactions = new Map<number, number>();
  private observers: PerformanceObserver[] = [];
  navigationType = 'navigate';

  start(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) { this.ttfb = nav.responseStart; this.navigationType = nav.type || 'navigate'; }
    } catch { /* ignore */ }

    this.observe('largest-contentful-paint', (e) => { this.lcp = (e as PerformanceEntry).startTime; });
    this.observe('paint', (e) => { if (e.name === 'first-contentful-paint') this.fcp = e.startTime; });
    this.observe('layout-shift', (e) => {
      const ls = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
      if (ls.hadRecentInput) return;
      // session window: gap <1s, max 5s
      if (ls.startTime - this.sessionLast > 1000 || ls.startTime - this.sessionFirst > 5000) {
        this.sessionCls = 0; this.sessionFirst = ls.startTime;
      }
      this.sessionLast = ls.startTime;
      this.sessionCls += ls.value;
      if (this.sessionCls > this.cls) this.cls = this.sessionCls;
    });
    this.observe('event', (e) => {
      const ev = e as PerformanceEntry & { interactionId?: number };
      if (!ev.interactionId) return;
      const prev = this.interactions.get(ev.interactionId) || 0;
      if (e.duration > prev) this.interactions.set(ev.interactionId, e.duration);
      if (e.duration > this.inp) this.inp = e.duration;
    }, { durationThreshold: 40 });
  }

  private observe(type: string, cb: (e: PerformanceEntry) => void, extra: object = {}): void {
    try {
      if (!(PerformanceObserver.supportedEntryTypes || []).includes(type)) return;
      const po = new PerformanceObserver((list) => { try { list.getEntries().forEach(cb); } catch { /* ignore */ } });
      po.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
      this.observers.push(po);
    } catch { /* unsupported */ }
  }

  /** Current readings (only metrics that were actually measured). */
  read(): VitalReading[] {
    const out: VitalReading[] = [];
    const push = (name: Name, raw: number, value: number) => out.push({ name, value, rating: rate(name, raw) });
    if (this.lcp > 0) push('LCP', this.lcp, Math.round(this.lcp));
    if (this.fcp > 0) push('FCP', this.fcp, Math.round(this.fcp));
    if (this.ttfb >= 0) push('TTFB', this.ttfb, Math.round(this.ttfb));
    if (this.inp > 0) push('INP', this.inp, Math.round(this.inp));
    push('CLS', this.cls, Math.round(this.cls * 1000)); // CLS * 1000 as integer
    return out;
  }
}
