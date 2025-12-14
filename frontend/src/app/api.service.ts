import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  getAdminData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin`);
  }

  getOperatorData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/operator`);
  }

  getMonitoringData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/monitoring`);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }
}
