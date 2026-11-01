import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';
const STORAGE_KEY = 'theme';
const META_COLOR: Record<Theme, string> = { dark: '#0a192f', light: '#f7f5f0' };

/**
 * Dark is the default (and what is prerendered). Light is opt-in and persisted.
 * prefers-color-scheme is deliberately NOT followed. The inline script in index.html applies the
 * saved theme before first paint; this service picks it up and keeps everything in sync.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser: boolean;
  private readonly subject = new BehaviorSubject<Theme>('dark');
  readonly theme$ = this.subject.asObservable();
  private fadeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const current = this.document.documentElement.dataset['theme'];
      this.subject.next(current === 'light' ? 'light' : this.readStored());
      this.apply(this.subject.value);
    }
  }

  get theme(): Theme { return this.subject.value; }

  toggle(): void { this.set(this.theme === 'dark' ? 'light' : 'dark'); }

  set(theme: Theme): void {
    if (!this.isBrowser || theme === this.theme) { return; }
    // enable colour transitions only for this user-initiated change
    const root = this.document.documentElement;
    root.classList.add('theme-transition');
    clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => root.classList.remove('theme-transition'), 400);
    this.apply(theme);
    this.subject.next(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
    // theme_change analytics is emitted by AnalyticsService (it observes html[data-theme]), so no call here.
  }

  private readStored(): Theme {
    try { return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  }

  private apply(theme: Theme): void {
    const doc = this.document;
    doc.documentElement.dataset['theme'] = theme;
    doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme]);
    doc.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  }
}
