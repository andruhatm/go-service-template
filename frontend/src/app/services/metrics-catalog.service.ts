import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MetricCatalog {
  id: string;
  name: string;
  unit?: string;
  degradation?: string;
  group?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsCatalogService {
  private apiUrl = `${environment.api}/metrics-catalog`;

  constructor(private http: HttpClient) {}

  /**
   * Get all metrics (without pagination for selection)
   */
  getMetrics(): Observable<MetricCatalog[]> {
    // Request with large pageSize to get all items
    const params = new HttpParams().set('pageSize', '1000');
    return this.http.get<PaginatedResponse<MetricCatalog>>(this.apiUrl, { params })
      .pipe(
        map(response => response.items || [])
      );
  }

  /**
   * Get paginated metrics
   */
  getMetricsPaginated(page: number = 1, pageSize: number = 20): Observable<PaginatedResponse<MetricCatalog>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<MetricCatalog>>(this.apiUrl, { params });
  }

  /**
   * Get a single metric by ID
   */
  getMetric(id: string): Observable<MetricCatalog> {
    return this.http.get<MetricCatalog>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all groups
   */
  getGroups(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/groups`);
  }
}

