import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {ExistingEvent} from "../events/models/existing-event.model";
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {EventsService} from "../events/services/events.service";

@Injectable({ providedIn: "root"})
export class EventResolver implements Resolve<ExistingEvent>{
  constructor(private readonly eventService: EventsService) {}
  resolve(route: ActivatedRouteSnapshot): Observable<ExistingEvent> | Promise<ExistingEvent> | ExistingEvent {
    return this.eventService.getEvent(route.params['id']);
  }

}
