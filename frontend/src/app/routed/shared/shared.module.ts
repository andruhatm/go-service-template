import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { HomePage } from './pages/home-page/home.page';
import { AboutPage } from './pages/about-page/about.page';
import { NotFoundPage } from './pages/not-found-page/not-found-.page';

@NgModule({
  declarations: [ HomePage, AboutPage, NotFoundPage],
  imports: [CommonModule, MatListModule],
  exports: []
})
export class SharedModule {}
