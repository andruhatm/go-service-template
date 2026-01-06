import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {
  KpiDialogComponent,
  MetricCatalogComponent,
  MetricDialogComponent,
  DeleteConfirmDialogComponent
} from './pages/metric-catalog/metric-catalog.component';
import {MatTableModule} from "@angular/material/table";
import {AddkpiComponent} from './pages/addkpi/addkpi.component';
import {CatalogPage} from "./pages/catalog/main.page";
import {CatalogRoutingModule} from "./catalog-routing.module";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {MatCardModule} from "@angular/material/card";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatSelectModule} from "@angular/material/select";

@NgModule({
  declarations: [
    MetricCatalogComponent, 
    AddkpiComponent, 
    CatalogPage, 
    KpiDialogComponent,
    MetricDialogComponent,
    DeleteConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MatTableModule,
    CatalogRoutingModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatSelectModule
  ],
  exports: [KpiDialogComponent]
})
export class CatalogModule {
}
