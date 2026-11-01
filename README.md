# Chirag Jain | Portfolio

**Live site: [chiragj.pro](https://chiragj.pro)**

Personal portfolio of Chirag Jain, a software engineer who specializes in building solutions for the web and is currently Assistant Vice President at Delta Capita. Built with Angular, prerendered at build time for SEO and fast first paint, and deployed to AWS S3 + CloudFront.

## ✨ Highlights

- **Prerendered (SSG) + hydration**: full HTML for search engines and link previews, then a fully interactive Angular app
- **SEO**: canonical URL, Open Graph / Twitter cards, schema.org JSON-LD (`Person`, `WebSite`, `ProfilePage`), `robots.txt`, `sitemap.xml`
- **Core Web Vitals**: ~100 kB initial JS (gzip), CLS 0 (preloaded fonts with metric-matched fallbacks), WebP images with `srcset`, lazy-loaded sections
- **Multilingual**: English, Spanish and Arabic (English bundled; other languages loaded on demand)
- **Accessible**: semantic headings, keyboard-navigable tabs and menus, skip link, reduced-motion support
- **Always up to date**: years of experience are calculated automatically
- Project showcase, experience timeline, resume download and a small DX-Ball canvas game

## 🛠️ Tech Stack

- Angular 18 (SSG prerendering, hydration, standalone components)
- TypeScript, RxJS, SCSS
- Bootstrap 4 (grid and utilities only)
- ngx-translate
- AOS (scroll animations, loaded when idle)
- Google Analytics (gtag, loaded after page load)
- Angular service worker (PWA)
- GitHub Actions → AWS S3 + CloudFront

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── games/dx-ball/        # lazy-loaded canvas game
│   │   ├── home/                 # banner, about, jobs, projects, contact
│   │   ├── layout/               # header, footer
│   │   └── shared/               # gallery, icons
│   ├── services/
│   │   ├── analytics/
│   │   ├── language/             # language detection + translation loader
│   │   └── seo/                  # meta tags, Open Graph, JSON-LD
│   ├── shared/experience.ts      # years-of-experience pipe
│   ├── app.module.ts
│   └── app.server.module.ts      # used for build-time prerendering
├── assets/                       # i18n, images, fonts, icons, resume
├── robots.txt
└── sitemap.xml
```

## 🚀 Getting Started

```bash
git clone https://github.com/chirag8966/angular-portfolio.git
cd angular-portfolio
npm install
npm start            # http://localhost:4200
```

### Production build

```bash
npm run build-portfolio
```

Output (including the prerendered `index.html`) is written to `dist/chiragjain-portfolio/browser`.

## 🚢 Deployment

Every push to `main` runs `.github/workflows/deploy to s3.yaml`:

1. builds the production bundle,
2. syncs hashed assets to S3 with long-lived caching,
3. uploads `index.html`, translations, `robots.txt`, `sitemap.xml` and service-worker files with `no-cache`,
4. invalidates the CloudFront cache.

## 🌐 Internationalization

Translations live in `src/assets/i18n/` (`en.json`, `es.json`, `ar.json`). Use the `%YEARS%` token anywhere in the copy to insert the live years-of-experience value.

## 📄 License

MIT. See [LICENSE](LICENSE).
