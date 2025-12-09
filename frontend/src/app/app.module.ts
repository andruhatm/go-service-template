import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { CurrentUserModule } from './features/current-user/current-user.module';
import { SharedModule } from './routed/shared/shared.module';
import { CoreModule } from './core/core.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { FeedModule } from './routed/feed/feed.module';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { DialogModule } from './routed/dialog/dialog.module';

import { MatButtonModule } from '@angular/material/button';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import {KpiDialogComponent} from "./routed/catalog/pages/metric-catalog/metric-catalog.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {RouterModule} from "@angular/router";
import { NgOptimizedImage } from '@angular/common';
// import {KpiDialogComponent} from './routed/catalog/pages/kpidialog/dialog.component';


// export const config: CloudinaryConfiguration = cloudinaryConfiguration;

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NgxSliderModule,
    AppRoutingModule,
    MatFormFieldModule,
    RouterModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    FeedModule,
    CurrentUserModule,
    CoreModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMaterialTimepickerModule,
    FormsModule,
    MatInputModule,
    DialogModule,
    MatButtonModule,
    NgOptimizedImage
  ],
  providers: [],
  bootstrap: [AppComponent]
  // entryComponents: [DialogComponent, DialogLimitationsPremComponent],
})
export class AppModule {}
