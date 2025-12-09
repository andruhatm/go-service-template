import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Anomaly, CreateAnomaly, ListAnomalyResp} from "../../other-model/anomalies.model";
import {catchError, map} from "rxjs/operators";
import {BehaviorSubject, throwError} from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class AnomalyService {
  constructor(private http: HttpClient) {
  }

  private anomaliesSubject = new BehaviorSubject<Anomaly[]>([]);
  anomalies$ = this.anomaliesSubject.asObservable();

  getAnomalies() {
    return this.http.get<ListAnomalyResp[]>(`http://localhost:8080/anomaly-list`)
      .pipe(
        catchError((err) => {
          console.log('error caught in service');
          console.error(err);
          return throwError(err);
        }),
        map(anomalies => anomalies.map(AnomalyService.transformAnomaly))
      )
      .subscribe(anomalies => this.anomaliesSubject
        .next(anomalies));
  }

  putAnomalyForecast(data: CreateAnomaly) {
    return this.http.post<CreateAnomaly>(`http://localhost:8080/anomaly`,data).pipe(
      catchError((err) => {
        console.log('error caught in service');
        console.error(err);
        return throwError(err);
      })
    ).subscribe(() => this.getAnomalies());
  }

  private static transformAnomaly(anomaly: ListAnomalyResp): Anomaly {
    const t = new Date(anomaly.dateAdded * 1000)
    return {
      ...anomaly,
      dateAdded: t.toLocaleDateString(), // Convert Unix timestamp to readable date
      calculatedDate: anomaly.calculatedDate ?
        t.toLocaleDateString() + " " + t.toLocaleTimeString() :
        'Calculation' // Provide custom text if calculatedDate is null
    };
  }
}
