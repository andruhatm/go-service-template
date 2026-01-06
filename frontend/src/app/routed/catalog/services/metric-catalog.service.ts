import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MetricCatalog {
  id: string;
  name: string;
  unit?: string;
  degradation?: string;
  group?: string;
  threshold_critical?: string;
  threshold_warning?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricCatalogListResponse {
  items: MetricCatalog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GroupsResponse {
  groups: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MetricCatalogService {
  private apiUrl = `${environment.backendUrl}/api/metrics-catalog`;

  constructor(private http: HttpClient) {}

  getMetrics(page: number = 1, pageSize: number = 20, group?: string): Observable<MetricCatalogListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (group) {
      params = params.set('group', group);
    }

    return this.http.get<MetricCatalogListResponse>(this.apiUrl, { params });
  }

  getMetric(id: string): Observable<MetricCatalog> {
    return this.http.get<MetricCatalog>(`${this.apiUrl}/${id}`);
  }

  getGroups(): Observable<GroupsResponse> {
    return this.http.get<GroupsResponse>(`${this.apiUrl}/groups`);
  }

  createMetric(metric: Partial<MetricCatalog>): Observable<MetricCatalog> {
    return this.http.post<MetricCatalog>(this.apiUrl, metric);
  }

  updateMetric(id: string, metric: Partial<MetricCatalog>): Observable<MetricCatalog> {
    return this.http.put<MetricCatalog>(`${this.apiUrl}/${id}`, metric);
  }

  deleteMetric(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

