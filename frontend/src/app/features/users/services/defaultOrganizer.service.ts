import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DefaultOrganizer } from '../models/default-organizer.model';

@Injectable({
  providedIn: 'root'
})
export class DefaultOrganizerService {
  getDefaultOrganizer(): Observable<DefaultOrganizer> {
    return of({
      //поменять id на настоящий
      defaultOrganizerId: '123',
      defaultOrganizerName: 'SmartEvent bot',
    });
  }
}
