import {NotFoundPage} from "./routed/shared/pages/not-found-page/not-found-.page";
import {HomePage} from "./routed/shared/pages/home-page/home.page";
import {ExtraOptions, RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import { KeycloakPage } from './routed/shared/pages/keycloak-page/keycloak.page';

const routerOptions: ExtraOptions = {
  onSameUrlNavigation: 'reload',
};

export const routes: Routes = [
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
    path: 'admin-panel',
    loadChildren: () => import('./routed/admin-panel/admin-panel.module').then((m) => m.AdminPanelModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./routed/dashboard/dashboard.module').then((m) => m.DashboardModule)
  },
  {
    path: 'about',
    component: HomePage
  },
  {
    path: 'keycloak',
    component: KeycloakPage
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
