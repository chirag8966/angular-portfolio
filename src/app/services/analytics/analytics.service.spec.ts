import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  function create(platform: 'browser' | 'server') {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(AnalyticsService);
  }

  it('should be created in the browser', () => {
    expect(create('browser')).toBeTruthy();
  });

  it('is inert on the server (no gtag, no dataLayer writes)', () => {
    const before = (window as any).gtag;
    const service = create('server');
    expect(() => service.sendAnalyticEvent('a', 'b', 'c')).not.toThrow();
    expect(() => service.sendAnalyticPageView('/x', 'x')).not.toThrow();
    expect((window as any).gtag).toBe(before);
  });

  it('never throws when called before gtag is loaded', () => {
    const service = create('browser');
    expect(() => service.sendAnalyticEvent('click_x', 'menu', 'click')).not.toThrow();
  });
});
