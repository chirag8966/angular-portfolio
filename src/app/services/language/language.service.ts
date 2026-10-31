import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'es' | 'en' | 'ar';
const SUPPORTED: Language[] = ['en', 'es', 'ar'];
const STORAGE_KEY = 'lang';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  language: Language = 'en';
  private readonly isBrowser: boolean;

  constructor(
    public translateService: TranslateService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * The prerendered (crawlable) HTML is always English. In the browser we switch to the
   * visitor's saved or preferred language. The URL is intentionally left untouched so the
   * canonical address stays https://chiragjain.pro/.
   */
  initLanguage() {
    this.translateService.addLangs(SUPPORTED);
    this.apply(this.isBrowser ? this.detect() : 'en');
  }

  changeLanguage(language: Language) {
    this.apply(language);
    if (this.isBrowser) {
      try { localStorage.setItem(STORAGE_KEY, language); } catch { /* storage unavailable */ }
    }
  }

  private detect(): Language {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch { /* storage unavailable */ }
    const preferred = (navigator.language || 'en').toLowerCase().split('-')[0] as Language;
    return SUPPORTED.includes(preferred) ? preferred : 'en';
  }

  private apply(language: Language) {
    this.language = language;
    this.translateService.use(language);
    this.document.documentElement.lang = language;
  }
}
