import {RouterModule, Routes} from "@angular/router";
import {AddEventPage} from "../events/pages/add-event/add-event.page";
import {NgModule} from "@angular/core";
import {CatalogPage} from "./pages/catalog/main.page";

const routes: Routes = [
  {
    path: '',
    component: CatalogPage,
  },
  {
    path: 'add-kpi',
    component: AddEventPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CatalogRoutingModule {}
