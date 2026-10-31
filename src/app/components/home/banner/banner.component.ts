import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class BannerComponent {
  analyticsService = inject(AnalyticsService);
}
