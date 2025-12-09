import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { AuthRoutingModule } from './auth-routing.module';
import { LoginPage } from './pages/login/login.page';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SignUpPage } from './pages/sign-up/sign-up.page';
import { InfoDialogComponent } from './components/info-dialog/info-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ValidationModule } from '../../features/validators/validation.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {AuthRoutingModule} from "./auth-routing.module";

@NgModule({
  declarations: [LoginPage, SignUpPage, InfoDialogComponent],
    imports: [
        CommonModule,
        AuthRoutingModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        ValidationModule,
        MatButtonToggleModule,
        MatRadioModule,
        MatAutocompleteModule
    ]
})
export class AuthModule {}
