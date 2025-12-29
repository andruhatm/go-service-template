import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminPanelRoutingModule } from './admin-panel-routing.module';
import { AdminPanelPage } from './pages/admin-panel/admin-panel.page';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@NgModule({
  declarations: [AdminPanelPage],
  imports: [
    CommonModule,
    AdminPanelRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule
  ]
})
export class AdminPanelModule {}



