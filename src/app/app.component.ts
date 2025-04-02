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
    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.languageService.initLanguage()
    this.titleService.setTitle("Chirag Jain | Frontend Developer");
    this.metaService.addTags([
      { name: 'keywords', content: 'Frontend, software, developer' },
      { name: 'description', content: 'Software Engineer with 6+ years of expertise in Angular development, dedicated to crafting engaging, accessible digital experiences with proven success scaling products and teams.' },
    ]);
    AOS.init();
  }
}
