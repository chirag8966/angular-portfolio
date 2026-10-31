import { provideHttpClient, withFetch } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { GeneralModule } from './components/layout/general.module';
import { HomeModule } from './components/home/home.module';
import { LazyTranslateLoader } from './services/language/translate-loader';

@NgModule({
  declarations: [
    AppComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    HomeModule,
    GeneralModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // don't compete with first paint / LCP for bandwidth
      registrationStrategy: 'registerWhenStable:30000',
    }),
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: { provide: TranslateLoader, useClass: LazyTranslateLoader },
    }),
  ],
  providers: [
    provideHttpClient(withFetch()),
    // the page is prerendered at build time; hydration reuses that DOM instead of re-creating it
    provideClientHydration(),
  ]
})
export class AppModule { }
