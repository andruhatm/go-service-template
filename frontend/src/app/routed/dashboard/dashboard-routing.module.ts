import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DashboardPage } from './pages/dashboard/dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}

