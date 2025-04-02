import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { DxBallModule } from '../games/dx-ball/dx-ball.module';
import { AboutComponent } from './about/about.component';
import { BannerComponent } from './banner/banner.component';
import { ContactComponent } from './contact/contact.component';
import { HomeComponent } from './home.component';
import { JobsComponent } from './jobs/jobs.component';
import { MoreProjectsComponent } from './more-proyects/more-proyects.component';
import { ProjectsComponent } from './projects/projects.component';
import { DxBallComponent } from '../games/dx-ball/dx-ball.component';

export function HttpLoaderFactory(http: HttpClient){
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    HomeComponent,
    BannerComponent,
    AboutComponent,
    JobsComponent,
    ProjectsComponent,
    MoreProjectsComponent,
    ContactComponent
  ],
  imports: [
    CommonModule,
    NgbNavModule,
    CarouselModule,
    DxBallComponent,
    TranslateModule.forChild({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    })
  ]
})
export class HomeModule { }
