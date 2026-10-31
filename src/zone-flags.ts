/**
 * zone.js tuning (must load before zone.js).
 * Angular listens via addEventListener, so patching every `onxxx` DOM property is wasted
 * start-up work; and high-frequency events don't need to trigger app-wide change detection.
 */
(window as any).__Zone_disable_on_property = true;
(window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove', 'touchmove', 'pointermove'];
