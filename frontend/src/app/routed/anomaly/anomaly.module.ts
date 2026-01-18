import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatIconModule} from "@angular/material/icon";
import {AnomalypageComponent} from "./pages/anomalylistpage/anomalypage.component";
import {AnomalyListComponent} from "./components/anomaly-list/anomaly-list.component";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatTableModule} from "@angular/material/table";
import {AnomalyRoutingModule} from "./anomaly-routing.module";
import {MatSortModule} from "@angular/material/sort";
import {ForecastDialogComponent} from "./components/add-forecast-req/forecast-dialog.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatChipsModule} from "@angular/material/chips";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatStepperModule} from "@angular/material/stepper";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {ForecastDetailComponent} from "./components/forecast-detail/forecast-detail.component";
import {NgxChartsModule} from "@swimlane/ngx-charts";

@NgModule({
  declarations: [
    AnomalypageComponent,
    AnomalyListComponent,
    ForecastDialogComponent,
    ForecastDetailComponent
  ],
  imports: [
    AnomalyRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatStepperModule,
    MatSnackBarModule,
    NgxChartsModule,
  ],
  exports: [
    AnomalypageComponent,
    AnomalyListComponent,
    ForecastDialogComponent,
    ForecastDetailComponent
  ]
})
export class AnomalyModule { }
