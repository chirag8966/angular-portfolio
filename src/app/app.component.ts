import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { LanguageService } from "src/app/services/language/language.service";
import { SeoService } from './services/seo/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'chiragjain-portfolio';

  constructor(
    private seo: SeoService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
  }

  ngOnInit(): void {
    this.languageService.initLanguage();

    this.seo.init();

    if (isPlatformBrowser(this.platformId)) {
      // scroll-reveal library is browser-only and not needed for first paint
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const initAos = () => import('aos').then(({ default: AOS }) => AOS.init({ once: true, disable: prefersReducedMotion, duration: 800 }));
      // after first paint & hydration, when the main thread is free
      'requestIdleCallback' in window ? (window as any).requestIdleCallback(initAos, { timeout: 1500 }) : setTimeout(initAos, 300);
    }
  }
}
