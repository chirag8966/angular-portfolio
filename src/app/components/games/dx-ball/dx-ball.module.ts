import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxBallComponent } from './dx-ball.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: DxBallComponent
  }
];

@NgModule({
  imports: [
    DxBallComponent,
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DxBallModule { } 