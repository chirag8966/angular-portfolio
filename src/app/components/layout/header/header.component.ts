import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, HostListener, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { LanguageService } from 'src/app/services/language/language.service';

interface Language {
  code: string;
  name: string;
  flag: string;
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
  animations: [
    trigger("animateMenu", [
      transition(":enter", [
        query("*", [
          style({ opacity: 0, transform: "translateY(-50%)" }),
          stagger(50, [
            animate(
              "250ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({ opacity: 1, transform: "none" }))
          ])
        ])
      ])
    ])
  ]
})

export class HeaderComponent implements OnInit {

  responsiveMenuVisible: Boolean = false;
  pageYPosition: number;
  languageFormControl: UntypedFormControl = new UntypedFormControl();
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
      flag: 'https://www.worldometers.info/img/flags/sp-flag.gif',
      alt: 'Español'
    },
    {
      code: 'en',
      name: 'English',
      flag: 'https://www.worldometers.info/img/flags/us-flag.gif',
      alt: 'English'
    },
    {
      code: 'ar',
      name: 'العربية',
      flag: 'https://www.worldometers.info/img/flags/sa-flag.gif',
      alt: 'العربية'
    }
  ];
  currentLanguage: Language;

  constructor(
    private router: Router,
    public analyticsService: AnalyticsService,
    public languageService: LanguageService
  ) { }

  ngOnInit(): void {
    this.languageFormControl.valueChanges.subscribe(val => this.languageService.changeLanguage(val))
    this.languageFormControl.setValue(this.languageService.language);
    this.currentLanguage = this.getCurrentLanguage();
  }

  scroll(el: string) {
    if (!el) return;
    if (document.getElementById(el)) {
      document.getElementById(el).scrollIntoView({ behavior: 'smooth' });
    } else {
      this.router.navigate(['/home']).then(() => document.getElementById(el).scrollIntoView({ behavior: 'smooth' }));
    }
    this.responsiveMenuVisible = false;
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
    let url = window.location.href;

    // Open a new window with the CV
    window.open(url + "/../assets/cv/resume.pdf", "_blank");

  }

  @HostListener('window:scroll', ['getScrollPosition($event)'])
  getScrollPosition(event) {
    this.pageYPosition = window.scrollY;
  }

  changeLanguage(language: string) {
    this.languageFormControl.setValue(language);
    this.currentLanguage = this.getCurrentLanguage();
  }

  getCurrentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.languageFormControl.value) || this.languages[0];
  }

  logoClickHandler() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
