import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { EventCategory } from '../../other-model/category.model';
import { CityModel } from '../../other-model/city.model';
import { ExistingEvent } from '../../events/models/existing-event.model';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<EventCategory[]> {
    return this.http.get<EventCategory[]>(`${environment.api}/category/`).pipe(
      catchError((err) => {
        console.log('error caught in service');
        console.error(err);
        return throwError(err);
      })
    );
  }

  getEvents(): Observable<ExistingEvent[]> {
    return this.http.get<ExistingEvent[]>(`${environment.api}/event/`).pipe(
      catchError((err) => {
        console.log('error caught in service');
        console.error(err);
        return throwError(err);
      })
    );
  }

  getCities(countryId: string, charCity: string): Observable<CityModel[]> {
    let data: CityModel;
    // если ничего не получили в качестве символа то запрос вернет только важные города
    if (charCity === null) {
      data = {};
    } else {
      data = {
        titleRu: charCity
      };
    }
    return this.http.post<CityModel[]>(`${environment.api}/countries/${countryId}/cities`, data).pipe(
      catchError((err) => {
        console.log('error caught in service');
        console.error(err);
        return throwError(err);
      })
    );
  }

  //post anomaly
}
