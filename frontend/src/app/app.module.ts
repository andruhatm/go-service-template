import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { CurrentUserModule } from './features/current-user/current-user.module';
import { SharedModule } from './routed/shared/shared.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FeedModule } from './routed/feed/feed.module';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { DialogModule } from './routed/dialog/dialog.module';

import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from "@angular/material/form-field";
import {RouterModule} from "@angular/router";
import { NgOptimizedImage } from '@angular/common';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular'
import { initializeKeycloak } from './keycloak-init';
import { TOKEN_INTERCEPTOR } from './core/auth/token.interceptor';

// export const config: CloudinaryConfiguration = cloudinaryConfiguration;

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatFormFieldModule,
    RouterModule,
    BrowserAnimationsModule,
    SharedModule,
    KeycloakAngularModule,
    HttpClientModule,
    FeedModule,
    CurrentUserModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatInputModule,
    DialogModule,
    MatButtonModule,
    NgOptimizedImage
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
    KeycloakService,
    TOKEN_INTERCEPTOR,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
