import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MainPage } from './pages/main/main.page';
import { FeedComponent } from './components/feed/feed.component';
import { BookRatingComponent } from './components/rating/rating.component';
import { MonObjectDialogComponent } from './components/mon-object-dialog/mon-object-dialog.component';
import { FeedRoutingModule } from './feed-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MonObjectsModule } from '../../features/mon-objects/mon-objects.module';
import { KeycloakAngularModule } from 'keycloak-angular';

@NgModule({
  declarations: [
    MainPage,
    FeedComponent,
    BookRatingComponent,
    MonObjectDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FeedRoutingModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MonObjectsModule,
    KeycloakAngularModule
  ],
  exports: [BookRatingComponent],
  providers: [DatePipe]
})
export class FeedModule {}
