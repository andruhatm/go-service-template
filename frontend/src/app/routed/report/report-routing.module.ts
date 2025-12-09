import {RouterModule, Routes} from "@angular/router";
import {AddEventPage} from "../events/pages/add-event/add-event.page";
import {NgModule} from "@angular/core";
import {ReportpageComponent} from "./pages/reportpage/reportpage.component";


const routes: Routes = [
  {
    path: '',
    component: ReportpageComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule {}
