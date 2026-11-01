import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';

/**
 * Decorative canvas field behind the banner. Skipped on the server and for users who prefer
 * reduced motion / save-data / low-end devices. The canvas engine is a lazy chunk started
 * after first paint, outside the Angular zone, so it can never delay LCP.
 */
@Component({
  selector: 'app-hero-motion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<canvas #field aria-hidden="true"></canvas>',
  styles: [`
    :host { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; display: block; }
    /* soft vignette keeps the centre calm and the edges deep; token driven so it works in both themes */
    :host::after { content: ""; position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(var(--navy-rgb), 0.55) 100%); }
    canvas { display: block; width: 100%; height: 100%; opacity: 0; transition: opacity 1.2s ease; }
    :host(.on) canvas { opacity: 1; }
  `],
})
export class HeroMotionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('field', { static: true }) field!: ElementRef<HTMLCanvasElement>;
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private stop?: () => void;
  private cancelled = false;
  private timer?: number;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.allowed()) { return; }
    this.zone.runOutsideAngular(() => {
      // after first paint, then when the main thread is idle
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const start = () => this.boot();
        const w = window as any;
        this.timer = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 800);
      }));
    });
  }

  private allowed(): boolean {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return false; }
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) { return false; }
    if ((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2) { return false; }
    return true;
  }

  private async boot(): Promise<void> {
    if (this.cancelled) { return; }
    const { startField } = await import('./hero-motion.engine');
    if (this.cancelled) { return; }
    const handle = startField(this.host.nativeElement, this.field.nativeElement);
    this.stop = () => handle.destroy();
    this.host.nativeElement.classList.add('on');
  }

  ngOnDestroy(): void {
    this.cancelled = true;
    if (this.timer) { (window as any).cancelIdleCallback?.(this.timer); clearTimeout(this.timer); }
    this.stop?.();
  }
}
