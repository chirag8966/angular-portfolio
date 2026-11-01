# GA4 event schema

Implemented in `src/app/services/analytics/` (`analytics.service.ts`, `analytics-context.ts`, `analytics-vitals.ts`).
gtag loads only after window `load` + an idle callback, never on the server, and never when
`navigator.doNotTrack === '1'` or `navigator.globalPrivacyControl` is set. `send_page_view:false`, `transport_type:'beacon'`.

## Parameters added to every event
| Param | Notes |
|---|---|
| `journey_id` | random id per tab visit (sessionStorage) |
| `journey_step` | 1-based ordinal of the event within the visit |
| `seconds_since_landing` | int |

## User properties (`gtag('set','user_properties')`)
`visitor_type` (new/returning), `device_class` (mobile <576px / tablet <992px / desktop), `first_source`, `first_medium`, `theme` (from `html[data-theme]`, default dark), `language` (from `html[lang]`). `theme` and `language` are updated live.

## Events
| Event | Params | When |
|---|---|---|
| `page_view` | page_location, page_path, page_title, page_referrer, language, theme, landing_path, first_source, first_medium, first_campaign, referrer_host, visitor_type, device_class, viewport | on init and on every SPA navigation (pushState/replaceState/popstate path change) |
| `section_view` | section_id (banner, about, experience, projects, game, contact), section_order | once per section per visit when it first intersects |
| `section_dwell` | dwell_seconds (`id:sec,...`), top_section | on hide; time with >=50% of section (or half viewport) visible |
| `scroll_depth` | percent_scrolled (25/50/75/90/100), page_path | once each per page |
| `engagement` | engagement_time_msec, max_scroll_percent, sections_seen, sections_list, interactions | on visibilitychange hidden / pagehide (deltas) |
| `click` | click_type (outbound, social, mailto, tel, download, nav, button), link_url (no query, no mail/phone), link_domain, link_text (<=60), click_id (data-track), file_name | delegated document listener |
| `web_vitals` | metric_name (LCP/CLS/INP/FCP/TTFB), metric_value (ms; CLS x1000 integer), metric_rating (good/needs-improvement/poor), navigation_type, device_class | once, on first hide |
| `theme_change` | theme, previous_theme | `html[data-theme]` changes |
| `language_change` | language, previous_language | `html[lang]` changes |
| `js_error` | error_message (<=100), error_source (file basename), error_line, page_path | window error / unhandledrejection, max 5 per page |
| legacy custom events | event_category, event_label | `sendAnalyticEvent(action, category, label)` from templates (e.g. `click_Download_Resume`) |

`sendAnalyticPageView()` is kept for compatibility but is a no-op: page_view is sent automatically.

## Custom dimensions to register (event scope unless noted)
journey_id, journey_step (metric), section_id, top_section, dwell_seconds, percent_scrolled, max_scroll_percent, click_type, link_domain, link_text, metric_name, metric_value (metric), metric_rating, navigation_type, device_class, landing_path, first_source, first_medium, first_campaign, theme, previous_theme, language, previous_language, error_source. User scope: visitor_type, device_class, first_source, first_medium, theme, language.

Note: GA4 enhanced measurement also emits its own `click` (outbound) / `scroll` (90%) / `file_download`; consider disabling those in the stream to avoid overlap with `click` / `scroll_depth`.
