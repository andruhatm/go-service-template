import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {AnomalyListComponent} from "./components/anomaly-list/anomaly-list.component";
import {ForecastDetailComponent} from "./components/forecast-detail/forecast-detail.component";


const routes: Routes = [
  {
    path: '',
    component: AnomalyListComponent,
  },
  {
    path: ':id',
    component: ForecastDetailComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnomalyRoutingModule {}
