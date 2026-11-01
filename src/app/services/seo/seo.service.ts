import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CAREER_START, yearsOfExperience } from 'src/app/shared/experience';

export const SITE = {
  url: 'https://chiragj.pro/',
  name: 'Chirag Jain',
  jobTitle: 'Assistant Vice President',
  employer: 'Delta Capita',
  employerUrl: 'https://www.deltacapita.com/',
  image: 'https://chiragj.pro/assets/images/og-image.jpg',
  photo: 'https://chiragj.pro/assets/images/me.webp',
  email: 'chirag8966@gmail.com',
  github: 'https://github.com/chirag8966',
  linkedin: 'https://www.linkedin.com/in/chirag8966/',
};

/**
 * Single source of truth for page metadata. Because the site is prerendered at build time,
 * everything set here is baked into the static HTML that search engines and social-preview
 * crawlers (LinkedIn, WhatsApp, Slack, X, Facebook…) read without running JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  init(): void {
    const years = yearsOfExperience();
    // SERP-friendly lengths: title ~55 chars (<= 60), description ~140 chars (<= 160).
    const title = `${SITE.name} | ${SITE.jobTitle} at ${SITE.employer}`;
    const description =
      `${SITE.name}, ${SITE.jobTitle} at ${SITE.employer}: ${years}+ years building fast, accessible ` +
      `web platforms with Angular and TypeScript.`;
    const shareDescription =
      `${SITE.jobTitle} at ${SITE.employer}. ${years}+ years building high-performance web platforms with Angular & TypeScript. ` +
      `See my experience, projects and get in touch.`;

    this.title.setTitle(title);
    this.setName('description', description);
    this.setName('author', SITE.name);
    this.setName('keywords', [
      'Chirag Jain', 'Assistant Vice President', 'Delta Capita', 'Angular developer', 'Frontend engineer',
      'Software engineer', 'TypeScript', 'RxJS', 'NgRx', 'Node.js', 'Solutions engineer', 'Portfolio',
    ].join(', '));
    this.setName('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Open Graph (LinkedIn, Facebook, WhatsApp, Slack, Discord…)
    this.setProperty('og:type', 'profile');
    this.setProperty('og:site_name', SITE.name);
    this.setProperty('og:url', SITE.url);
    this.setProperty('og:title', `${SITE.name} | ${SITE.jobTitle} at ${SITE.employer}`);
    this.setProperty('og:description', shareDescription);
    this.setProperty('og:image', SITE.image);
    this.setProperty('og:image:secure_url', SITE.image);
    this.setProperty('og:image:type', 'image/jpeg');
    this.setProperty('og:image:width', '1200');
    this.setProperty('og:image:height', '630');
    this.setProperty('og:image:alt', `${SITE.name} | ${SITE.jobTitle} at ${SITE.employer}`);
    this.setProperty('og:locale', 'en_US');
    this.setProperty('profile:first_name', 'Chirag');
    this.setProperty('profile:last_name', 'Jain');

    // X / Twitter
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', `${SITE.name} | ${SITE.jobTitle} at ${SITE.employer}`);
    this.setName('twitter:description', shareDescription);
    this.setName('twitter:image', SITE.image);
    this.setName('twitter:image:alt', `${SITE.name} | ${SITE.jobTitle} at ${SITE.employer}`);

    this.setCanonical(SITE.url);
    this.setJsonLd(years);
  }

  private setName(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string) {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }

  private setCanonical(url: string) {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /** schema.org structured data: enables rich results / knowledge-panel signals in Google. */
  private setJsonLd(years: number) {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': `${SITE.url}#person`,
          name: SITE.name,
          givenName: 'Chirag',
          familyName: 'Jain',
          url: SITE.url,
          image: SITE.photo,
          email: SITE.email,
          jobTitle: SITE.jobTitle,
          description: `Software engineer with ${years}+ years of experience (since ${CAREER_START.getFullYear()}) who specializes in building solutions with Angular and TypeScript.`,
          worksFor: { '@type': 'Organization', name: SITE.employer, url: SITE.employerUrl },
          knowsAbout: ['Angular', 'TypeScript', 'JavaScript', 'RxJS', 'NgRx', 'Node.js', 'NestJS', 'React',
            'Frontend Architecture', 'Web Performance', 'Web Accessibility', 'AWS', 'Solution Design'],
          sameAs: [SITE.github, SITE.linkedin],
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE.url}#website`,
          url: SITE.url,
          name: `${SITE.name} | Portfolio`,
          inLanguage: ['en', 'es', 'ar'],
          publisher: { '@id': `${SITE.url}#person` },
        },
        {
          '@type': 'ProfilePage',
          '@id': `${SITE.url}#profilepage`,
          url: SITE.url,
          name: `${SITE.name} | ${SITE.jobTitle} at ${SITE.employer}`,
          isPartOf: { '@id': `${SITE.url}#website` },
          mainEntity: { '@id': `${SITE.url}#person` },
          dateModified: new Date().toISOString().split('T')[0],
        },
      ],
    };

    const id = 'structured-data';
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(graph);
  }
}
