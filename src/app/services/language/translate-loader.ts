import { TranslateLoader } from '@ngx-translate/core';
import { from, Observable, of } from 'rxjs';
import en from '../../../assets/i18n/en.json';

/**
 * - English (the default and the prerendered language) ships inside the main bundle and resolves
 *   synchronously, so the build-time prerender contains the real copy and hydration never blanks it.
 * - Other languages are content-hashed lazy chunks fetched only when a visitor needs them.
 */
export class LazyTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    switch (lang) {
      case 'es': return from(import('../../../assets/i18n/es.json').then(m => m.default));
      case 'ar': return from(import('../../../assets/i18n/ar.json').then(m => m.default));
      default: return of(en);
    }
  }
}
