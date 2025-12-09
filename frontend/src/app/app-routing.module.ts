import {NotFoundPage} from "./routed/shared/pages/not-found-page/not-found-.page";
import {HomePage} from "./routed/shared/pages/home-page/home.page";
import {ExtraOptions, RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";

const routerOptions: ExtraOptions = {
  onSameUrlNavigation: 'reload',
};

const routes: Routes = [
  {
    path: 'catalog',
    loadChildren: () => import('./routed/catalog/catalog.module').then((m) => m.CatalogModule)
  },
  {
    path: 'inventory',
    loadChildren: () => import('./routed/feed/feed.module').then((m) => m.FeedModule)
  },
  {
    path: 'anomaly',
    loadChildren: () => import('./routed/anomaly/anomaly.module').then((m) => m.AnomalyModule)
  },
  {
    path: 'ems',
    loadChildren: () => import('./routed/events/events.module').then((m) => m.EventsModule)
  },
  {
    path: 'reports',
    loadChildren: () => import('./routed/report/report.module').then((m) => m.ReportModule)
  },
  {
    path: 'about',
    component: HomePage
  },
  {
    path: '**',
    component: NotFoundPage
  }
];
@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
