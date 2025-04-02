import { Component, OnInit, AfterViewInit } from '@angular/core';
import { trigger, query, stagger, animate, style, transition } from '@angular/animations'
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';

interface SocialLink {
  icon: string;
  url: string;
  analyticsEvent: string;
  analyticsCategory: string;
  analyticsAction: string;
}

interface Credit {
  text: string;
  url: string;
  analyticsEvent: string;
  analyticsCategory: string;
  analyticsAction: string;
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  animations: [
    trigger("animateFooter", [
      transition(":enter", [
        query("*", [
          style({ opacity: 0, transform: "translateY(100%)" }),
          stagger(50, [
            animate(
              "250ms cubic-bezier(0.35, 0, 0.25, 1)",
              style({ opacity: 1, transform: "none" })
            )
          ])
        ])
      ])
    ])
  ]
})

export class FooterComponent {

  socialLinks: SocialLink[] = [
    {
      icon: 'fab fa-github',
      url: 'https://github.com/chirag8966',
      analyticsEvent: 'click_github',
      analyticsCategory: 'footer',
      analyticsAction: 'github'
    },
    {
      icon: 'fab fa-linkedin-in',
      url: 'https://www.linkedin.com/in/chirag8966/',
      analyticsEvent: 'click_linkedin',
      analyticsCategory: 'footer',
      analyticsAction: 'github'
    }
  ];

  emailLink: SocialLink = {
    icon: '',
    url: 'mailto:chirag8966@gmail.com',
    analyticsEvent: 'click_send_mail',
    analyticsCategory: 'footer',
    analyticsAction: 'email'
  };

  credits: Credit[] = [
    {
      text: 'Built with Angular by Chirag Jain',
      url: 'https://github.com/chirag8966/angular-portfolio',
      analyticsEvent: 'click_github_portfolio_chiragJain',
      analyticsCategory: 'footer',
      analyticsAction: 'click'
    },
    {
      text: 'Designed by Brittany Chiang',
      url: 'https://github.com/bchiang7/v4',
      analyticsEvent: 'click_github_portfolio_brittany',
      analyticsCategory: 'footer',
      analyticsAction: 'click'
    }
  ];

  constructor(
    public analyticsService: AnalyticsService
  ) { }

  handleAnalytics(event: string, category: string, action: string) {
    this.analyticsService.sendAnalyticEvent(event, category, action);
  }
}
