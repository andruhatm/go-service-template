import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  KpiDialogComponent,
  MetricCatalogComponent
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

@NgModule({
  declarations: [MetricCatalogComponent, AddkpiComponent, CatalogPage, KpiDialogComponent],
  imports: [
    CommonModule,
    MatTableModule,
    CatalogRoutingModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [KpiDialogComponent]
})
export class CatalogModule {
}
