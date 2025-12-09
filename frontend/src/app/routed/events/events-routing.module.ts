import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventsPage } from './pages/events/events.page';
import { AddEventPage } from './pages/add-event/add-event.page';

const routes: Routes = [
  {
    path: 'ems-list',
    component: EventsPage,
  },
  {
    path: 'add-ems',
    component: AddEventPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventsRoutingModule {}
