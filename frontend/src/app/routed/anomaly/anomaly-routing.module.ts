import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {AnomalyListComponent} from "./components/anomaly-list/anomaly-list.component";


const routes: Routes = [
  {
    path: '',
    component: AnomalyListComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnomalyRoutingModule {}
