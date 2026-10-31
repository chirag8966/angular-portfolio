import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, Inject, NgZone, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { Language as LanguageCode, LanguageService } from 'src/app/services/language/language.service';

interface Language {
  code: LanguageCode;
  name: string;
  code2: string;
  alt: string;
}

interface MenuItem {
  number?: string;
  translationKey: string;
  scrollTarget: string;
  analyticsEvent: string;
  isCV?: boolean;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})

export class HeaderComponent implements OnInit {

  responsiveMenuVisible: Boolean = false;
  pageYPosition = 0;
  selectedLang: LanguageCode = 'en';
  langMenuOpen = false;
  @ViewChild('langDropdown') langDropdown?: ElementRef<HTMLElement>;
  cvName: string = "";

  menuItems: MenuItem[] = [
    {
      number: '01.',
      translationKey: 'Header.Item1',
      scrollTarget: 'about',
      analyticsEvent: 'click_about'
    },
    {
      number: '02.',
      translationKey: 'Header.Item2',
      scrollTarget: 'jobs',
      analyticsEvent: 'click_experience'
    },
    {
      number: '03.',
      translationKey: 'Header.Item3',
      scrollTarget: 'proyects',
      analyticsEvent: 'click_jobs'
    },
    {
      number: '04.',
      translationKey: 'Header.Item4',
      scrollTarget: 'contact',
      analyticsEvent: 'click_contact'
    },
    {
      translationKey: 'Header.cvBtn',
      scrollTarget: '',
      analyticsEvent: '',
      isCV: true
    }
  ];

  languages: Language[] = [
    {
      code: 'es',
      name: 'Español',
      code2: 'ES',
      alt: 'Español'
    },
    {
      code: 'en',
      name: 'English',
      code2: 'EN',
      alt: 'English'
    },
    {
      code: 'ar',
      name: 'العربية',
      code2: 'AR',
      alt: 'العربية'
    }
  ];
  currentLanguage: Language;

  constructor(
    public analyticsService: AnalyticsService,
    public languageService: LanguageService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.listenToScroll();
    }
    this.selectedLang = this.languageService.language;
    this.currentLanguage = this.getCurrentLanguage();
  }

  scroll(el: string) {
    if (!el) return;
    document.getElementById(el)?.scrollIntoView({ behavior: 'smooth' });
    this.responsiveMenuVisible = false;
  }

  /** Close the language menu on any click outside it. */
  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null) {
    if (this.langMenuOpen && !this.langDropdown?.nativeElement.contains(target as Node)) {
      this.langMenuOpen = false;
    }
  }

  /** Links keep real hrefs (crawlable, open-in-new-tab works); we just add smooth scrolling + analytics. */
  onMenuClick(event: MouseEvent, item: MenuItem) {
    if (item.analyticsEvent) {
      this.analyticsService.sendAnalyticEvent(item.analyticsEvent, "menu", "click");
    }
    if (item.isCV) {
      this.analyticsService.sendAnalyticEvent("click_Download_Resume", "menu", "download");
      this.responsiveMenuVisible = false;
      return; // let the browser open the PDF
    }
    event.preventDefault();
    this.scroll(item.scrollTarget);
  }

  handleMenuItemClick(item: MenuItem) {
    if (item.analyticsEvent) {
      this.analyticsService.sendAnalyticEvent(item.analyticsEvent, "menu", "click");
    }
    if (item.isCV) {
      this.downloadCV();
    } else {
      this.scroll(item.scrollTarget);
    }
  }

  downloadCV() {
    // base href is "/", so this resolves correctly whatever the current (language) URL is
    window.open("assets/cv/resume.pdf", "_blank", "noopener");

  }

  /** Passive scroll listener outside Angular; change detection runs only when the shadow state flips. */
  private listenToScroll() {
    const onScroll = () => {
      const y = window.scrollY > 0 ? 1 : 0;
      if (y !== this.pageYPosition) {
        this.zone.run(() => { this.pageYPosition = y; this.cdr.markForCheck(); });
      }
    };
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', onScroll, { passive: true }));
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    onScroll();
  }

  changeLanguage(language: LanguageCode) {
    this.selectedLang = language;
    this.languageService.changeLanguage(language);
    this.currentLanguage = this.getCurrentLanguage();
  }

  getCurrentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.selectedLang) || this.languages[0];
  }

  logoClickHandler() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
