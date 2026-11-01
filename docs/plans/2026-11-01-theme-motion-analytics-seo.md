# Plan: theme switcher, motion graphics, analytics journey, SEO/vitals, dependencies

Branch: `claude/website-theme-performance-4lf9tr` (single branch, single PR)

## Intent
Make the portfolio more engaging (retention) without changing how it works today:
- Theme switcher; **dark (current) stays the default**, light is opt-in. Choice persisted, no flash on load, works with prerendering.
- Motion graphics matching the existing navy/teal "terminal" feel.
- Robust GA4 user-journey tracking that never touches LCP/INP.
- Full SEO + Core Web Vitals pass; keep Lighthouse at/near 100.
- Dependency update where safe (Angular 18 stays on 18.x unless a major is clearly safe).
- Existing behaviour (i18n en/es/ar, RTL, SSG prerender, PWA, DX-Ball, DOM structure) stays intact.

## Assessment of `Barty-Bart/motion-graphics`
Cloned and read. It is six *video-production* skills (motion-broll, object-separation, explainer-high-energy/default/engaging, sound-effects) that render MP4 via headless capture + ffmpeg. None ship runtime web code, and adding any of them to the site would mean shipping video (hurts LCP/retention). Decision: **do not embed**. We borrow the *design language* of `explainer-high-energy` and implement it in ~3 kB of CSS + one tiny canvas:
- accent mark -> line -> flood (shape carries the eye): hero underline/line draw
- kinetic title: masked letter reveal on a stepped 1/8-beat grid, small overshoot (cubic-bezier .34,1.56,.64,1)
- HUD viewfinder: corner brackets + mono labels (`SCENE 02/05`) as section chrome
- subtle vignette/grain, restrained accent use

## Architecture
1. **Theme**: SCSS vars in `variables.scss` become CSS custom properties (`--navy`, ...) defined on `:root` (dark) and `:root[data-theme="light"]`. `ThemeService` (localStorage `theme`, `prefers-color-scheme` is NOT used to override the default: default is dark). Inline script in `index.html` sets `data-theme` before paint. Toggle button in header (a11y: `aria-pressed`, label). Updates `meta[name=theme-color]` and `color-scheme`.
2. **Motion**: standalone `HeroMotionComponent` (canvas particle/constellation field, theme-aware via CSS vars, paused off-screen/hidden tab, disabled for `prefers-reduced-motion`, DPR-capped, lazy-started after first paint) + CSS reveal utilities. No new runtime deps.
3. **Analytics**: `AnalyticsService` keeps its public API. Adds: SPA page_view on router, session/journey id, scroll-depth milestones (25/50/75/90), section_view via IntersectionObserver, engaged time, outbound/mailto/tel/download clicks via one delegated listener, theme/language change events, web-vitals (LCP/CLS/INP/FCP/TTFB) from PerformanceObserver, error tracking, batching, `transport_type: beacon`, all started after idle. Consent-friendly: respects Do-Not-Track/GPC.
4. **SEO/vitals**: audit with Lighthouse; fix meta, structured data, sitemap/robots, headings, alt, contrast in BOTH themes, cache headers, preconnect, budgets.
5. **Deps**: `npm update` within semver range (Angular 18.2.14/21, CLI 18.2.21 ...), remove unused, `npm audit` review. Major bumps only if build + tests stay green.

## Execution (max 4 agents)
| # | Agent | Model | Work |
|---|-------|-------|------|
| 1 | hygiene | haiku | Wave 0: deps update. Wave 3: SEO/vitals audit fixes |
| 2 | theme+motion | sonnet | Wave 1: theme system. Wave 2: motion graphics |
| 3 | analytics | sonnet | Wave 1: journey tracking |
| 4 | reviewer | opus | Final review loop (bounded to 3 rounds) |

Waves: 0 deps -> 1 theme || analytics (disjoint files) -> 2 motion -> 3 SEO/vitals -> 4 review loop -> PR + preview.
Every agent builds into its own `--output-path /tmp/dist-<name>` and must not commit; the orchestrator commits.

## Done criteria
- `ng build --configuration production` and `ng test --watch=false --browsers=ChromeHeadless` pass
- Lighthouse (mobile) Performance/Accessibility/Best-Practices/SEO >= 95 in dark AND light
- Default theme dark; light toggles, persists, no flash
- Review loop ends with no blocking findings (max 3 rounds)
