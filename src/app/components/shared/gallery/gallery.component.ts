import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight, dependency-free image gallery built on CSS scroll-snap.
 * Native swipe/drag on touch devices, keyboard accessible prev/next buttons,
 * and every image except the first is lazy loaded.
 */
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gallery" role="group" aria-roledescription="carousel" [attr.aria-label]="label">
      <div class="gallery-track" #track tabindex="0" (scroll)="onScroll()">
        @for (src of images; track src; let i = $index) {
          <img
            class="gallery-slide"
            [src]="src"
            [attr.srcset]="srcset(src)"
            [attr.sizes]="sizes"
            [alt]="label + ' – screenshot ' + (i + 1) + ' of ' + images.length"
            [width]="width"
            [height]="height"
            [attr.loading]="i === 0 && eager ? 'eager' : 'lazy'"
            decoding="async"
          />
        }
      </div>
      @if (images.length > 1) {
        <div class="gallery-controls">
          <button type="button" class="gallery-btn" (click)="go(-1)" aria-label="Previous image">&#8249;</button>
          <div class="gallery-dots" aria-hidden="true">
            @for (src of images; track src; let i = $index) {
              <span class="gallery-dot" [class.active]="i === index"></span>
            }
          </div>
          <button type="button" class="gallery-btn" (click)="go(1)" aria-label="Next image">&#8250;</button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent {
  @Input() images: string[] = [];
  @Input() label = 'Gallery';
  @Input() width = 1280;
  @Input() height = 800;
  @Input() eager = false;
  /** Width of the "-{smallWidth}.webp" variant generated next to each image (0 = none). */
  @Input() smallWidth = 640;
  /** Rendered width hint for the browser's srcset choice. */
  @Input() sizes = '(max-width: 991px) 92vw, 600px';
  @ViewChild('track', { static: true }) track: ElementRef<HTMLElement>;

  index = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  srcset(src: string): string | null {
    if (!this.smallWidth || !src.endsWith('.webp')) return null;
    return `${src.replace(/\.webp$/, `-${this.smallWidth}.webp`)} ${this.smallWidth}w, ${src} ${this.width}w`;
  }

  onScroll() {
    const el = this.track.nativeElement;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== this.index) {
      this.index = next;
      this.cdr.markForCheck();
    }
  }

  go(direction: number) {
    const el = this.track.nativeElement;
    const target = (this.index + direction + this.images.length) % this.images.length;
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
  }
}
