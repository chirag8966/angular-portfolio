import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  basename, deviceClass, isOptedOut, Journey, loadJourney, Params, truncate, viewportLabel, whenIdle,
} from './analytics-context';
import { WebVitals } from './analytics-vitals';

declare global {
  interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void; }
}

/** Sections observed for section_view / dwell: [selector, label]. */
const SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['section.banner', 'banner'], ['#about', 'about'], ['#jobs', 'experience'],
  ['#proyects', 'projects'], ['app-dx-ball', 'game'], ['#contact', 'contact'],
];
const SCROLL_STEPS = [25, 50, 75, 90, 100];
const MAX_ERRORS = 5;

/**
 * Google Analytics 4 (gtag.js) journey tracking. Event schema: docs/analytics-events.md.
 *
 * Nothing runs on the server, nothing runs before window `load` + an idle callback, and
 * Do-Not-Track / Global Privacy Control visitors never load gtag at all. All listeners are
 * registered outside the Angular zone, so analytics never triggers change detection.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser: boolean;
  private started = false;
  private journey!: Journey;
  private step = 0;
  private queue: Array<[string, Params]> = [];
  private flushScheduled = false;
  private vitals = new WebVitals();
  private vitalsSent = false;

  // scroll
  private scrollDone = new Set<number>();
  private maxScroll = 0;
  private scrollTick = false;
  // sections
  private observer?: IntersectionObserver;
  private observed = new WeakSet<Element>();
  private seen = new Set<string>();
  private active = new Map<string, number>(); // label -> timestamp when it became active
  private dwell = new Map<string, number>();  // label -> accumulated ms (unsent)
  // engagement
  private engagedMs = 0;
  private engagedSince = 0;
  private interactions = 0;
  // misc
  private errors = 0;
  private lastPath = '';
  private lastTheme = '';
  private lastLang = '';

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private zone: NgZone,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    try {
      if (this.isBrowser && environment.trackAnalyticID && !isOptedOut()) {
        this.zone.runOutsideAngular(() => this.bootstrap(environment.trackAnalyticID));
      }
    } catch { /* analytics must never break the app */ }
  }

  /** Public API (used by templates): custom event with GA4-style category/label parameters. */
  sendAnalyticEvent(action: string, category: string, label?: string) {
    this.track(action, { event_category: category, event_label: label });
  }

  /**
   * Public API kept for backwards compatibility. page_view is now sent automatically on every
   * Router NavigationEnd (with the real document title), so this must not double count.
   */
  sendAnalyticPageView(_path: string, _title: string) { /* handled by the router listener */ }

  // ---------------------------------------------------------------- core

  private bootstrap(id: string) {
    const start = () => whenIdle(() => this.start(id), 4000);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  private start(id: string) {
    try {
      if (this.started) return;
      this.started = true;
      this.journey = loadJourney();

      window.dataLayer = window.dataLayer || [];
      // gtag.js expects the real `arguments` object, so this must stay a classic function
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id, { send_page_view: false, transport_type: 'beacon' });
      this.gtag('set', 'user_properties', {
        visitor_type: this.journey.visitor, device_class: deviceClass(),
        first_source: this.journey.firstSource, first_medium: this.journey.firstMedium,
        theme: this.theme(), language: this.lang(),
      });
      this.lastTheme = this.theme(); this.lastLang = this.lang();

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);

      this.engagedSince = document.visibilityState === 'visible' ? performance.now() : 0;
      this.pageView(document.referrer);
      this.vitals.start();
      this.listen();
      this.observeSections();
      this.flush();
    } catch { /* ignore */ }
  }

  private gtag(...args: unknown[]) {
    try { window.gtag?.(...args); } catch { /* ignore */ }
  }

  private theme(): string { return document.documentElement.dataset['theme'] || 'dark'; }
  private lang(): string { return document.documentElement.lang || 'en'; }

  /** Queue an event; non-critical ones are flushed in an idle callback. */
  private track(name: string, params: Params = {}, critical = false) {
    if (!this.isBrowser) return;
    try {
      if (!this.journey && !this.started) { this.queue.push([name, params]); return; }
      this.queue.push([name, params]);
      if (!this.started) return;
      if (critical) this.flush();
      else if (!this.flushScheduled) { this.flushScheduled = true; whenIdle(() => this.flush(), 1000); }
    } catch { /* ignore */ }
  }

  private flush() {
    this.flushScheduled = false;
    if (!this.started) return;
    const items = this.queue; this.queue = [];
    for (const [name, params] of items) {
      this.gtag('event', name, {
        ...params,
        journey_id: this.journey.id,
        journey_step: ++this.step,
        seconds_since_landing: Math.round((Date.now() - this.journey.landedAt) / 1000),
      });
    }
  }

  private pageView(referrer: string) {
    const path = location.pathname + location.search;
    this.lastPath = path;
    this.track('page_view', {
      page_location: location.href, page_path: location.pathname, page_title: document.title,
      page_referrer: referrer, language: this.lang(), theme: this.theme(),
      landing_path: this.journey.landingPath, first_source: this.journey.firstSource,
      first_medium: this.journey.firstMedium, first_campaign: this.journey.firstCampaign,
      referrer_host: this.journey.referrerHost, visitor_type: this.journey.visitor,
      device_class: deviceClass(), viewport: viewportLabel(),
    }, true);
  }

  // ------------------------------------------------------------ listeners

  private listen() {
    // SPA navigation without importing @angular/router (the app has no router today, and importing it
    // would add ~20 kB gzip to the initial bundle). Covers pushState/replaceState/popstate, so a
    // future router is tracked automatically. Hash-only changes (#about) are not page views.
    const onNav = () => {
      setTimeout(() => {
        if (location.pathname + location.search === this.lastPath) return;
        const prev = location.origin + this.lastPath;
        this.scrollDone.clear(); this.maxScroll = 0;
        this.pageView(prev);
        whenIdle(() => this.observeSections());
      }, 0);
    };
    for (const fn of ['pushState', 'replaceState'] as const) {
      const orig = history[fn];
      history[fn] = function (this: History, ...args: Parameters<History['pushState']>) {
        const r = orig.apply(this, args); try { onNav(); } catch { /* ignore */ } return r;
      };
    }
    window.addEventListener('popstate', onNav);

    window.addEventListener('scroll', () => {
      if (this.scrollTick) return;
      this.scrollTick = true;
      requestAnimationFrame(() => { this.scrollTick = false; this.onScroll(); });
    }, { passive: true });

    document.addEventListener('click', (ev) => this.onClick(ev), { capture: true, passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.onHide(); else this.onShow();
    });
    window.addEventListener('pagehide', () => this.onHide());
    window.addEventListener('pageshow', () => this.onShow());
    window.addEventListener('focus', () => this.onShow());
    window.addEventListener('blur', () => this.pauseEngaged());

    window.addEventListener('error', (ev) => {
      if (ev.target !== window) return; // ignore resource errors
      this.jsError(ev.message, ev.filename, ev.lineno);
    });
    window.addEventListener('unhandledrejection', (ev) => {
      const r = ev.reason;
      this.jsError(r && r.message ? r.message : String(r), (r && r.stack) || '', 0);
    });

    // theme + language changes, read from the DOM so there is no dependency on other services
    new MutationObserver(() => {
      const theme = this.theme(); const lang = this.lang();
      if (theme !== this.lastTheme) {
        this.track('theme_change', { theme, previous_theme: this.lastTheme });
        this.gtag('set', 'user_properties', { theme }); this.lastTheme = theme;
      }
      if (lang !== this.lastLang) {
        this.track('language_change', { language: lang, previous_language: this.lastLang });
        this.gtag('set', 'user_properties', { language: lang }); this.lastLang = lang;
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-theme'] });
  }

  private onScroll() {
    try {
      const el = document.documentElement;
      const total = el.scrollHeight;
      if (total <= 0) return;
      const pct = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / total) * 100));
      if (pct > this.maxScroll) this.maxScroll = pct;
      for (const s of SCROLL_STEPS) {
        if (pct >= s && !this.scrollDone.has(s)) {
          this.scrollDone.add(s);
          this.track('scroll_depth', { percent_scrolled: s, page_path: location.pathname });
        }
      }
      this.observeSections(); // pick up lazily inserted sections (cheap, WeakSet-guarded)
    } catch { /* ignore */ }
  }

  // ------------------------------------------------------------- sections

  private observeSections() {
    try {
      if (!('IntersectionObserver' in window)) return;
      this.observer ||= new IntersectionObserver((entries) => {
        const now = performance.now();
        for (const en of entries) {
          const label = (en.target as HTMLElement).dataset['gaSection'] || '';
          const vh = window.innerHeight;
          // "visible" = at least half of the section, or half the viewport for tall sections
          const visible = en.isIntersecting && (en.intersectionRatio >= 0.5 || en.intersectionRect.height >= vh * 0.5);
          if (en.isIntersecting && !this.seen.has(label)) {
            this.seen.add(label);
            this.track('section_view', {
              section_id: label, section_order: this.seen.size,
              seconds_since_landing: Math.round((Date.now() - this.journey.landedAt) / 1000),
            });
          }
          if (visible && !this.active.has(label)) this.active.set(label, now);
          else if (!visible && this.active.has(label)) this.closeSection(label, now);
        }
      }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      for (const [sel, label] of SECTIONS) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && !this.observed.has(el)) {
          this.observed.add(el); el.dataset['gaSection'] = label; this.observer.observe(el);
        }
      }
    } catch { /* ignore */ }
  }

  private closeSection(label: string, now: number) {
    const since = this.active.get(label);
    if (since === undefined) return;
    this.active.delete(label);
    this.dwell.set(label, (this.dwell.get(label) || 0) + Math.max(0, now - since));
  }

  // --------------------------------------------------------------- clicks

  private onClick(ev: MouseEvent) {
    try {
      this.interactions++;
      const t = ev.target as Element | null;
      const el = t?.closest?.('a[href],button[data-track],[data-track]') as HTMLElement | null;
      if (!el) return;
      const text = truncate(el.getAttribute('aria-label') || el.textContent, 60);
      const dt = el.getAttribute('data-track');
      if (!(el instanceof HTMLAnchorElement)) {
        if (dt) this.track('click', { click_type: 'button', click_id: truncate(dt, 40), link_text: text });
        return;
      }
      const href = el.getAttribute('href') || '';
      let type = 'internal'; let url = ''; let domain = '';
      if (/^mailto:/i.test(href)) { type = 'mailto'; url = 'mailto:'; }
      else if (/^tel:/i.test(href)) { type = 'tel'; url = 'tel:'; }
      else {
        const u = new URL(el.href, location.href);
        url = truncate(u.origin + u.pathname, 100); domain = u.host;
        if (/\.(pdf|docx?|zip)$/i.test(u.pathname) || el.hasAttribute('download')) type = 'download';
        else if (u.host !== location.host) type = /(^|\.)(github|linkedin)\.com$/i.test(u.hostname) ? 'social' : 'outbound';
        else if (el.closest('header, nav, .navbar') || href.startsWith('#')) type = 'nav';
      }
      if (type === 'internal' && !dt) return;
      this.track('click', {
        click_type: type, link_url: url, link_domain: domain, link_text: text,
        click_id: dt ? truncate(dt, 40) : undefined,
        file_name: type === 'download' ? basename(el.href) : undefined,
      });
    } catch { /* ignore */ }
  }

  // ------------------------------------------------- engagement / vitals

  private pauseEngaged() {
    if (this.engagedSince) { this.engagedMs += performance.now() - this.engagedSince; this.engagedSince = 0; }
  }

  private onShow() {
    if (document.visibilityState === 'visible' && !this.engagedSince) this.engagedSince = performance.now();
    const now = performance.now();
    this.active.forEach((_v, k) => this.active.set(k, now)); // resume dwell clocks
  }

  private onHide() {
    try {
      if (!this.started) return;
      this.pauseEngaged();
      const now = performance.now();
      // close (but keep tracking) open sections so dwell includes the current one
      this.active.forEach((_v, k) => { this.closeSection(k, now); });
      this.sendVitals();

      if (this.dwell.size) {
        const parts: string[] = []; let top = ''; let topMs = 0;
        this.dwell.forEach((ms, k) => {
          if (ms < 500) return;
          parts.push(`${k}:${Math.round(ms / 100) / 10}`);
          if (ms > topMs) { topMs = ms; top = k; }
        });
        this.dwell.clear();
        if (parts.length) this.track('section_dwell', { dwell_seconds: truncate(parts.join(','), 100), top_section: top }, true);
      }
      if (this.engagedMs >= 250 || this.interactions) {
        this.track('engagement', {
          engagement_time_msec: Math.round(this.engagedMs), max_scroll_percent: this.maxScroll,
          sections_seen: this.seen.size, sections_list: truncate([...this.seen].join(','), 100),
          interactions: this.interactions,
        }, true);
        this.engagedMs = 0; this.interactions = 0;
      }
      this.flush();
    } catch { /* ignore */ }
  }

  private sendVitals() {
    if (this.vitalsSent) return;
    const readings = this.vitals.read();
    if (!readings.length) return;
    this.vitalsSent = true;
    for (const r of readings) {
      this.track('web_vitals', {
        metric_name: r.name, metric_value: r.value, metric_rating: r.rating,
        navigation_type: this.vitals.navigationType, device_class: deviceClass(),
      }, true);
    }
  }

  private jsError(message: string, source: string, line: number) {
    try {
      if (++this.errors > MAX_ERRORS) return;
      this.track('js_error', {
        error_message: truncate(message, 100), error_source: basename(source), error_line: line || undefined,
        page_path: location.pathname,
      });
    } catch { /* ignore */ }
  }
}
