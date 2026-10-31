import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void; }
}

/**
 * Minimal Google Analytics (gtag.js) integration.
 * The tag is injected only in the browser and only once the page has finished loading
 * and the main thread is idle, so it never competes with LCP / INP.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser && environment.trackAnalyticID) {
      this.init(environment.trackAnalyticID);
    }
  }

  sendAnalyticEvent(action: string, category: string, label?: string) {
    this.gtag('event', action, { event_category: category, event_label: label });
  }

  sendAnalyticPageView(path: string, title: string) {
    this.gtag('event', 'page_view', { page_path: path, page_title: title });
  }

  private gtag(...args: unknown[]) {
    if (this.isBrowser) {
      window.gtag?.(...args);
    }
  }

  private init(id: string) {
    window.dataLayer = window.dataLayer || [];
    // gtag.js expects the real `arguments` object, so this must stay a classic function
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);

    const load = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);
    };
    const whenIdle = () => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 2000));
    if (document.readyState === 'complete') {
      whenIdle();
    } else {
      window.addEventListener('load', whenIdle, { once: true });
    }
  }
}
