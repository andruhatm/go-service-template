import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ReportRoutingModule} from './report-routing.module';
import { ReportpageComponent } from './pages/reportpage/reportpage.component';
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatIconModule} from "@angular/material/icon";

@NgModule({
  declarations: [ReportpageComponent],
  imports: [
    ReportRoutingModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
  ]
})
export class ReportModule { }
