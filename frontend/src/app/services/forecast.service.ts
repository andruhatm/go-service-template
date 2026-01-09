import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Forecast {
  id: string;
  user_id: string;
  mon_object_name: string;
  metric_name: string;
  from_timestamp: number;
  forecast_periods: number;
  freq: string;
  step: string;
  seasonality_mode: string;
  changepoint_prior_scale: number;
  status: string;
  forecast_start_date?: string;
  forecast_end_date?: string;
  forecast_points?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ForecastCreateRequest {
  mon_object_name: string;
  metric_name: string;
  from_timestamp: number;
  forecast_periods: number;
  freq?: string;
  step?: string;
  seasonality_mode?: string;
  changepoint_prior_scale?: number;
}

export interface ForecastListResponse {
  forecasts: Forecast[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiUrl = `${environment.api}/forecasts`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new forecast
   */
  createForecast(request: ForecastCreateRequest): Observable<Forecast> {
    return this.http.post<Forecast>(this.apiUrl, request);
  }

  /**
   * Get a specific forecast by ID
   */
  getForecast(id: string): Observable<Forecast> {
    return this.http.get<Forecast>(`${this.apiUrl}/${id}`);
  }

  /**
   * List forecasts for the current user
   */
  listForecasts(limit: number = 50, offset: number = 0): Observable<ForecastListResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<ForecastListResponse>(this.apiUrl, { params });
  }

  /**
   * List all forecasts (admin only)
   */
  listAllForecasts(limit: number = 50, offset: number = 0): Observable<ForecastListResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<ForecastListResponse>(`${this.apiUrl}/all`, { params });
  }

  /**
   * Delete a forecast
   */
  deleteForecast(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Helper method to calculate timestamp for X days ago
   */
  getDaysAgoTimestamp(days: number): number {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return Math.floor(daysAgo.getTime() / 1000);
  }

  /**
   * Helper method to get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'pending':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Helper method to get status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'processing':
        return 'hourglass_empty';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  }
}

