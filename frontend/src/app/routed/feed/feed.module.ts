import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MainPage } from './pages/main/main.page';
import { FeedComponent } from './components/feed/feed.component';
import { BookRatingComponent } from './components/rating/rating.component';
import { FeedRoutingModule } from './feed-routing.module';
import { MatIconModule } from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';

@NgModule({
  declarations: [MainPage, FeedComponent, BookRatingComponent],
  imports: [
    CommonModule,
    FeedRoutingModule,
    MatIconModule,
    MatTableModule
  ],
  exports: [BookRatingComponent],
  providers: [DatePipe]
})
export class FeedModule {}

