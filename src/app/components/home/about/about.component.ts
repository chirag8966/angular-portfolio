import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  ownImages = [
    'assets/images/me.webp',
    'assets/images/setup.webp',
    'assets/images/me2.webp',
  ];
}
