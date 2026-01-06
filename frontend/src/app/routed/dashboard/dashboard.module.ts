import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { DashboardService } from './services/dashboard.service';
import { AddWidgetDialogComponent } from './components/add-widget-dialog/add-widget-dialog.component';
import { ChartWidgetComponent } from './components/chart-widget/chart-widget.component';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';

// NGX Charts
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  declarations: [
    DashboardPage,
    AddWidgetDialogComponent,
    ChartWidgetComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatTooltipModule,
    NgxChartsModule
  ],
  providers: [
    DashboardService
  ],
  exports: [
    DashboardPage
  ]
})
export class DashboardModule { }
