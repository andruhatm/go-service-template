import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Dashboard {
  id: string;
  userId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardListResponse {
  items: Dashboard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateDashboardRequest {
  userId: string;
  data: any;
}

export interface UpdateDashboardRequest {
  data: any;
}

export interface Widget {
  id: string;
  type: 'line-chart' | 'bar-chart' | 'gauge';
  title: string;
  metricName: string;
  metricId: string;
  objectName: string;
  objectId: string;
  position: { x: number; y: number; w: number; h: number };
}

export interface DashboardData {
  widgets: Widget[];
  layout: any[];
}

export interface MetricsQueryRequest {
  metricName: string;
  objectName: string;
  startTime: number;
  endTime: number;
  step: number;
}

export interface MetricsQueryResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: { [key: string]: string };
      values: Array<[number, string]>;
    }>;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  // Get all dashboards with optional user filter
  getDashboards(userId?: string, page: number = 1, pageSize: number = 20): Observable<DashboardListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (userId) {
      params = params.set('user_id', userId);
    }

    return this.http.get<DashboardListResponse>(`${this.apiUrl}/dashboards`, { params });
  }

  // Get dashboard by ID
  getDashboard(id: string): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.apiUrl}/dashboards/${id}`);
  }

  // Create new dashboard (requires ROLE_ADMIN)
  createDashboard(request: CreateDashboardRequest): Observable<Dashboard> {
    return this.http.post<Dashboard>(`${this.apiUrl}/dashboards`, request);
  }

  // Update dashboard (requires ROLE_ADMIN)
  updateDashboard(id: string, request: UpdateDashboardRequest): Observable<Dashboard> {
    return this.http.put<Dashboard>(`${this.apiUrl}/dashboards/${id}`, request);
  }

  // Delete dashboard (requires ROLE_ADMIN)
  deleteDashboard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dashboards/${id}`);
  }

  // Get or create dashboard for user
  getOrCreateDashboard(userId: string): Observable<Dashboard> {
    return new Observable(observer => {
      // First try to get existing dashboard for user
      this.getDashboards(userId, 1, 1).subscribe({
        next: (response) => {
          if (response.items && response.items.length > 0) {
            // Dashboard exists, return it
            observer.next(response.items[0]);
            observer.complete();
          } else {
            // No dashboard exists, create a new one with empty data
            const createRequest: CreateDashboardRequest = {
              userId: userId,
              data: { widgets: [], layout: [] }
            };
            this.createDashboard(createRequest).subscribe({
              next: (dashboard) => {
                observer.next(dashboard);
                observer.complete();
              },
              error: (error) => {
                observer.error(error);
              }
            });
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // Query metrics from VictoriaMetrics
  queryMetrics(request: MetricsQueryRequest): Observable<MetricsQueryResponse> {
    return this.http.post<MetricsQueryResponse>(`${this.apiUrl}/metrics/query`, request);
  }
}

