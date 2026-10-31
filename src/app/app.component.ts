import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import * as AOS from 'aos';
import { LanguageService } from "src/app/services/language/language.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'chiragjain-portfolio';

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private languageService: LanguageService
  ) {
  }

  ngOnInit(): void {
    this.languageService.initLanguage();

    // Keep runtime metadata in sync with index.html (single source of truth for the title/description)
    this.titleService.setTitle('Chirag Jain | Assistant Vice President at Delta Capita');
    this.metaService.updateTag({
      name: 'keywords',
      content: 'Chirag Jain, Assistant Vice President, Delta Capita, Angular, Frontend, Software Engineer, TypeScript, RxJS'
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    AOS.init({ once: true, disable: prefersReducedMotion, duration: 800 });
  }
}
