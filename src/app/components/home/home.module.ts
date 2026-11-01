import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GalleryComponent } from '../shared/gallery/gallery.component';
import { HeroMotionComponent } from '../shared/hero-motion/hero-motion.component';
import { IconComponent } from '../shared/icon/icon.component';
import { YearsPipe } from '../../shared/experience';
import { AboutComponent } from './about/about.component';
import { BannerComponent } from './banner/banner.component';
import { ContactComponent } from './contact/contact.component';
import { HomeComponent } from './home.component';
import { JobsComponent } from './jobs/jobs.component';
import { ProjectsComponent } from './projects/projects.component';


@NgModule({
  declarations: [
    HomeComponent,
    BannerComponent,
    AboutComponent,
    JobsComponent,
    ProjectsComponent,
    ContactComponent
  ],
  imports: [
    CommonModule,
    GalleryComponent,
    HeroMotionComponent,
    IconComponent,
    YearsPipe,
    TranslateModule
  ],
  exports: [HomeComponent]
})
export class HomeModule { }
