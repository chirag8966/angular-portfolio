import { ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsComponent {
  active = 0;

  constructor(private host: ElementRef<HTMLElement>) {}

  select(index: number) {
    this.active = index;
  }

  /** Arrow/Home/End keys move between tabs, as per the WAI-ARIA tabs pattern. */
  onTabKeydown(event: KeyboardEvent, count: number) {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next: number;
    if (event.key in keys) next = (this.active + keys[event.key] + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    this.select(next);
    this.host.nativeElement.querySelector<HTMLElement>(`#job-tab-${next}`)?.focus();
  }
}
