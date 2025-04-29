import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { customOptions } from 'src/environments/common.environment';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent {

  customOptions: OwlOptions = customOptions
  analyticsService = inject(AnalyticsService);
  @ViewChild('imgContainer') imgContainer: ElementRef;


  debug() {
    this.imgContainer.nativeElement.scroll({
      top: this.imgContainer.nativeElement.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  openImage(url: string) {
    // Open a new window with the image
    let imgUrl = window.location.href;
    window.open(imgUrl + url, "_blank");
  }

}
