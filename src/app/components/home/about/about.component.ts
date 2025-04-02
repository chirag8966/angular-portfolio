import { Component } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { customOptions } from 'src/environments/common.environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {

  customOptions: OwlOptions = customOptions;
  ownImages = [
    "../assets/images/me.jpg",
    "../assets/images/setup.jpg",
    "../assets/images/me2.png",
  ]

  constructor(
    public analyticsService: AnalyticsService
  ) { }

} 
