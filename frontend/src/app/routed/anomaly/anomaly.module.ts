import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {AgChartsAngularModule} from "ag-charts-angular";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {MatFormFieldModule} from "@angular/material/form-field";
import {ReactiveFormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {NgxMaterialTimepickerModule} from "ngx-material-timepicker";
import {MatIconModule} from "@angular/material/icon";
import {AnomalypageComponent} from "./pages/anomalylistpage/anomalypage.component";
import {AnomalyListComponent} from "./components/anomaly-list/anomaly-list.component";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatTableModule} from "@angular/material/table";
import {AnomalyRoutingModule} from "./anomaly-routing.module";
import {MatSortModule} from "@angular/material/sort";
import {ForecastDialogComponent} from "./components/add-forecast-req/forecast-dialog.component";
import {MatDialogModule} from "@angular/material/dialog";

@NgModule({
  declarations: [AnomalypageComponent, AnomalyListComponent, ForecastDialogComponent],
  imports: [
    AnomalyRoutingModule,
    CommonModule,
    AgChartsAngularModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    NgxMaterialTimepickerModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
  ],
  exports: [AnomalypageComponent,AnomalyListComponent,ForecastDialogComponent]
})
export class AnomalyModule { }
