import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPanelPage } from './pages/admin-panel/admin-panel.page';

const routes: Routes = [
  {
    path: '',
    component: AdminPanelPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminPanelRoutingModule {}



