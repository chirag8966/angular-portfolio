import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameAnchor', { static: true, read: ViewContainerRef }) gameAnchor: ViewContainerRef;
  @ViewChild('gamePlaceholder', { static: true }) gamePlaceholder: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;

  constructor(
    private analyticsService: AnalyticsService,
    private zone: NgZone,
  ) { }

  ngOnInit(): void {
    this.analyticsService.sendAnalyticPageView("/home", "home entered");
  }

  /**
   * The DX-Ball mini game (canvas + game loop) is below the fold, so its code is only
   * downloaded once the placeholder is about to scroll into view.
   */
  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        this.observer?.disconnect();
        this.loadGame();
      }
    }, { rootMargin: '600px 0px' });
    this.observer.observe(this.gamePlaceholder.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private async loadGame() {
    const { DxBallComponent } = await import('../games/dx-ball/dx-ball.component');
    this.zone.run(() => {
      this.gameAnchor.createComponent(DxBallComponent);
      this.gamePlaceholder.nativeElement.remove();
    });
  }
}
